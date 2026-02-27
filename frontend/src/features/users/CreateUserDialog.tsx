// src/features/users/CreateUserDialog.tsx
import { useEffect } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createUserSchema, MODULE_OPTIONS } from "./forms";
import type { CreateUserForm } from "./forms";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserForm) => Promise<void> | void;
};

export default function CreateUserDialog({ open, loading, onClose, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", full_name: "", allowed_modules: [] },
  });

  useEffect(() => {
    if (open) reset({ email: "", full_name: "", allowed_modules: [] });
  }, [open, reset]);

  const submit = async (values: CreateUserForm) => {
    try {
      await onSubmit(values);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo crear el usuario";
      setError("email", { message: msg });
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Crear usuario</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Alert severity="info">
            Se crea un usuario <strong>de solo lectura</strong>. El admin es único y no se crea desde aquí.
          </Alert>

          <TextField
            label="Email"
            autoComplete="username"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={!!loading}
          />

          <TextField
            label="Nombre"
            {...register("full_name")}
            error={!!errors.full_name}
            helperText={errors.full_name?.message}
            disabled={!!loading}
          />

          <Controller
            name="allowed_modules"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                options={[...MODULE_OPTIONS]}
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                renderTags={(value: readonly string[], getTagProps) =>
                  value.map((option: string, index: number) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Módulos permitidos" placeholder="Selecciona módulos" />
                )}
                disabled={!!loading}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={!!loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit(submit)} disabled={!!loading}>
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
}