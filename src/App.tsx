import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HoyPage } from './pages/HoyPage';
import { HerramientasPage } from './pages/HerramientasPage';
import { SemanaPage } from './pages/SemanaPage';
import { BibliotecaPage } from './pages/BibliotecaPage';
import { AjustesPage } from './pages/AjustesPage';
import { HistorialPage } from './pages/HistorialPage';
import { NoEncontradoPage } from './pages/NoEncontradoPage';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HoyPage />} />
        <Route path="herramientas" element={<HerramientasPage />} />
        <Route path="semana" element={<SemanaPage />} />
        <Route path="biblioteca" element={<BibliotecaPage />} />
        <Route path="ajustes" element={<AjustesPage />} />
        <Route path="historial" element={<HistorialPage />} />
        <Route path="habitos" element={<Navigate to="/?editar=1" replace />} />
        <Route path="*" element={<NoEncontradoPage />} />
      </Route>
    </Routes>
  );
}
