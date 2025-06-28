import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import usePerfisUsuario from "../hooks/usePerfisUsuario";
import { RotateCw, ArrowLeft, Pencil, Trash2 } from 'lucide-react';

export default function RestauranteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurante, setRestaurante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receitas, setReceitas] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [deletando, setDeletando] = useState({});
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();
  const [loadingReceitas, setLoadingReceitas] = useState(false);
  const [loadingFichas, setLoadingFichas] = useState(false);
  const [buscaReceita, setBuscaReceita] = useState("");
  const [buscaFicha, setBuscaFicha] = useState("");
  
  // Verificações de segurança para evitar erros
  const perfilRestaurante = perfis && perfis.length > 0 ? perfis.find(p => String(p.restaurante) === String(id)) : null;
  let perfil = perfilRestaurante ? perfilRestaurante.perfil : null;
  
  // Se o usuário for admin global, garantir acesso total
  if (!perfil && perfis && perfis.find(p => p.perfil === 'administrador')) perfil = 'administrador';
  
  const isAdmin = perfil === 'administrador';
  const podeEditar = perfil === 'administrador' || perfil === 'redator' || perfil === 'master';
  const podeVerCusto = perfil === 'administrador' || perfil === 'master';
  const podeCadastrar = perfil === 'administrador' || perfil === 'redator';
  const podeEditarOuExcluir = perfil === 'administrador' || perfil === 'redator';
  
  const [editandoFator, setEditandoFator] = useState(false);
  const [fatorCorrecao, setFatorCorrecao] = useState(1.00);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    fetch(`/api/restaurantes/${id}/`, { headers })
      .then(res => res.json())
      .then(data => {
        setRestaurante(data);
        setLoading(false);
      });
    fetch(`/api/receitas/?restaurante=${id}`, { headers })
      .then(res => res.json())
      .then(data => setReceitas(data));
    fetch(`/api/fichas-tecnicas/?restaurante=${id}`, { headers })
      .then(res => res.json())
      .then(data => setFichas(data));
  }, [id]);

  useEffect(() => {
    if (restaurante && restaurante.fator_correcao) {
      setFatorCorrecao(Number(restaurante.fator_correcao));
    }
  }, [restaurante]);

  function handleDeleteReceita(receitaId) {
    if (!window.confirm("Tem certeza que deseja excluir esta receita?")) return;
    setDeletando(prev => ({ ...prev, ["receita-"+receitaId]: true }));
    fetch(`/api/receitas/${receitaId}/`, { method: "DELETE", headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
      .then(res => {
        setReceitas(receitas.filter(r => r.id !== receitaId));
      })
      .finally(() => setDeletando(prev => ({ ...prev, ["receita-"+receitaId]: false })));
  }

  function handleDeleteFicha(fichaId) {
    if (!window.confirm("Tem certeza que deseja excluir esta ficha técnica?")) return;
    setDeletando(prev => ({ ...prev, ["ficha-"+fichaId]: true }));
    fetch(`/api/fichas-tecnicas/${fichaId}/`, { method: "DELETE", headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
      .then(res => {
        setFichas(fichas.filter(f => f.id !== fichaId));
      })
      .finally(() => setDeletando(prev => ({ ...prev, ["ficha-"+fichaId]: false })));
  }

  function salvarFatorCorrecao() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
    fetch(`/api/restaurantes/${id}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fator_correcao: fatorCorrecao })
    })
      .then(res => res.json())
      .then(data => {
        setRestaurante(data);
        setEditandoFator(false);
      });
  }

  // Cálculo das métricas personalizadas
  const totalReceitas = receitas.length;
  const totalFichas = fichas.length;
  const precos = receitas.map(r => Number(r.custo_total) || 0).filter(v => v > 0);
  const mediaPrecificacao = precos.length ? (precos.reduce((a, b) => a + b, 0) / precos.length) : 0;
  // Supondo que cada receita tem um campo preco_venda e custo_total
  const lucroPorcentagem = receitas.map(r => {
    const venda = Number(r.preco_venda) || 0;
    const custo = Number(r.custo_total) || 0;
    if (venda > 0 && custo > 0) {
      return ((venda - custo) / venda) * 100;
    }
    return null;
  }).filter(v => v !== null);
  const mediaLucro = lucroPorcentagem.length ? (lucroPorcentagem.reduce((a, b) => a + b, 0) / lucroPorcentagem.length) : 0;

  function buscarReceitas() {
    setLoadingReceitas(true);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    fetch(`/api/receitas/?restaurante=${id}`, { headers })
      .then(res => res.json())
      .then(data => setReceitas(data))
      .finally(() => setLoadingReceitas(false));
  }

  function buscarFichas() {
    setLoadingFichas(true);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    fetch(`/api/fichas-tecnicas/?restaurante=${id}`, { headers })
      .then(res => res.json())
      .then(data => setFichas(data))
      .finally(() => setLoadingFichas(false));
  }

  if (loading || loadingPerfis) return <div className="text-center text-gray-500 py-10">Carregando detalhes...</div>;
  if (!restaurante) return <div className="text-center text-red-500 py-10">Restaurante não encontrado.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold"><ArrowLeft size={20}/> Voltar</button>
      <div className="flex items-center gap-6 mb-6">
        {restaurante.logo ? (
          <img src={restaurante.logo} alt={restaurante.nome} className="w-24 h-24 object-cover rounded-full border" />
        ) : (
          <div className="w-24 h-24 flex items-center justify-center bg-gray-200 rounded-full text-gray-400 text-4xl font-bold border">
            {restaurante.nome[0]}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold mb-1">{restaurante.nome}</h1>
          <div className="text-gray-600">CNPJ: {restaurante.cnpj}</div>
          <div className="text-gray-600">Telefone: {restaurante.telefone}</div>
          <div className="text-gray-600">Email: {restaurante.email}</div>
          <div className="text-gray-600">Endereço: {restaurante.rua}, {restaurante.numero} {restaurante.complemento && `- ${restaurante.complemento}`}, {restaurante.bairro}, {restaurante.cidade} - {restaurante.estado}, CEP: {restaurante.cep}</div>
          {isAdmin && (
            <div className="mt-2">
              <label className="font-semibold text-gray-700 mr-2">Fator de Correção:</label>
              {editandoFator ? (
                <>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fatorCorrecao}
                    onChange={e => setFatorCorrecao(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 w-24 mr-2"
                  />
                  <button onClick={salvarFatorCorrecao} className="bg-green-600 text-white px-3 py-1 rounded mr-2">Salvar</button>
                  <button onClick={() => { setEditandoFator(false); setFatorCorrecao(restaurante.fator_correcao); }} className="bg-gray-400 text-white px-3 py-1 rounded">Cancelar</button>
                </>
              ) : (
                <>
                  <span className="text-blue-700 font-bold">{Number(restaurante.fator_correcao).toFixed(2)}</span>
                  <button onClick={() => setEditandoFator(true)} className="ml-2 text-sm text-blue-700 underline">Editar</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mb-8 justify-center items-center">
        {podeCadastrar && (
          <>
            <Link to={`/restaurantes/${id}/receitas/novo`} className="bg-purple-700 text-white px-5 py-2 rounded font-semibold shadow hover:bg-purple-800 transition">+ Nova Receita</Link>
            <Link to={`/restaurantes/${id}/insumos`} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Cadastrar Insumos</Link>
            <Link to={`/restaurantes/${id}/fichas-tecnicas`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Cadastrar Ficha Técnica</Link>
          </>
        )}
      </div>
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <h2 className="text-xl font-semibold">Receitas cadastradas</h2>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={buscaReceita}
              onChange={e => setBuscaReceita(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
              style={{ minWidth: 180 }}
            />
            <button onClick={buscarReceitas} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded shadow hover:bg-blue-700 transition disabled:opacity-60" disabled={loadingReceitas}>
              <RotateCw className={loadingReceitas ? 'animate-spin' : ''} size={18} />
              {loadingReceitas ? 'Buscando...' : 'Buscar receitas'}
            </button>
          </div>
        </div>
        {(receitas.filter(r => r.nome.toLowerCase().includes(buscaReceita.toLowerCase()))).length === 0 ? (
          <div className="text-gray-500">Nenhuma receita cadastrada ainda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {receitas.filter(r => r.nome.toLowerCase().includes(buscaReceita.toLowerCase())).map(receita => {
              const pesoTotal = receita.itens.reduce((acc, item) => acc + (item.quantidade_utilizada * (item.ipc/100) * (item.ic/100)), 0);
              const porcao = Number(receita.porcao_sugerida) || 0;
              const rendimento = porcao > 0 ? pesoTotal / porcao : 0;
              return (
                <div
                  key={receita.id}
                  className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-gray-100 relative group"
                >
                  <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => navigate(`/receitas/${receita.id}`)}>
                    <img src={receita.imagem || '/default-receita.png'} alt="Imagem da receita" className="w-14 h-14 rounded-full object-cover border bg-gray-100" />
                    <div>
                      <div className="font-bold text-lg text-gray-900">{receita.nome}</div>
                      <div className="text-xs text-gray-500">Porção: {receita.porcao_sugerida}g | Rendimento: {rendimento > 0 ? rendimento.toFixed(2) : "-"} porções</div>
                    </div>
                  </div>
                  {podeVerCusto && (
                    <div className="text-xs text-gray-500">Custo total: R$ {Number(receita.custo_total).toFixed(2)}</div>
                  )}
                  {podeEditarOuExcluir && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/receitas/${receita.id}/editar`); }}
                        className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded shadow font-semibold"
                      >
                        <Pencil size={16}/> Editar
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteReceita(receita.id); }}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded shadow font-semibold"
                        disabled={deletando['receita-'+receita.id]}
                      >
                        <Trash2 size={16}/> Excluir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <h2 className="text-xl font-semibold">Fichas Técnicas cadastradas</h2>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={buscaFicha}
              onChange={e => setBuscaFicha(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
              style={{ minWidth: 180 }}
            />
            <button onClick={buscarFichas} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded shadow hover:bg-blue-700 transition disabled:opacity-60" disabled={loadingFichas}>
              <RotateCw className={loadingFichas ? 'animate-spin' : ''} size={18} />
              {loadingFichas ? 'Buscando...' : 'Buscar fichas'}
            </button>
          </div>
        </div>
        {(fichas.filter(f => f.nome.toLowerCase().includes(buscaFicha.toLowerCase()))).length === 0 ? (
          <div className="text-gray-500">Nenhuma ficha técnica cadastrada ainda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {fichas.filter(f => f.nome.toLowerCase().includes(buscaFicha.toLowerCase())).map(ficha => {
              const pesoTotal = ficha.itens.reduce((acc, item) => acc + (item.quantidade_utilizada * (item.ipc/100) * (item.ic/100)), 0);
              const porcao = Number(ficha.porcao_sugerida) || 0;
              const rendimento = porcao > 0 ? pesoTotal / porcao : 0;
              return (
                <div
                  key={ficha.id}
                  className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-gray-100 relative group"
                >
                  <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => navigate(`/fichas-tecnicas/${ficha.id}`)}>
                    <img src={ficha.imagem || '/default-receita.png'} alt="Imagem da ficha técnica" className="w-14 h-14 rounded-full object-cover border bg-gray-100" />
                    <div>
                      <div className="font-bold text-lg text-gray-900">{ficha.nome}</div>
                      <div className="text-xs text-gray-500">Rendimento: {ficha.rendimento}</div>
                    </div>
                  </div>
                  {podeEditarOuExcluir && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/restaurantes/${id}/fichas-tecnicas/${ficha.id}/editar`); }}
                        className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded shadow font-semibold"
                      >
                        <Pencil size={16}/> Editar
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteFicha(ficha.id); }}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded shadow font-semibold"
                        disabled={deletando['ficha-'+ficha.id]}
                      >
                        <Trash2 size={16}/> Excluir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Resumo</h2>
        <ul className="text-gray-700 space-y-1">
          <li><b>Nome:</b> {restaurante.nome}</li>
          <li><b>CNPJ:</b> {restaurante.cnpj}</li>
          <li><b>Email:</b> {restaurante.email}</li>
          <li><b>Telefone:</b> {restaurante.telefone}</li>
          <li><b>Endereço:</b> {restaurante.rua}, {restaurante.numero} {restaurante.complemento && `- ${restaurante.complemento}`}, {restaurante.bairro}, {restaurante.cidade} - {restaurante.estado}, CEP: {restaurante.cep}</li>
        </ul>
      </div>
    </div>
  );
} 