// src/features/imports/ComputerImportCard.tsx
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import { apiFetch, apiJson } from "@/shared/api/http";
import type {
  ImportCommitResponse,
  ImportPreviewResponse,
} from "@/shared/api/types";

type ErrorRow = {
  id: string;
  row: number;
  field: string;
  message: string;
};

export default function ComputerImportCard() {
  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [commit, setCommit] = useState<ImportCommitResponse | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);

  // filtros de errores (preview y commit)
  const [q, setQ] = useState("");
  const [fieldFilter, setFieldFilter] = useState<string>("__ALL__");
  const [commitErrFilter, setCommitErrFilter] = useState("");

  const downloadTemplate = async () => {
    const res = await apiFetch("/imports/templates/computers.csv", {
      method: "GET",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `No se pudo descargar (HTTP ${res.status})`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_computadores.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const previewFile = async () => {
    if (!file) return;
    setLoadingPreview(true);
    setCommit(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await apiFetch("/imports/computers/preview", {
        method: "POST",
        body: fd,
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const detail =
          typeof data === "object" && data !== null && "detail" in data
            ? String((data as Record<string, unknown>).detail ?? "")
            : `Error ${res.status}`;

        throw new Error(detail);
      }

      setPreview(data as ImportPreviewResponse);
      setQ("");
      setFieldFilter("__ALL__");
    } finally {
      setLoadingPreview(false);
    }
  };

  const commitFile = async () => {
    if (!file) return;
    if (!confirm("¿Importar archivo? Se crearán/actualizarán registros."))
      return;

    setLoadingCommit(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const data = await apiJson<ImportCommitResponse>(
        "/imports/computers/commit",
        {
          method: "POST",
          body: fd,
        },
      );

      setCommit(data);
    } finally {
      setLoadingCommit(false);
    }
  };

  const errorFieldOptions = useMemo(() => {
    const fields = new Set<string>();
    (preview?.errors || []).forEach((e) => {
      fields.add((e.field ?? "").trim() || "(sin campo)");
    });
    return Array.from(fields).sort();
  }, [preview]);

  const errorRows = useMemo<ErrorRow[]>(() => {
    const errors = preview?.errors || [];
    return errors.map((e, idx) => ({
      id: `${e.row}-${e.field ?? "nofield"}-${idx}`,
      row: e.row,
      field: (e.field ?? "").trim() || "(sin campo)",
      message: e.message,
    }));
  }, [preview]);

  const filteredErrorRows = useMemo(() => {
    const query = q.trim().toLowerCase();

    return errorRows.filter((r) => {
      if (fieldFilter !== "__ALL__" && r.field !== fieldFilter) return false;

      if (!query) return true;

      const hay = `${r.row} ${r.field} ${r.message}`.toLowerCase();
      return hay.includes(query);
    });
  }, [errorRows, q, fieldFilter]);

  const errorColumns = useMemo<GridColDef<ErrorRow>[]>(() => {
    return [
      { field: "row", headerName: "Fila", width: 90 },
      { field: "field", headerName: "Campo", width: 180 },
      { field: "message", headerName: "Mensaje", flex: 1, minWidth: 240 },
    ];
  }, []);

  const previewRows = useMemo(() => {
    return (preview?.preview_rows || []).map((r, idx) => ({
      id: idx + 1,
      ...r,
    }));
  }, [preview]);

  const previewCols = useMemo<GridColDef[]>(() => {
    // columnas esperadas para tabla preview (si no hay preview, no se muestra)
    const cols = preview?.expected_columns || [];
    return cols.map((c) => ({
      field: c,
      headerName: c,
      flex: 1,
      minWidth: 160,
      valueGetter: (value: unknown) => value ?? "",
    }));
  }, [preview]);

  const totalErrors = errorRows.length;
  const filteredCount = filteredErrorRows.length;

  const commitErrorRows = useMemo<ErrorRow[]>(() => {
    const errors = commit?.errors || [];
    return errors.map((e, idx) => ({
      id: `c-${e.row}-${e.field ?? "nofield"}-${idx}`,
      row: e.row,
      field: (e.field ?? "").trim() || "(sin campo)",
      message: e.message,
    }));
  }, [commit]);

  const filteredCommitErrors = useMemo(() => {
    const q2 = commitErrFilter.trim().toLowerCase();
    if (!q2) return commitErrorRows;
    return commitErrorRows.filter((r) =>
      `${r.row} ${r.field} ${r.message}`.toLowerCase().includes(q2),
    );
  }, [commitErrorRows, commitErrFilter]);

  return (
    <Card>
      <CardHeader
        title="Computadores"
        action={
          <Button onClick={() => void downloadTemplate()}>
            Descargar plantilla
          </Button>
        }
      />

      <CardContent>
        <Stack spacing={2}>
          {/* Acciones */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ md: "center" }}
          >
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <Button
              variant="outlined"
              onClick={() => void previewFile()}
              disabled={!file || loadingPreview}
            >
              Previsualizar
            </Button>

            <Button
              variant="contained"
              onClick={() => void commitFile()}
              disabled={!file || loadingCommit}
            >
              Importar
            </Button>
          </Stack>

          {/* Estado preview */}
          {preview && (
            <Alert severity={preview.valid ? "success" : "warning"}>
              {preview.valid
                ? "Preview OK ✅ (headers válidos)."
                : "Preview con observaciones ⚠️ (revisa errores/headers)."}
            </Alert>
          )}

          {/* TABLA ERRORES */}
          {preview && (
            <Box>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                alignItems={{ md: "center" }}
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="h6">Errores</Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={`Total: ${totalErrors}`} />
                  <Chip label={`Filtrados: ${filteredCount}`} />
                </Stack>
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                sx={{ mb: 1 }}
              >
                <TextField
                  label="Buscar (fila / campo / mensaje)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  fullWidth
                />

                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Campo</InputLabel>
                  <Select
                    label="Campo"
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(String(e.target.value))}
                  >
                    <MenuItem value="__ALL__">Todos</MenuItem>
                    {errorFieldOptions.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Box sx={{ height: 320 }}>
                <DataGrid
                  rows={filteredErrorRows}
                  columns={errorColumns}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  }}
                  getRowId={(r) => r.id}
                />
              </Box>
            </Box>
          )}

          {/* TABLA PREVIEW (opcional pero útil) */}
          {preview && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Preview (primeras filas)
              </Typography>

              <Box sx={{ height: 360 }}>
                <DataGrid
                  rows={previewRows}
                  columns={previewCols}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Resultado import */}
          {commit && (
            <Box>
              <Alert severity={commit.errors?.length ? "warning" : "success"} sx={{ mb: 1 }}>
                Import finalizado — total: {commit.total_rows} | creados:{" "}
                {commit.created} | actualizados: {commit.updated} | errores:{" "}
                {commit.errors?.length ?? 0}
              </Alert>

              {commitErrorRows.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Filas con error ({commitErrorRows.length})
                  </Typography>

                  <TextField
                    size="small"
                    label="Buscar en errores"
                    value={commitErrFilter}
                    onChange={(e) => setCommitErrFilter(e.target.value)}
                    sx={{ mb: 1, width: 320 }}
                  />

                  <Box sx={{ height: 300 }}>
                    <DataGrid
                      rows={filteredCommitErrors}
                      columns={errorColumns}
                      disableRowSelectionOnClick
                      pageSizeOptions={[10, 25, 50]}
                      initialState={{
                        pagination: { paginationModel: { pageSize: 25, page: 0 } },
                      }}
                      getRowId={(r) => r.id}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Hint */}
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Columnas requeridas: Codigo Inventario, Numero de Serie. Opcionales:
            Nombre Equipo (si está vacío se usa el código), Marca, Modelo,
            Memoria, Tipo de Equipo, Procesador, Tarjeta Video, Disco Duro,
            Tipo de Adquisicion.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
