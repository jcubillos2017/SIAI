// src/features/inventory/CreateComputerDialog.tsx
import { useEffect } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { computerFormSchema } from "./forms";
import type { ComputerForm } from "./forms";


type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: ComputerForm) => Promise<void> | void;
};

export default function CreateComputerDialog({ open, loading, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<ComputerForm>({
    resolver: zodResolver(computerFormSchema),
    defaultValues: {
      inventory_code: "",
      hostname: "",
      serial_number: "",
      brand: "",
      model: "",
      memory_raw: "",
      equipment_type: "",
      cpu: "",
      gpu: "",
      storage_raw: "",
      acquisition_type: "Compra",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        inventory_code: "",
        hostname: "",
        serial_number: "",
        brand: "",
        model: "",
        memory_raw: "",
        equipment_type: "",
        cpu: "",
        gpu: "",
        storage_raw: "",
        acquisition_type: "Compra",
      });
    }
  }, [open, reset]);

  const submit = async (values: ComputerForm) => {
    try {
      await onSubmit(values);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo crear el computador";
      setError("inventory_code", { message: msg });
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Agregar computador (manual)</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          <Alert severity="info">Esto crea un computador manualmente en Inventario (solo Admin).</Alert>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              label="Código Inventario"
              {...register("inventory_code")}
              error={!!errors.inventory_code}
              helperText={errors.inventory_code?.message}
              disabled={!!loading}
              fullWidth
            />
            <TextField
              label="Nombre Equipo"
              {...register("hostname")}
              error={!!errors.hostname}
              helperText={errors.hostname?.message}
              disabled={!!loading}
              fullWidth
            />
            <TextField
              label="Número de Serie"
              {...register("serial_number")}
              error={!!errors.serial_number}
              helperText={errors.serial_number?.message}
              disabled={!!loading}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField label="Marca" {...register("brand")} disabled={!!loading} fullWidth />
            <TextField label="Modelo" {...register("model")} disabled={!!loading} fullWidth />
            <TextField label="Memoria" {...register("memory_raw")} disabled={!!loading} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField label="Tipo Equipo" {...register("equipment_type")} disabled={!!loading} fullWidth />
            <TextField label="Procesador" {...register("cpu")} disabled={!!loading} fullWidth />
            <TextField label="Tarjeta Video" {...register("gpu")} disabled={!!loading} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField label="Disco Duro" {...register("storage_raw")} disabled={!!loading} fullWidth />
            <TextField
              label="Tipo de Adquisición (Compra/Arriendo)"
              {...register("acquisition_type")}
              disabled={!!loading}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={!!loading}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit(submit)} disabled={!!loading}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}