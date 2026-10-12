import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HoyPage } from './pages/HoyPage';
import { HerramientasPage } from './pages/HerramientasPage';
import { SemanaPage } from './pages/SemanaPage';
import { BibliotecaPage } from './pages/BibliotecaPage';
import { NoEncontradoPage } from './pages/NoEncontradoPage';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HoyPage />} />
        <Route path="herramientas" element={<HerramientasPage />} />
        <Route path="semana" element={<SemanaPage />} />
        <Route path="biblioteca" element={<BibliotecaPage />} />
        <Route path="*" element={<NoEncontradoPage />} />
      </Route>
    </Routes>
  );
}
