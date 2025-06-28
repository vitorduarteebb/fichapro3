import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import dayjs from "dayjs";
import usePerfisUsuario from "../hooks/usePerfisUsuario";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function InsumoDetalhe() {
  const { insumoId } = useParams();
  const navigate = useNavigate();
  const [insumo, setInsumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [historico, setHistorico] = useState([]);
  const [excluindo, setExcluindo] = useState(false);
  const periodos = [
    { key: '1D', label: '1D', dias: 1 },
    { key: '5D', label: '5D', dias: 5 },
    { key: '1M', label: '1M', dias: 30 },
    { key: '1Y', label: '1Y', dias: 365 },
    { key: '5Y', label: '5Y', dias: 365*5 },
    { key: 'Max', label: 'Max', dias: null },
  ];
  const [periodo, setPeriodo] = useState('1M');
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();
  const isAdmin = perfis.some(p => p.perfil === 'admin');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    fetch(`/api/insumos/${insumoId}/`, { headers })
      .then(res => res.json())
      .then(data => {
        setInsumo(data);
        setLoading(false);
      })
      .catch(() => {
        setErro("Erro ao carregar insumo");
        setLoading(false);
      });
    // Buscar histórico real de preço
    fetch(`/api/insumos/${insumoId}/historico_preco/`, { headers })
      .then(res => res.json())
      .then(data => {
        setHistorico(data);
      });
  }, [insumoId]);

  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir este insumo?')) return;
    
    setExcluindo(true);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    
    try {
      const response = await fetch(`/api/insumos/${insumoId}/`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        navigate('/insumos');
      } else {
        alert('Erro ao excluir insumo');
      }
    } catch (error) {
      alert('Erro ao excluir insumo');
    } finally {
      setExcluindo(false);
    }
  };

  // Filtrar histórico conforme o período
  const hoje = dayjs();
  let historicoFiltrado = historico.filter(h => {
    if (periodo === 'Max') return true;
    const dias = periodos.find(p => p.key === periodo)?.dias;
    if (!dias) return true;
    return dayjs(h.data).isAfter(hoje.subtract(dias-1, 'day').endOf('day'));
  });

  // Se não houver pontos no período, mostrar o preço atual com a data de hoje
  if (historicoFiltrado.length === 0 && insumo) {
    historicoFiltrado = [{ preco: insumo.preco, data: hoje.toISOString() }];
  }

  // Dados do gráfico
  const chartData = {
    labels: historicoFiltrado.map(h => dayjs(h.data).format(periodo === '1D' ? 'HH:mm' : periodo === '1M' || periodo === '5D' ? 'MMM D' : 'MMM YYYY')),
    datasets: [
      {
        label: 'Preço (R$)',
        data: historicoFiltrado.map(h => h.preco),
        borderColor: '#f87171',
        backgroundColor: ctx => {
          const chart = ctx.chart;
          const {ctx: c, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(248,113,113,0.3)');
          gradient.addColorStop(1, 'rgba(24,24,27,0.0)');
          return gradient;
        },
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#f87171',
        tension: 0.3,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#f87171',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          title: (ctx) => ctx[0].label,
          label: (ctx) => `R$ ${Number(ctx.parsed.y).toFixed(2)}`,
        },
        displayColors: false,
        padding: 12,
      },
    },
    scales: {
      x: {
        display: true,
        title: { display: false },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#fff', font: { weight: 500 } },
      },
      y: {
        display: true,
        title: { display: false },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#fff', font: { weight: 500 } },
      },
    },
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Carregando...</div>;
  if (!insumo) return <div className="text-center py-10 text-red-500">{erro || "Insumo não encontrado"}</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold"><ArrowLeft size={20}/> Voltar</button>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{insumo.nome}</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <button 
                className="p-2 rounded hover:bg-blue-100" 
                onClick={() => navigate(`/insumos/${insumoId}/editar`)}
              >
                <Pencil size={20}/>
              </button>
              <button 
                className="p-2 rounded hover:bg-red-100" 
                onClick={handleExcluir}
                disabled={excluindo}
              >
                <Trash2 size={20}/>
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-gray-600 text-sm">Peso</div>
            <div className="font-bold text-lg">{insumo.peso} {insumo.unidade_medida}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Preço Atual</div>
            <div className="font-bold text-lg">R$ {Number(insumo.preco).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Categoria</div>
            <div className="font-bold text-lg">{insumo.categoria_nome || 'Sem categoria'}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm">Restaurante</div>
            <div className="font-bold text-lg">{insumo.restaurante}</div>
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-700 font-semibold">Variação do Preço</div>
            <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
              {periodos.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${periodo === p.key ? 'bg-zinc-800 text-blue-200' : 'text-zinc-400 hover:bg-zinc-800'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4">
            {historicoFiltrado.length === 0 ? (
              <div className="text-center text-zinc-400 py-8">Sem dados para o período selecionado</div>
            ) : (
              <Line data={chartData} options={chartOptions} height={80} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 