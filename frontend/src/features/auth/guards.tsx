import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken } from "./auth";
import { useMe } from "./useMe";

export function RequireAuth({ children }: PropsWithChildren) {
  const token = getAccessToken();
  const me = useMe();

  if (!token) return <Navigate to="/login" replace />;
  if (me.isLoading) return <div style={{ padding: 16 }}>Cargando...</div>;
  if (me.isError) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: PropsWithChildren) {
  const me = useMe();

  if (me.isLoading) return <div style={{ padding: 16 }}>Cargando...</div>;
  if (me.isError) return <Navigate to="/login" replace />;
  if (me.data?.role !== "admin") return <Navigate to="/login" replace />;
  return <>{children}</>;
}