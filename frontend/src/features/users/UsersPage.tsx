// src/features/users/UsersPage.tsx
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import {
  DataGrid,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import type {
  GridColDef,
  GridRowParams,
} from "@mui/x-data-grid";

import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import KeyIcon from "@mui/icons-material/Key";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/shared/api/http";
import type { UserPublic } from "@/shared/api/types";
import { useMe } from "@/features/auth/useMe";

import SetPasswordDialog from "./SetPasswordDialog";
import CreateUserDialog from "./CreateUserDialog";
import type { CreateUserForm } from "./forms";

type ResetPasswordResponse = { temporary_password: string };
type SetPasswordPayload = { new_password: string; force_change: boolean };
type SetPasswordResponse = { ok: boolean; must_change_password: boolean };
type CreateUserResponse = { user: UserPublic; temporary_password: string };

export default function UsersPage() {
  const qc = useQueryClient();
  const me = useMe();

  const [snack, setSnack] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwUser, setPwUser] = useState<UserPublic | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => apiJson<UserPublic[]>("/users/"),
  });

  const refresh = () => usersQuery.refetch();

  const createUser = useMutation({
    mutationFn: async (payload: CreateUserForm) => {
      const body = {
        email: payload.email,
        full_name: payload.full_name || null,
        role: "user",
        allowed_modules: payload.allowed_modules || [],
      };

      return apiJson<CreateUserResponse>("/users/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["users"] });

      const pwd = data.temporary_password;
      try {
        await navigator.clipboard.writeText(pwd);
        setSnack({ type: "success", msg: `Usuario creado ✅ Password temporal (copiado): ${pwd}` });
      } catch {
        setSnack({ type: "success", msg: `Usuario creado ✅ Password temporal: ${pwd}` });
      }
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Error al crear usuario";
      setSnack({ type: "error", msg });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (u: UserPublic) => {
      return apiJson<UserPublic>(`/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !u.is_active }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      setSnack({ type: "success", msg: "Estado actualizado ✅" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Error al actualizar";
      setSnack({ type: "error", msg });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (u: UserPublic) => {
      return apiJson<ResetPasswordResponse>(`/users/${u.id}/reset-password`, {
        method: "POST",
      });
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      const pwd = data.temporary_password;

      try {
        await navigator.clipboard.writeText(pwd);
        setSnack({ type: "success", msg: `Password temporal (copiado): ${pwd}` });
      } catch {
        setSnack({ type: "success", msg: `Password temporal: ${pwd}` });
      }
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Error al resetear password";
      setSnack({ type: "error", msg });
    },
  });

  const setPassword = useMutation({
    mutationFn: async (vars: { userId: string; payload: SetPasswordPayload }) => {
      return apiJson<SetPasswordResponse>(`/users/${vars.userId}/set-password`, {
        method: "POST",
        body: JSON.stringify(vars.payload),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      setSnack({ type: "success", msg: "Contraseña actualizada ✅" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Error al cambiar contraseña";
      setSnack({ type: "error", msg });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (u: UserPublic) => {
      return apiJson<{ ok: boolean }>(`/users/${u.id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      setSnack({ type: "success", msg: "Usuario eliminado ✅" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Error al eliminar usuario";
      setSnack({ type: "error", msg });
    },
  });

  const rows = usersQuery.data ?? [];

  const myId = me.data?.id;

  const isSelf = useCallback(
    (u: UserPublic) => myId === u.id,
    [myId]
  );

  const actionsDisabled = useCallback(
    (u: UserPublic) => u.role === "admin" || isSelf(u),
    [isSelf]
  );

  // Handlers memoizados (evitan warnings del React Compiler)
  const onToggle = useCallback(
    (u: UserPublic) => {
      const label = u.is_active ? "Bloquear" : "Desbloquear";
      const ok = confirm(`${label} a ${u.email}?`);
      if (ok) toggleActive.mutate(u);
    },
    [toggleActive]
  );

  const onReset = useCallback(
    (u: UserPublic) => {
      const ok = confirm(`Reset password de ${u.email}? Se revocarán sesiones (refresh tokens).`);
      if (ok) resetPassword.mutate(u);
    },
    [resetPassword]
  );

  const onOpenSetPw = useCallback((u: UserPublic) => {
    setPwUser(u);
    setPwOpen(true);
  }, []);

  const onDelete = useCallback(
    (u: UserPublic) => {
      const ok = confirm(`Eliminar a ${u.email}? Esta acción NO se puede deshacer.`);
      if (ok) deleteUser.mutate(u);
    },
    [deleteUser]
  );

  const columns = useMemo<GridColDef<UserPublic>[]>(() => {
    return [
      { field: "email", headerName: "Email", flex: 1.2, minWidth: 220 },
      { field: "full_name", headerName: "Nombre", flex: 1, minWidth: 180 },
      { field: "role", headerName: "Rol", width: 110 },
      {
        field: "is_active",
        headerName: "Estado",
        width: 120,
        valueGetter: (_v, row) => (row.is_active ? "Activo" : "Bloqueado"),
      },
      {
        field: "allowed_modules",
        headerName: "Módulos",
        flex: 1.2,
        minWidth: 220,
        valueGetter: (_v, row) => (row.allowed_modules || []).join(", "),
      },
      {
        field: "must_change_password",
        headerName: "Debe cambiar pw",
        width: 150,
        valueGetter: (_v, row) => (row.must_change_password ? "Sí" : "No"),
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Acciones",
        width: 240,
        getActions: (params: GridRowParams<UserPublic>) => {
          const u = params.row;
          const disabled = actionsDisabled(u);

          const toggleLabel = u.is_active ? "Bloquear" : "Desbloquear";
          const ToggleIcon = u.is_active ? BlockIcon : LockOpenIcon;

          return [
            <GridActionsCellItem
              key="toggle"
              icon={
                <Tooltip title={toggleLabel}>
                  <span><ToggleIcon /></span>
                </Tooltip>
              }
              label={toggleLabel}
              disabled={disabled || toggleActive.isPending}
              onClick={() => onToggle(u)}
            />,
            <GridActionsCellItem
              key="reset"
              icon={
                <Tooltip title="Reset password">
                  <span><RestartAltIcon /></span>
                </Tooltip>
              }
              label="Reset"
              disabled={disabled || resetPassword.isPending}
              onClick={() => onReset(u)}
            />,
            <GridActionsCellItem
              key="setpw"
              icon={
                <Tooltip title="Cambiar contraseña">
                  <span><KeyIcon /></span>
                </Tooltip>
              }
              label="Cambiar contraseña"
              disabled={disabled || setPassword.isPending}
              onClick={() => onOpenSetPw(u)}
            />,
            <GridActionsCellItem
              key="delete"
              icon={
                <Tooltip title="Eliminar">
                  <span><DeleteIcon /></span>
                </Tooltip>
              }
              label="Eliminar"
              disabled={disabled || deleteUser.isPending}
              onClick={() => onDelete(u)}
              showInMenu
            />,
          ];
        },
      },
    ];
  }, [
    actionsDisabled,
    onToggle,
    onReset,
    onOpenSetPw,
    onDelete,
    toggleActive,
    resetPassword,
    deleteUser,
    setPassword,
  ]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5">Usuarios</Typography>
          <Typography sx={{ opacity: 0.8 }}>
            Crear usuario, bloquear/desbloquear, reset, cambiar contraseña y eliminar.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Crear usuario
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refresh}
            disabled={usersQuery.isFetching}
          >
            Recargar
          </Button>
        </Stack>
      </Stack>

      {usersQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(usersQuery.error as Error)?.message || "Error cargando usuarios"}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(r) => r.id}
              loading={usersQuery.isLoading || usersQuery.isFetching}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
            />
          </Box>
        </Grid>
      </Grid>

      <CreateUserDialog
        open={createOpen}
        loading={createUser.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (vals) => {await createUser.mutateAsync(vals)}}
      />

      <SetPasswordDialog
        open={pwOpen}
        email={pwUser?.email}
        loading={setPassword.isPending}
        onClose={() => setPwOpen(false)}
        onSubmit={async (vals) => {
          if (!pwUser) return;
          await setPassword.mutateAsync({ userId: pwUser.id, payload: vals });
        }}
      />

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack?.type ?? "info"}
          onClose={() => setSnack(null)}
          sx={{ width: "100%" }}
        >
          {snack?.msg ?? ""}
        </Alert>
      </Snackbar>
    </Box>
  );
}