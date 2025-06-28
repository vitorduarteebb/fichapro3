import { useEffect, useState } from "react";
import usePerfisUsuario from "../hooks/usePerfisUsuario";
import { Star } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();
  const [receitas, setReceitas] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  // Descobre restaurante vinculado (se master/redator)
  const vinculo = perfis[0];
  const restauranteId = vinculo && vinculo.restaurante;
  const perfil = vinculo && vinculo.perfil;
  const isAdmin = perfil === 'administrador';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/dashboard/', { headers: { Authorization: 'Bearer ' + token } })
      .then(res => res.json())
      .then(data => setDashboard(data));
  }, []);

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
      {perfil === 'administrador' && (
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-lg">
            <Star size={28} className="text-yellow-300 drop-shadow" />
            <div>
              <div className="text-xl font-bold">Administrador do Sistema</div>
            </div>
          </div>
        </div>
      )}
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
      {/* Cards extras para admin */}
      {perfil === 'administrador' && dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="text-xl font-bold mb-1">Restaurantes Cadastrados</div>
            <div className="text-2xl font-extrabold">{dashboard.total_restaurantes}</div>
          </div>
        </div>
      )}
      {/* Ranking de restaurantes */}
      {perfil === 'administrador' && dashboard && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Ranking de Restaurantes (por registros)</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-700 border-b">
                <th className="py-2">#</th>
                <th className="py-2">Restaurante</th>
                <th className="py-2">Registros</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.ranking_restaurantes.map((r, i) => (
                <tr key={r.nome} className="border-b last:border-0">
                  <td className="py-2 font-bold">{i+1}</td>
                  <td className="py-2">{r.nome}</td>
                  <td className="py-2">{r.registros}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Ranking de redatores */}
      {perfil === 'administrador' && dashboard && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Ranking de Redatores</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-700 border-b">
                <th className="py-2">#</th>
                <th className="py-2">Redator</th>
                <th className="py-2">Criados</th>
                <th className="py-2">Editados</th>
                <th className="py-2">Pontuação</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.ranking_redatores.map((r, i) => (
                <tr key={r.nome} className="border-b last:border-0">
                  <td className="py-2 font-bold">{i+1}</td>
                  <td className="py-2">{r.nome}</td>
                  <td className="py-2">{r.criados}</td>
                  <td className="py-2">{r.editados}</td>
                  <td className="py-2">{r.pontuacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Gráfico de registros mais custosos */}
      {perfil === 'administrador' && dashboard && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Registros Mais Custosos</h2>
          <div className="w-full max-w-xl mx-auto">
            <Bar data={{
              labels: dashboard.maiores_custos.map(c => c.nome),
              datasets: [{
                label: 'Custo Total (R$)',
                data: dashboard.maiores_custos.map(c => c.custo_total),
                backgroundColor: [
                  'rgba(255, 99, 132, 0.7)',
                  'rgba(54, 162, 235, 0.7)',
                  'rgba(255, 206, 86, 0.7)',
                  'rgba(75, 192, 192, 0.7)',
                  'rgba(153, 102, 255, 0.7)'
                ]
              }]
            }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      )}
    </div>
  );
} 