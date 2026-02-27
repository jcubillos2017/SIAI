import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { Outlet, Link as RouterLink, useNavigate } from "react-router-dom";
import { clearTokens } from "@/features/auth/auth";

export default function AdminLayout() {
  const nav = useNavigate();

  const logout = () => {
    clearTokens();
    nav("/login", { replace: true });
  };

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky">
        <Toolbar sx={{ display: "flex", gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>SIAI Admin</Typography>
          <Button component={RouterLink} to="/admin/users" color="inherit">Usuarios</Button>
          <Button component={RouterLink} to="/admin/imports" color="inherit">Importaciones</Button>
          <Button onClick={logout} color="inherit">Salir</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  );
}