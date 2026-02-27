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
import type { Computer } from "@/shared/api/types";

type Props = {
  open: boolean;
  loading?: boolean;
  computer: Computer | null;
  onClose: () => void;
  onSubmit: (data: ComputerForm) => Promise<void> | void;
};

export default function EditComputerDialog({ open, loading, computer, onClose, onSubmit }: Props) {
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
      acquisition_type: "Compra",
    },
  });

  useEffect(() => {
    if (open && computer) {
      reset({
        inventory_code: computer.inventory_code ?? "",
        hostname: computer.hostname ?? "",
        serial_number: computer.serial_number ?? "",
        brand: computer.brand ?? "",
        model: computer.model ?? "",
        memory_raw: computer.memory_raw ?? "",
        equipment_type: computer.equipment_type ?? "",
        cpu: computer.cpu ?? "",
        gpu: computer.gpu ?? "",
        storage_raw: computer.storage_raw ?? "",
        acquisition_type: computer.acquisition_type ?? "Compra",
      });
    }
  }, [open, computer, reset]);

  const submit = async (values: ComputerForm) => {
    try {
      await onSubmit(values);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo actualizar el computador";
      setError("inventory_code", { message: msg });
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Editar computador</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2}>
          {computer && (
            <Alert severity="info">
              Editando: <strong>{computer.inventory_code}</strong>
            </Alert>
          )}

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
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}