import { useEffect, useState } from "react";
import usePerfisUsuario from "../hooks/usePerfisUsuario";
import { Star } from 'lucide-react';

export default function Dashboard() {
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();
  const [receitas, setReceitas] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Descobre restaurante vinculado (se master/redator)
  const vinculo = perfis[0];
  const restauranteId = vinculo && vinculo.restaurante;
  const perfil = vinculo && vinculo.perfil;
  const isAdmin = !perfis.length;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: 'Bearer ' + token };
    let urlReceitas = "/api/receitas/";
    let urlFichas = "/api/fichas-tecnicas/";
    if (!isAdmin && restauranteId) {
      urlReceitas += `?restaurante=${restauranteId}`;
      urlFichas += `?restaurante=${restauranteId}`;
    }
    
    Promise.all([
      fetch(urlReceitas, { headers })
        .then(res => {
          if (!res.ok) throw new Error('Erro ao carregar receitas');
          return res.json();
        })
        .catch(() => []),
      fetch(urlFichas, { headers })
        .then(res => {
          if (!res.ok) throw new Error('Erro ao carregar fichas');
          return res.json();
        })
        .catch(() => [])
    ]).then(([r, f]) => {
      setReceitas(Array.isArray(r) ? r : []);
      setFichas(Array.isArray(f) ? f : []);
      setLoading(false);
    });
  }, [restauranteId, isAdmin]);

  // Métricas
  const totalReceitas = receitas.length;
  const totalFichas = fichas.length;
  const precos = receitas.map(r => Number(r.custo_total) || 0).filter(v => v > 0);
  const mediaPrecificacao = precos.length ? (precos.reduce((a, b) => a + b, 0) / precos.length) : 0;
  const lucroPorcentagem = receitas.map(r => {
    const venda = Number(r.preco_venda) || 0;
    const custo = Number(r.custo_total) || 0;
    if (venda > 0 && custo > 0) {
      return ((venda - custo) / venda) * 100;
    }
    return null;
  }).filter(v => v !== null);
  const mediaLucro = lucroPorcentagem.length ? (lucroPorcentagem.reduce((a, b) => a + b, 0) / lucroPorcentagem.length) : 0;

  if (loading || loadingPerfis) return <div className="text-center text-gray-500 py-10">Carregando dashboard...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-12">
      {/* Painel de status do usuário */}
      {perfil === 'master' && (
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg">
            <Star size={28} className="text-yellow-300 drop-shadow" />
            <div>
              <div className="text-xl font-bold">Usuário Master</div>
            </div>
          </div>
        </div>
      )}
      {perfil === 'redator' && (
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 bg-gradient-to-r from-pink-600 to-red-600 text-white px-6 py-4 rounded-xl shadow-lg">
            <Star size={28} className="text-yellow-300 drop-shadow" />
            <div>
              <div className="text-xl font-bold">Usuário Redator</div>
            </div>
          </div>
        </div>
      )}
      {/* Painel de métricas */}
      {perfil !== 'redator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="text-xl font-bold mb-1">Média de Precificação</div>
            <div className="text-2xl font-extrabold">R$ {mediaPrecificacao.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="text-xl font-bold mb-1">Média % Lucro dos Pratos</div>
            <div className="text-2xl font-extrabold">{mediaLucro.toFixed(1)}%</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="text-xl font-bold mb-1">Receitas Cadastradas</div>
            <div className="text-2xl font-extrabold">{totalReceitas}</div>
          </div>
          <div className="bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="text-xl font-bold mb-1">Fichas Técnicas</div>
            <div className="text-2xl font-extrabold">{totalFichas}</div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow p-10 w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao FichaPro</h1>
        <p className="mt-4 text-gray-600">Aqui ficará o conteúdo principal do dashboard.</p>
      </div>
    </div>
  );
} 