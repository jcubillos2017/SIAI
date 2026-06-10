import asyncio
import getpass

from app.db.mongodb import init_mongodb
from app.models.user import User
from app.core.security import get_password_hash


async def main():
    await init_mongodb()

    email = input("Email del usuario: ").strip().lower()

    user = await User.find_one(User.email == email)
    if not user:
        print(f"❌ No se encontró usuario con email: {email}")
        return

    print(f"✅ Usuario encontrado: {user.full_name} ({user.role})")

    password = getpass.getpass("Nueva contraseña: ").strip()
    confirm  = getpass.getpass("Confirmar contraseña: ").strip()

    if password != confirm:
        print("❌ Las contraseñas no coinciden.")
        return

    if len(password) < 6:
        print("❌ La contraseña debe tener al menos 6 caracteres.")
        return

    user.password_hash = get_password_hash(password)
    user.must_change_password = False
    await user.save()

    print(f"✅ Contraseña actualizada correctamente para {email}")


if __name__ == "__main__":
    asyncio.run(main())
