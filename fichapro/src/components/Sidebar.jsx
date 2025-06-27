import { Home, Users, PlusCircle, ClipboardList, LogOut, BookOpen, FileText } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import usePerfisUsuario from '../hooks/usePerfisUsuario';

export default function Sidebar() {
  const navigate = useNavigate();
  const { perfis } = usePerfisUsuario();
  const vinculo = perfis[0];
  const perfil = vinculo?.perfil;
  const isAdmin = perfil === 'administrador';
  const isMaster = perfil === 'master';
  const isRedator = perfil === 'redator';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    navigate('/login');
  }

  return (
    <aside className="h-screen w-64 bg-gray-900 text-white flex flex-col p-4 gap-4 fixed shadow-lg">
      <h2 className="text-2xl font-bold mb-6 cursor-pointer">
        <span onClick={() => navigate(isAdmin ? "/" : `/restaurantes/${vinculo?.restaurante}`)}>FichaPro</span>
      </h2>
      <nav className="flex flex-col gap-2 flex-1">
        {(isAdmin || isMaster || isRedator) ? (
          <>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 bg-transparent hover:bg-gray-800 p-2 rounded text-left w-full"
              style={{ color: 'inherit' }}
            >
              <Home size={20} /> Dashboard
            </button>
            <NavLink to="/restaurantes" className={({ isActive }) => isActive ? "flex items-center gap-2 bg-gray-800 p-2 rounded" : "flex items-center gap-2 hover:bg-gray-800 p-2 rounded"}>
              <ClipboardList size={20} /> Restaurantes
            </NavLink>
            {isAdmin && (
              <>
                <NavLink to="/usuarios" className={({ isActive }) => isActive ? "flex items-center gap-2 bg-gray-800 p-2 rounded" : "flex items-center gap-2 hover:bg-gray-800 p-2 rounded"}>
                  <Users size={20} /> Usuários
                </NavLink>
                <NavLink to="/registros-atividade" className={({ isActive }) => isActive ? "flex items-center gap-2 bg-gray-800 p-2 rounded" : "flex items-center gap-2 hover:bg-gray-800 p-2 rounded"}>
                  <FileText size={20} /> Registros de Atividade
                </NavLink>
              </>
            )}
          </>
        ) : (
          <NavLink to="/restaurantes" className={({ isActive }) => isActive ? "flex items-center gap-2 bg-gray-800 p-2 rounded" : "flex items-center gap-2 hover:bg-gray-800 p-2 rounded"}>
            <ClipboardList size={20} /> Restaurante
          </NavLink>
        )}
      </nav>
      <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded mt-8 transition">
        <LogOut size={20} /> Sair
      </button>
    </aside>
  );
} 