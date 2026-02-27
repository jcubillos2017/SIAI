// src/features/users/SetPasswordDialog.tsx
import { useEffect } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  new_password: z.string().min(8, "Mínimo 8 caracteres"),
  force_change: z.boolean(), // 👈 obligatorio (sin default en Zod)
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  email?: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => Promise<void> | void;
};

export default function SetPasswordDialog({ open, email, loading, onClose, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: "", force_change: true }, // 👈 default aquí
  });

  useEffect(() => {
    if (open) reset({ new_password: "", force_change: true });
  }, [open, reset]);

  const submit = async (values: FormValues) => {
    try {
      await onSubmit(values);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cambiar la contraseña";
      setError("new_password", { message: msg });
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Cambiar contraseña</DialogTitle>

      <DialogContent sx={{ pt: 1, display: "grid", gap: 2 }}>
        {email && <Alert severity="info">Usuario: {email}</Alert>}

        <TextField
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          {...register("new_password")}
          error={!!errors.new_password}
          helperText={errors.new_password?.message}
          disabled={!!loading}
        />

        <Controller
          name="force_change"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  disabled={!!loading}
                />
              }
              label="Forzar cambio al iniciar sesión"
            />
          )}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={!!loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit(submit)} disabled={!!loading}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}