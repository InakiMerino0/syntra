import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@synta/ui';
import Landing from './screens/Landing';
import Panel from './screens/Panel';
import Mapa from './screens/Mapa';
import Procesando from './screens/Procesando';
import Lote from './screens/Lote';
import Trazabilidad from './screens/Trazabilidad';
import Informe from './screens/Informe';
import Accion from './screens/Accion';
import Plan from './screens/Plan';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppLayout />}>
        <Route path="/panel" element={<Panel />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/procesando/:loteId" element={<Procesando />} />
        <Route path="/lote/:loteId" element={<Lote />} />
        <Route path="/trazabilidad" element={<Trazabilidad />} />
        <Route path="/informe" element={<Informe />} />
        <Route path="/pasaporte" element={<Navigate to="/informe" replace />} />
        <Route path="/accion" element={<Accion />} />
        <Route path="/plan" element={<Plan />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
