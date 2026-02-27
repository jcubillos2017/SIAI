// src/features/inventory/InventoryPage.tsx
import { useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";

import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";

import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/shared/api/http";
import type { Computer, ComputerListResponse } from "@/shared/api/types";
import { useMe } from "@/features/auth/useMe";

import CreateComputerDialog from "./CreateComputerDialog";
import EditComputerDialog from "./EditComputerDialog";
import type { ComputerForm } from "./forms";

function buildParams(obj: Record<string, string>, page: number, pageSize: number) {
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("page_size", String(pageSize));
  Object.entries(obj).forEach(([k, v]) => {
    if (v.trim()) p.set(k, v.trim());
  });
  return p.toString();
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const me = useMe();
  const isAdmin = me.data?.role === "admin";

  // filtros “draft” (lo que el usuario escribe)
  const [draft, setDraft] = useState({
    q: "",
    inventory_code: "",
    hostname: "",
    serial_number: "",
    brand: "",
    model: "",
  });

  // filtros aplicados (los que realmente consultan API)
  const [filters, setFilters] = useState(draft);

  const [pagination, setPagination] = useState({ page: 0, pageSize: 25 });

  const [selected, setSelected] = useState<Computer | null>(null);

  // dialogs create/edit
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Computer | null>(null);

  const [snack, setSnack] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const queryKey = useMemo(
    () => ["computers", filters, pagination.page, pagination.pageSize],
    [filters, pagination.page, pagination.pageSize]
  );

  const listQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const params = buildParams(filters, pagination.page + 1, pagination.pageSize);
      return apiJson<ComputerListResponse>(`/computers/?${params}`);
    },
  });

  const createComputer = useMutation({
    mutationFn: async (payload: ComputerForm) => {
      return apiJson<Computer>("/computers/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["computers"] });
      setSnack({ type: "success", msg: "Computador creado ✅" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Error al crear computador";
      setSnack({ type: "error", msg });
    },
  });

  const updateComputer = useMutation({
    mutationFn: async (vars: { id: string; payload: ComputerForm }) => {
      return apiJson<Computer>(`/computers/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify(vars.payload),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["computers"] });
      setSnack({ type: "success", msg: "Computador actualizado ✅" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Error al actualizar computador";
      setSnack({ type: "error", msg });
    },
  });

  const deleteComputer = useMutation({
    mutationFn: async (id: string) => {
      return apiJson<{ ok: boolean }>(`/computers/${id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["computers"] });
      setSnack({ type: "success", msg: "Computador eliminado ✅" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Error al eliminar computador";
      setSnack({ type: "error", msg });
    },
  });

  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;

  const applySearch = () => {
    setPagination((p) => ({ ...p, page: 0 }));
    setFilters(draft);
  };

  const clearSearch = () => {
    const empty = { q: "", inventory_code: "", hostname: "", serial_number: "", brand: "", model: "" };
    setDraft(empty);
    setFilters(empty);
    setPagination((p) => ({ ...p, page: 0 }));
  };

  const baseColumns = useMemo<GridColDef<Computer>[]>(() => {
    return [
      { field: "inventory_code", headerName: "Código", minWidth: 130, flex: 0.6 },
      { field: "hostname", headerName: "Nombre Equipo", minWidth: 180, flex: 0.9 },
      { field: "serial_number", headerName: "Serie", minWidth: 170, flex: 0.9 },
      { field: "brand", headerName: "Marca", minWidth: 120, flex: 0.6 },
      { field: "model", headerName: "Modelo", minWidth: 140, flex: 0.7 },
      { field: "memory_raw", headerName: "Memoria", minWidth: 110, flex: 0.5 },
      { field: "equipment_type", headerName: "Tipo", minWidth: 120, flex: 0.55 },
      { field: "cpu", headerName: "CPU", minWidth: 170, flex: 1 },
      { field: "gpu", headerName: "GPU", minWidth: 170, flex: 1 },
      { field: "storage_raw", headerName: "Disco", minWidth: 120, flex: 0.6 },
      { field: "acquisition_type", headerName: "Adquisición", minWidth: 140, flex: 0.6 },
    ];
  }, []);

  const onEdit = useCallback((c: Computer) => {
    setEditTarget(c);
    setEditOpen(true);
  }, []);

  const onDelete = useCallback((c: Computer) => {
    const ok = confirm(`Eliminar computador ${c.inventory_code} (${c.hostname})? Esta acción NO se puede deshacer.`);
    if (ok) deleteComputer.mutate(c.id);
  }, [deleteComputer]);

  const columns = useMemo<GridColDef<Computer>[]>(() => {
    if (!isAdmin) return baseColumns;

    const actionsCol: GridColDef<Computer> = {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 120,
      getActions: (params: GridRowParams<Computer>) => {
        const c = params.row;
        return [
          <GridActionsCellItem
            key="edit"
            icon={
              <Tooltip title="Editar">
                <span><EditIcon /></span>
              </Tooltip>
            }
            label="Editar"
            onClick={() => onEdit(c)}
            disabled={updateComputer.isPending}
          />,
          <GridActionsCellItem
            key="delete"
            icon={
              <Tooltip title="Eliminar">
                <span><DeleteIcon /></span>
              </Tooltip>
            }
            label="Eliminar"
            onClick={() => onDelete(c)}
            disabled={deleteComputer.isPending}
            showInMenu
          />,
        ];
      },
    };

    return [...baseColumns, actionsCol];
  }, [
    isAdmin,
    baseColumns,
    onEdit,
    onDelete,
    updateComputer.isPending,
    deleteComputer.isPending,
  ]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5">Inventario</Typography>
          <Typography sx={{ opacity: 0.8 }}>
            Computadores importados (búsqueda, detalle y gestión).
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Agregar computador
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
          >
            Recargar
          </Button>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Búsqueda libre"
            value={draft.q}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
            fullWidth
          />
          <Button variant="contained" onClick={applySearch}>
            Buscar
          </Button>
          <Button variant="outlined" onClick={clearSearch}>
            Limpiar
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField
            label="Código"
            value={draft.inventory_code}
            onChange={(e) => setDraft((d) => ({ ...d, inventory_code: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Hostname"
            value={draft.hostname}
            onChange={(e) => setDraft((d) => ({ ...d, hostname: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Serie"
            value={draft.serial_number}
            onChange={(e) => setDraft((d) => ({ ...d, serial_number: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Marca"
            value={draft.brand}
            onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Modelo"
            value={draft.model}
            onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
            fullWidth
          />
        </Stack>
      </Stack>

      {listQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(listQuery.error as Error)?.message || "Error cargando inventario"}
        </Alert>
      )}

      {/* Tabla */}
      <Box sx={{ height: 640 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          loading={listQuery.isLoading || listQuery.isFetching}
          disableRowSelectionOnClick
          paginationMode="server"
          rowCount={total}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          onRowDoubleClick={(params) => setSelected(params.row as Computer)}
        />
      </Box>

      {/* Detalle (doble click) */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>Detalle computador</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={1} sx={{ pt: 1 }}>
              <Typography><strong>Código:</strong> {selected.inventory_code}</Typography>
              <Typography><strong>Hostname:</strong> {selected.hostname}</Typography>
              <Typography><strong>Serie:</strong> {selected.serial_number}</Typography>
              <Typography><strong>Marca:</strong> {selected.brand ?? "-"}</Typography>
              <Typography><strong>Modelo:</strong> {selected.model ?? "-"}</Typography>
              <Typography><strong>Memoria:</strong> {selected.memory_raw ?? "-"}</Typography>
              <Typography><strong>Tipo:</strong> {selected.equipment_type ?? "-"}</Typography>
              <Typography><strong>CPU:</strong> {selected.cpu ?? "-"}</Typography>
              <Typography><strong>GPU:</strong> {selected.gpu ?? "-"}</Typography>
              <Typography><strong>Disco:</strong> {selected.storage_raw ?? "-"}</Typography>
              <Typography><strong>Adquisición:</strong> {selected.acquisition_type ?? "-"}</Typography>
              <Typography sx={{ opacity: 0.8 }}>
                <strong>Última importación:</strong> {new Date(selected.last_imported_at).toLocaleString()}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Crear */}
      <CreateComputerDialog
        open={createOpen}
        loading={createComputer.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (vals: ComputerForm) => {
          await createComputer.mutateAsync(vals);
        }}
      />

      {/* Editar */}
      <EditComputerDialog
        open={editOpen}
        loading={updateComputer.isPending}
        computer={editTarget}
        onClose={() => setEditOpen(false)}
        onSubmit={async (vals: ComputerForm) => {
          if (!editTarget) return;
          await updateComputer.mutateAsync({ id: editTarget.id, payload: vals });
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack?.type ?? "info"} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
          {snack?.msg ?? ""}
        </Alert>
      </Snackbar>
    </Box>
  );
}