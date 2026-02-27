// src/features/admin/DashboardHome.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardActionArea, CardContent, Grid, Typography } from "@mui/material";

import { MODULES } from "@/app/modules";
import { useMe } from "@/features/auth/useMe";

export default function DashboardHome() {
  const nav = useNavigate();
  const me = useMe();

  const visibleModules = useMemo(() => {
    const user = me.data;
    if (!user) return [];
    if (user.role === "admin") return MODULES;

    const allowed = new Set(user.allowed_modules || []);
    return MODULES.filter((m) => allowed.has(m.key));
  }, [me.data]);

  return (
    <Grid container spacing={2}>
      {visibleModules.map((m) => (
        <Grid key={m.key} size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined">
            <CardActionArea onClick={() => nav(m.path)}>
              <CardContent>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <m.icon/> {m.label}
                </Typography>
                <Typography sx={{ opacity: 0.8, mt: 1 }}>{m.description}</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}