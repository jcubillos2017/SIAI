// src/app/modules.ts
import type { ElementType } from "react";
//import type { ReactNode } from "react";
import PeopleIcon from "@mui/icons-material/People";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import Inventory2Icon from "@mui/icons-material/Inventory2";

export type AppModuleKey = "users" | "imports" | "inventory";

export type AppModule = {
  key: AppModuleKey;
  label: string;
  description: string;
  path: string;
  icon: ElementType;
};

export const MODULES: AppModule[] = [
  {
    key: "users",
    label: "Usuarios",
    description: "Gestión de usuarios, bloqueo, reset y permisos.",
    path: "/admin/users",
    icon: PeopleIcon,
  },
  {
    key: "imports",
    label: "Importaciones",
    description: "Carga masiva de plantillas (Computadores, Monitores, etc.).",
    path: "/admin/imports",
    icon: FileUploadIcon,
  },
  {
    key: "inventory",
    label: "Inventario",
    description: "Listado y detalle de activos (Computadores, etc.).",
    path: "/admin/inventory",
    icon: Inventory2Icon,
  },
];