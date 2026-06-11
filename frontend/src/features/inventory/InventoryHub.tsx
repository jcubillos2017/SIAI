import { useNavigate } from "react-router-dom";
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from "@mui/material";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import MonitorIcon from "@mui/icons-material/Monitor";

const INVENTORY_CATEGORIES = [
  {
    key: "computers",
    label: "Desktop y Móviles",
    description: "Computadores de escritorio, Notebooks.",
    path: "/admin/inventory/computers",
    icon: DesktopWindowsIcon,
  },
  {
    key: "monitors",
    label: "Monitores",
    description: "",
    path: "/admin/inventory/monitors",
    icon: MonitorIcon,
  },
];

export default function InventoryHub() {
  const nav = useNavigate();

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>Inventario</Typography>
      <Typography sx={{ opacity: 0.8, mb: 3 }}>
        Selecciona la categoría de activos que deseas gestionar.
      </Typography>

      <Grid container spacing={2}>
        {INVENTORY_CATEGORIES.map((cat) => (
          <Grid key={cat.key} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined">
              <CardActionArea onClick={() => nav(cat.path)}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <cat.icon />
                    {cat.label}
                  </Typography>
                  <Typography sx={{ opacity: 0.8, mt: 1 }}>{cat.description}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
