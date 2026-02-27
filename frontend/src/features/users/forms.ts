// src/features/users/forms.ts
import { z } from "zod";

export const MODULE_OPTIONS = ["users", "imports", "inventory"] as const;

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().optional(),
  allowed_modules: z.array(z.string()), // ✅ obligatorio (sin default en Zod)
});

export type CreateUserForm = z.infer<typeof createUserSchema>;