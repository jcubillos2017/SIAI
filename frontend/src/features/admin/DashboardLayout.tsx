// src/features/admin/DashboardLayout.tsx
import { useMemo, useState } from "react";
import { Outlet, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";

import { clearTokens } from "@/features/auth/auth";
import { useMe } from "@/features/auth/useMe";
import { MODULES } from "@/app/modules";

const DRAWER_WIDTH = 280;

export default function DashboardLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const me = useMe();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleModules = useMemo(() => {
    const user = me.data;
    if (!user) return [];
    if (user.role === "admin") return MODULES;

    const allowed = new Set(user.allowed_modules || []);
    return MODULES.filter((m) => allowed.has(m.key));
  }, [me.data]);

  const logout = () => {
    clearTokens();
    nav("/login", { replace: true });
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">SIAI</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Panel
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flex: 1 }}>
        {visibleModules.map((m) => {
          const selected = location.pathname.startsWith(m.path);
          return (
            <ListItemButton
              key={m.key}
              component={RouterLink}
              to={m.path}
              selected={selected}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>
                <m.icon />
              </ListItemIcon>
              <ListItemText
                primary={m.label}
                secondary={m.description}
                secondaryTypographyProps={{ sx: { opacity: 0.7 } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      <List>
        <ListItemButton onClick={logout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Salir" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* APP BAR: en desktop se corre a la derecha */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ display: "flex", gap: 2 }}>
          {/* Hamburguesa solo en mobile */}
          {!isDesktop && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {me.data?.email ?? ""}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* DRAWER: desktop fijo */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
        open
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      {/* DRAWER: mobile overlay */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }} // mejora performance en mobile
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* MAIN: en desktop también se corre */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          p: 2,
        }}
      >
        {/* separador para el AppBar */}
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}