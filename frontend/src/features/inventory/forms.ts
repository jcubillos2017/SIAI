import { z } from "zod";

export const computerFormSchema = z.object({
  inventory_code: z.string().min(1, "Código requerido"),
  hostname: z.string().min(1, "Nombre equipo requerido"),
  serial_number: z.string().min(1, "Serie requerida"),

  brand: z.string().optional(),
  model: z.string().optional(),
  memory_raw: z.string().optional(),
  equipment_type: z.string().optional(),
  cpu: z.string().optional(),
  gpu: z.string().optional(),
  storage_raw: z.string().optional(),
  acquisition_type: z.string().optional(), // Compra / Arriendo
});

export type ComputerForm = z.infer<typeof computerFormSchema>;