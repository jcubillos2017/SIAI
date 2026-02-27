import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import {useState} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { setTokens } from "./auth";
import type { LoginResponse } from "@/shared/api/types";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  
  });

  const onSubmit = async (values: FormValues) => {
  setError(null);

  try {
    const body = new URLSearchParams();
    body.set("username", values.email);
    body.set("password", values.password);

    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      // intenta leer detail del backend si viene
      let detail = "Credenciales inválidas";
      try {
        const data = await res.json();
        if (data?.detail) detail = String(data.detail);
        } catch {
          // ignoramos: si no viene JSON
        }
      throw new Error(detail);
    }

    const data = (await res.json()) as LoginResponse;
    setTokens(data.access_token, data.refresh_token);
    nav("/admin", { replace: true });
  } catch (e: unknown) {
    if (e instanceof Error) {
      setError(e.message);
    } else {      
      setError("No se pudo iniciar sesión");
    }
     }
};
        
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Box sx={{ textAlign: "center"}}>
          <Typography variant="h6" sx={{ mb: 3 }}>SISTEMA INTEGRAL ACTIVOS DE INFORMACIÓN</Typography>
          <Typography sx={{ opacity: 0.8, mb: 3 }}>Ingreso al sistema</Typography>
           {error && (  <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
            </Alert>
          )}
          </Box>
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Password"
              type="password"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Entrar
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}