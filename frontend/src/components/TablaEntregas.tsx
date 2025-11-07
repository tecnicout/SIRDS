import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import type { EntregaCiclo } from '../interfaces/EntregaCiclo';
import entregasService from '../services/entregasService';
import { useAuth } from '../contexts/AuthContext';

interface EstadoEntregaDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (estado: string, observaciones: string) => void;
  entrega: EntregaCiclo | null;
}

const estadosEntrega = [
  { value: 'procesado', label: 'Procesado', color: 'primary' },
  { value: 'entregado', label: 'Entregado', color: 'success' },
  { value: 'omitido', label: 'Omitido', color: 'error' }
] as const;

const EstadoEntregaDialog = ({
  open,
  onClose,
  onConfirm,
  entrega
}: EstadoEntregaDialogProps) => {
  const [estado, setEstado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (entrega) {
      setEstado(entrega.estado);
      setObservaciones(entrega.observaciones || '');
    }
  }, [entrega]);

  const handleConfirm = () => {
    onConfirm(estado, observaciones);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Actualizar Estado de Entrega</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            select
            fullWidth
            label="Estado"
            value={estado}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstado(e.target.value)}
            margin="normal"
          >
            {estadosEntrega.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Observaciones"
            value={observaciones}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setObservaciones(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TablaEntregas = () => {
  const { user } = useAuth();
  const [entregas, setEntregas] = useState<EntregaCiclo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaCiclo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadEntregas = async () => {
    try {
      setLoading(true);
      const response = await entregasService.getEntregas();
      setEntregas(response.data.entregas);
      setError('');
    } catch (err) {
      setError('Error al cargar entregas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntregas();
  }, []);

  const handleEstadoChange = async (estado: string, observaciones: string) => {
    if (!selectedEntrega) return;

    try {
      await entregasService.actualizarEstado(
        selectedEntrega.id_empleado_ciclo,
        estado,
        observaciones
      );
      await loadEntregas();
      setSnackbar({
        open: true,
        message: 'Estado actualizado correctamente',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error al actualizar estado',
        severity: 'error'
      });
    }
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Entregas del Ciclo Activo</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadEntregas}
          variant="outlined"
        >
          Actualizar
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Identificación</TableCell>
              <TableCell>Área</TableCell>
              <TableCell>Kit</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Última Actualización</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entregas.map((entrega) => (
              <TableRow key={entrega.id_empleado_ciclo}>
                <TableCell>
                  {entrega.nombre} {entrega.apellido}
                </TableCell>
                <TableCell>{entrega.identificacion}</TableCell>
                <TableCell>{entrega.nombre_area}</TableCell>
                <TableCell>{entrega.nombre_kit}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      estadosEntrega.find((e) => e.value === entrega.estado)
                        ?.label || entrega.estado
                    }
                    color={
                      (estadosEntrega.find((e) => e.value === entrega.estado)
                        ?.color as any) || 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(entrega.fecha_actualizacion).toLocaleString()}
                  {entrega.actualizado_por_nombre && (
                    <Typography variant="caption" display="block">
                      por {entrega.actualizado_por_nombre}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => {
                      setSelectedEntrega(entrega);
                      setDialogOpen(true);
                    }}
                    color="primary"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EstadoEntregaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleEstadoChange}
        entrega={selectedEntrega}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TablaEntregas;