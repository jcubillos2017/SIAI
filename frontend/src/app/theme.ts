// src/app/theme.ts
import { createTheme } from "@mui/material/styles";
import { esES } from "@mui/material/locale";
import type {} from "@mui/x-data-grid/themeAugmentation"; // para que tome el localeText del DataGrid

export const theme = createTheme(
  {
    palette: {
      mode: "dark",
      background: {
        default: "#0b1020", // ✅ fondo de toda la app
        paper: "#111a33",   // ✅ fondo de Cards/Dialogs/Drawer (paper)
      },
      text: {
        primary: "#E9EEF8",   // ✅ texto principal (títulos, labels)
        secondary: "#B9C2D3", // ✅ texto secundario (subtítulos, helperText)
        disabled: "#6F7A90",  // ✅ deshabilitado
      },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiDataGrid: {
        defaultProps: {
          localeText: {
            paginationRowsPerPage: "Filas por página:", // tu texto
          },
        },
      },
    },
  },
  esES
);