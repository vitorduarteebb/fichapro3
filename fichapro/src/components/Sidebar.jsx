import { Home, Users, PlusCircle, ClipboardList, LogOut, BookOpen, FileText, Menu, Package } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import usePerfisUsuario from '../hooks/usePerfisUsuario';
import UsuarioModal from './UsuarioModal';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { perfis } = usePerfisUsuario();
  const vinculo = perfis[0];
  const perfil = vinculo?.perfil;
  const isAdmin = perfil === 'administrador';
  const isMaster = perfil === 'master';
  const isRedator = perfil === 'redator';

  const [usuario, setUsuario] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/me/', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => setUsuario(data));
  }, []);

  // Função para fechar sidebar no mobile
  function fecharSidebar() {
    if (setMobileOpen) setMobileOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    navigate('/login');
  }

  return (
    <>
      {/* Overlay para mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-200 md:hidden ${mobileOpen ? '' : 'pointer-events-none opacity-0'}`}
        onClick={fecharSidebar}
        style={{ backdropFilter: mobileOpen ? 'blur(2px)' : 'none' }}
      />
      <aside
        className={`fixed z-50 top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col p-4 gap-4 shadow-lg transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:fixed md:top-0 md:left-0 md:h-screen md:shadow-lg`}
        style={{ minWidth: 240 }}
      >
        {/* Botão fechar no mobile */}
        <button
          className="absolute top-4 right-4 md:hidden bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-xl text-white"
          onClick={fecharSidebar}
          aria-label="Fechar menu"
        >×</button>
        <h2 className="text-2xl font-bold mb-6 cursor-pointer">
          <span onClick={() => { fecharSidebar(); navigate(isAdmin ? "/" : `/restaurantes/${vinculo?.restaurante}`); }}>FichaPro</span>
        </h2>
        <div className="flex items-center gap-3 mb-6 mt-2 cursor-pointer" onClick={() => setModalAberto(true)}>
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 uppercase text-lg">
            {usuario ? (usuario.first_name ? usuario.first_name[0] : usuario.username[0]) : '?' }
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-100 text-base leading-tight">{usuario ? (usuario.first_name || usuario.username) : 'Usuário'}</span>
            <span className="text-gray-300 text-xs leading-tight">{usuario?.email}</span>
          </div>
        </div>
        <UsuarioModal open={modalAberto} onClose={() => setModalAberto(false)} usuario={usuario} atualizarUsuario={() => {}} />
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
              <NavLink to="/insumos" className={({ isActive }) => isActive ? "flex items-center gap-2 bg-gray-800 p-2 rounded" : "flex items-center gap-2 hover:bg-gray-800 p-2 rounded"}>
                <Package size={20} /> Insumos
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
    </>
  );
} 