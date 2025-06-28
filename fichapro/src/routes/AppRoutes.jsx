import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Dashboard from "../pages/Dashboard";
import Restaurantes from "../pages/Restaurantes";
import CriarNovo from "../pages/CriarNovo";
import Usuarios from "../pages/Usuarios";
import RestauranteForm from "../pages/RestauranteForm";
import RestauranteDetalhe from "../pages/RestauranteDetalhe";
import Insumos from "../pages/Insumos";
import InsumosLista from "../pages/InsumosLista";
import ReceitaForm from "../pages/ReceitaForm";
import FichaTecnicaForm from "../pages/FichaTecnicaForm";
import AcessoNegado from "../pages/AcessoNegado";
import Login from "../pages/Login";
import RotaPrivada from "./RotaPrivada";
import ReceitaDetalhe from '../pages/ReceitaDetalhe';
import FichaTecnicaDetalhe from '../pages/FichaTecnicaDetalhe';
import RegistrosAtividade from "../pages/RegistrosAtividade";
import InsumoDetalhe from "../pages/InsumoDetalhe";
import InsumoEditar from "../pages/InsumoEditar";
import { useState } from "react";

// Layout com sidebar
function LayoutPrivado() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      {/* Botão menu hambúrguer para mobile */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-900 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="flex-1 p-4 md:p-6 bg-gray-100 min-h-screen flex justify-center transition-all duration-200 md:ml-64">
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
        <Route path="/insumos" element={<RotaPrivada><InsumosLista /></RotaPrivada>} />
        <Route path="/restaurantes/:id/receitas/novo" element={<RotaPrivada><ReceitaForm /></RotaPrivada>} />
        <Route path="/restaurantes/:id/receitas/:receitaId/editar" element={<RotaPrivada><ReceitaForm /></RotaPrivada>} />
        <Route path="/receitas/:receitaId/editar" element={<RotaPrivada><ReceitaForm /></RotaPrivada>} />
        <Route path="/restaurantes/:id/fichas-tecnicas" element={<RotaPrivada><FichaTecnicaForm /></RotaPrivada>} />
        <Route path="/restaurantes/:id/fichas-tecnicas/:fichaId/editar" element={<RotaPrivada><FichaTecnicaForm /></RotaPrivada>} />
        <Route path="/restaurantes/:id/fichas-tecnicas/:fichaId" element={<RotaPrivada><FichaTecnicaDetalhe /></RotaPrivada>} />
        <Route path="/receitas/:receitaId" element={<ReceitaDetalhe />} />
        <Route path="/fichas-tecnicas/:fichaId" element={<FichaTecnicaDetalhe />} />
        <Route path="/registros-atividade" element={<RotaPrivada><RegistrosAtividade /></RotaPrivada>} />
        <Route path="/insumos/:insumoId" element={<InsumoDetalhe />} />
        <Route path="/insumos/:insumoId/editar" element={<InsumoEditar />} />
      </Route>
    </Routes>
  );
} 