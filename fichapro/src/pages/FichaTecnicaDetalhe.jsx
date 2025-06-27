import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react';
import usePerfisUsuario from "../hooks/usePerfisUsuario";

export default function FichaTecnicaDetalhe() {
  const { fichaId } = useParams();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();
  const perfilRestaurante = perfis.find(p => String(p.restaurante) === String(ficha?.restaurante));
  let perfil = perfilRestaurante ? perfilRestaurante.perfil : null;
  if (!perfil && perfis.length === 0) perfil = 'administrador';
  const perfilLower = perfil?.toLowerCase();
  const podeEditar = perfilLower === 'administrador' || perfilLower === 'redator';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    fetch(`/api/fichas-tecnicas/${fichaId}/`, { headers })
      .then(res => res.json())
      .then(data => {
        setFicha(data);
        setLoading(false);
      });
  }, [fichaId]);

  function excluirFicha() {
    if (!window.confirm('Tem certeza que deseja excluir esta ficha técnica?')) return;
    const token = localStorage.getItem('token');
    fetch(`/api/fichas-tecnicas/${fichaId}/`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(res => {
        if (res.ok) {
          navigate(-1);
        } else {
          setErro('Erro ao excluir ficha técnica.');
        }
      })
      .catch(() => setErro('Erro ao excluir ficha técnica.'));
  }

  if (loading || loadingPerfis) return <div className="text-center text-gray-500 py-10">Carregando detalhes...</div>;
  if (!ficha) return <div className="text-center text-red-500 py-10">Ficha técnica não encontrada.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-blue-700 hover:text-blue-900 font-semibold"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
          <div className="w-36 h-36 flex items-center justify-center bg-gray-100 rounded-xl border overflow-hidden">
            {ficha.imagem ? (
              <img src={ficha.imagem} alt="Imagem da ficha técnica" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-sm">Sem imagem</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{ficha.nome}</h1>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-700 text-base mb-2">
              <div><b>Rendimento:</b> {ficha.rendimento}</div>
              <div><b>Custo total:</b> R$ {Number(ficha.custo_total).toFixed(2)}</div>
            </div>
            {(perfilLower === 'administrador' || perfilLower === 'master' || perfilLower === 'redator') && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Valor sugerido restaurante</label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 w-full text-base font-medium">
                    R$ {Number(ficha.valor_restaurante || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Valor sugerido iFood</label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 w-full text-base font-medium">
                    R$ {Number(ficha.valor_ifood || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            {erro && <div className="flex items-center gap-2 text-red-600 mt-2"><XCircle size={18}/>{erro}</div>}
            {podeEditar && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/restaurantes/${ficha.restaurante}/fichas-tecnicas/${fichaId}/editar`)}
                  className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded shadow font-semibold"
                >
                  <Pencil size={16}/> Editar
                </button>
                <button
                  onClick={excluirFicha}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded shadow font-semibold"
                >
                  <Trash2 size={16}/> Excluir
                </button>
              </div>
            )}
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Itens</h2>
        <ul className="mb-6 list-disc pl-6 space-y-1">
          {(ficha.itens || []).map((item, i) => (
            <li key={i} className="text-gray-800">
              {item.insumo_nome || item.receita_nome} - {item.quantidade_utilizada} {item.unidade_medida || ''}
            </li>
          ))}
        </ul>
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Modo de preparo</h2>
        <div className="whitespace-pre-line text-gray-800 bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
          {ficha.modo_preparo}
        </div>
      </div>
    </div>
  );
} 