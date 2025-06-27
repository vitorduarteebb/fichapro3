import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Dashboard from "../pages/Dashboard";
import Restaurantes from "../pages/Restaurantes";
import CriarNovo from "../pages/CriarNovo";
import Usuarios from "../pages/Usuarios";
import RestauranteForm from "../pages/RestauranteForm";
import RestauranteDetalhe from "../pages/RestauranteDetalhe";
import Insumos from "../pages/Insumos";
import ReceitaForm from "../pages/ReceitaForm";
import FichaTecnicaForm from "../pages/FichaTecnicaForm";
import AcessoNegado from "../pages/AcessoNegado";
import Login from "../pages/Login";
import RotaPrivada from "./RotaPrivada";
import ReceitaDetalhe from '../pages/ReceitaDetalhe';
import FichaTecnicaDetalhe from '../pages/FichaTecnicaDetalhe';
import RegistrosAtividade from "../pages/RegistrosAtividade";

// Layout com sidebar
function LayoutPrivado() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 bg-gray-100 min-h-screen flex justify-center">
        <Outlet />
      </main>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Login SEM sidebar */}
      <Route path="/login" element={<Login />} />
      <Route path="/acesso-negado" element={<AcessoNegado />} />

      {/* Rotas privadas COM sidebar */}
      <Route element={<LayoutPrivado />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/restaurantes" element={<RotaPrivada><Restaurantes /></RotaPrivada>} />
        <Route path="/criar" element={<RotaPrivada><CriarNovo /></RotaPrivada>} />
        <Route path="/usuarios" element={<RotaPrivada><Usuarios /></RotaPrivada>} />
        <Route path="/restaurantes/novo" element={<RotaPrivada><RestauranteForm /></RotaPrivada>} />
        <Route path="/restaurantes/:id" element={<RotaPrivada><RestauranteDetalhe /></RotaPrivada>} />
        <Route path="/restaurantes/:id/insumos" element={<RotaPrivada><Insumos /></RotaPrivada>} />
        <Route path="/restaurantes/:id/receitas/novo" element={<RotaPrivada><ReceitaForm /></RotaPrivada>} />
        <Route path="/receitas/:receitaId/editar" element={<RotaPrivada><ReceitaForm /></RotaPrivada>} />
        <Route path="/restaurantes/:id/fichas-tecnicas" element={<RotaPrivada><FichaTecnicaForm /></RotaPrivada>} />
        <Route path="/restaurantes/:id/fichas-tecnicas/:fichaId/editar" element={<RotaPrivada><FichaTecnicaForm /></RotaPrivada>} />
        <Route path="/restaurantes/:id/fichas-tecnicas/:fichaId" element={<RotaPrivada><FichaTecnicaDetalhe /></RotaPrivada>} />
        <Route path="/receitas/:receitaId" element={<ReceitaDetalhe />} />
        <Route path="/fichas-tecnicas/:fichaId" element={<FichaTecnicaDetalhe />} />
        <Route path="/registros-atividade" element={<RotaPrivada><RegistrosAtividade /></RotaPrivada>} />
      </Route>
    </Routes>
  );
} 