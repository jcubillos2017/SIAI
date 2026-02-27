import Grid from "@mui/material/Grid";
import { Card, CardContent, Typography } from "@mui/material";
import ComputerImportCard from "./ComputerImportCard";

export default function ImportsPage() {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ComputerImportCard />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ opacity: 0.75 }}>
          <CardContent>
            <Typography variant="h6">Monitores</Typography>
            <Typography sx={{ opacity: 0.8 }}>
              Próximamente (definimos columnas y armamos card + import).
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}