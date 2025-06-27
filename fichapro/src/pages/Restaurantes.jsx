import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';
import usePerfisUsuario from '../hooks/usePerfisUsuario';

export default function Restaurantes() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ nome: "", cnpj: "", cidade: "", estado: "" });
  const navigate = useNavigate();
  const { perfis } = usePerfisUsuario();
  const perfil = perfis[0]?.perfil?.toLowerCase();
  console.log('Perfil logado:', perfil);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: 'Bearer ' + token };
    fetch("/api/restaurantes/", { headers })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setRestaurantes(Array.isArray(data) ? data : []);
        } else {
          setRestaurantes([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Erro ao carregar restaurantes:', error);
        setRestaurantes([]);
        setLoading(false);
      });
  }, [navigate]);

  function filtrar(restaurante) {
    return (
      restaurante.nome.toLowerCase().includes(filtro.nome.toLowerCase()) &&
      restaurante.cnpj.toLowerCase().includes(filtro.cnpj.toLowerCase()) &&
      restaurante.cidade.toLowerCase().includes(filtro.cidade.toLowerCase()) &&
      restaurante.estado.toLowerCase().includes(filtro.estado.toLowerCase())
    );
  }

  let restaurantesFiltrados = restaurantes;
  if (!loading && (perfil === "master" || perfil === "redator" || perfil === "usuario_comum")) {
    const idsVinculados = perfis.filter(p => p.perfil?.toLowerCase() === perfil).map(p => String(p.restaurante));
    restaurantesFiltrados = restaurantes.filter(r => idsVinculados.includes(String(r.id)));
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold"><ArrowLeft size={20}/> Voltar</button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Restaurantes</h1>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
            <input placeholder="Filtrar por nome" className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
            <input placeholder="Filtrar por CNPJ" className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
            <input placeholder="Filtrar por cidade" className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
            <input placeholder="Filtrar por estado" className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          {perfil === 'administrador' && (
            <Link to="/restaurantes/novo" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition w-full md:w-auto flex items-center justify-center text-center">
              Novo Restaurante
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {restaurantesFiltrados.map(restaurante => (
            <div
              key={restaurante.id}
              className="flex items-center gap-4 bg-white rounded-2xl shadow-lg p-5 hover:shadow-2xl transition border border-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-200"
              onClick={() => navigate(`/restaurantes/${restaurante.id}`)}
            >
              <img src={restaurante.logo || '/default-logo.png'} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 bg-white" />
              <div>
                <div className="font-bold text-lg text-gray-900 mb-1">{restaurante.nome}</div>
                <div className="text-sm text-gray-700">CNPJ: {restaurante.cnpj}</div>
                <div className="text-sm text-gray-700">Cidade: {restaurante.cidade} - {restaurante.estado}</div>
                <div className="text-sm text-gray-700">Telefone: {restaurante.telefone}</div>
                <div className="text-sm text-gray-700">Email: {restaurante.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 