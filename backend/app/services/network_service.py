"""
Servicio de red: detección de equipos en línea vía ping ICMP.

- Resuelve el hostname por DNS (la red empresarial debe resolver los nombres).
- Hace ping usando el comando del sistema operativo (no requiere privilegios).
- Soporta Windows y Linux.
- Barrido concurrente controlado por semáforo para no saturar la red.
"""
from __future__ import annotations

import asyncio
import platform
import socket
from datetime import datetime
from typing import Optional

from app.core.config import settings
from app.models.computer import Computer

IS_WINDOWS = platform.system().lower() == "windows"

# Estado del último barrido (para mostrar en el frontend)
sweep_state: dict = {
    "running": False,
    "last_sweep_at": None,
    "last_sweep_duration_s": None,
    "online": 0,
    "offline": 0,
    "total": 0,
}


async def resolve_ip(hostname: str) -> Optional[str]:
    """Resuelve el hostname a IP usando el DNS de la red. None si no resuelve."""
    try:
        loop = asyncio.get_running_loop()
        infos = await asyncio.wait_for(
            loop.getaddrinfo(hostname, None, family=socket.AF_INET),
            timeout=3,
        )
        return infos[0][4][0] if infos else None
    except Exception:
        return None


async def ping_host(host: str, timeout_ms: int | None = None) -> bool:
    """
    Hace un ping ICMP al host. Devuelve True si responde.

    Nota Windows: ping.exe devuelve código 0 incluso ante
    "Destination host unreachable", por eso además validamos
    que la salida contenga "TTL=" (respuesta real del equipo).
    """
    timeout_ms = timeout_ms or settings.PING_TIMEOUT_MS

    if IS_WINDOWS:
        cmd = ["ping", "-n", "1", "-w", str(timeout_ms), host]
    else:
        timeout_s = max(1, timeout_ms // 1000)
        cmd = ["ping", "-c", "1", "-W", str(timeout_s), host]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await asyncio.wait_for(
            proc.communicate(), timeout=(timeout_ms / 1000) + 3
        )
        if proc.returncode != 0:
            return False
        if IS_WINDOWS:
            return b"TTL=" in stdout or b"ttl=" in stdout
        return True
    except Exception:
        return False


async def check_computer(computer: Computer) -> Computer:
    """Verifica un equipo: resuelve IP, hace ping y actualiza su estado en BD."""
    ip = await resolve_ip(computer.hostname)
    online = False
    if ip:
        online = await ping_host(ip)

    now = datetime.utcnow()
    computer.ip_address = ip
    computer.is_online = online
    computer.last_ping_at = now
    if online:
        computer.last_seen_online = now

    await computer.save()
    return computer


async def sweep_all_computers() -> dict:
    """
    Barrido completo: hace ping a todos los equipos del inventario
    de forma concurrente (limitada por PING_CONCURRENCY).
    """
    if sweep_state["running"]:
        return {**sweep_state, "message": "Ya hay un barrido en curso"}

    sweep_state["running"] = True
    started = datetime.utcnow()
    semaphore = asyncio.Semaphore(settings.PING_CONCURRENCY)

    async def _check(c: Computer):
        async with semaphore:
            try:
                await check_computer(c)
            except Exception:
                pass

    try:
        computers = await Computer.find_all().to_list()
        await asyncio.gather(*[_check(c) for c in computers])

        online = sum(1 for c in await Computer.find(Computer.is_online == True).to_list())  # noqa: E712
        total = len(computers)

        sweep_state.update(
            {
                "last_sweep_at": started,
                "last_sweep_duration_s": round(
                    (datetime.utcnow() - started).total_seconds(), 1
                ),
                "online": online,
                "offline": total - online,
                "total": total,
            }
        )
        return dict(sweep_state)
    finally:
        sweep_state["running"] = False


async def background_sweep_loop():
    """Loop infinito: ejecuta un barrido cada PING_INTERVAL_MINUTES."""
    # Pequeña espera inicial para que la app termine de levantar
    await asyncio.sleep(10)
    while True:
        if settings.PING_ENABLED:
            try:
                await sweep_all_computers()
            except Exception:
                pass
        await asyncio.sleep(settings.PING_INTERVAL_MINUTES * 60)
