import { Container } from '@mui/material';
import EstadisticasEntregas from '../components/EstadisticasEntregas';
import TablaEntregas from '../components/TablaEntregas';

const GestionEntregasPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <EstadisticasEntregas />
      <TablaEntregas />
    </Container>
  );
};

export default GestionEntregasPage;