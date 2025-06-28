import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import usePerfisUsuario from "../hooks/usePerfisUsuario";
import { Plus, ArrowLeft } from 'lucide-react';

export default function Insumos() {
  const { id } = useParams();
  const [insumos, setInsumos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: "", peso: "", unidade_medida: "g", preco: "", categoria: "" });
  const [msg, setMsg] = useState("");
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();
  const navigate = useNavigate();
  const [buscaInsumo, setBuscaInsumo] = useState("");

  // Verificações de segurança para evitar erros
  const perfilRestaurante = perfis && perfis.length > 0 ? perfis.find(p => String(p.restaurante) === String(id)) : null;
  let perfil = perfilRestaurante ? perfilRestaurante.perfil : null;
  
  // Se não houver vínculo, mas o usuário for admin, considerar como administrador
  if (!perfil && (!perfis || perfis.length === 0)) perfil = 'administrador';
  
  // Verificar se é admin global (is_staff ou is_superuser)
  const isAdmin = perfis && perfis.some(p => p.perfil === 'administrador' && p.restaurante === null);
  const podeEditar = perfil === 'administrador' || perfil === 'redator' || perfil === 'master' || isAdmin;
  const podeVerPreco = perfil === 'administrador' || perfil === 'master' || isAdmin;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !id || isNaN(Number(id))) {
      setLoading(false);
      return;
    }
    const headers = { Authorization: 'Bearer ' + token };
    fetch(`/api/insumos/?restaurante=${id}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar insumos');
        return res.json();
      })
      .then(data => {
        setInsumos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Erro:', error);
        setInsumos([]);
        setLoading(false);
      });
    // Buscar categorias
    fetch(`/api/categorias-insumo/?restaurante=${id}`, { headers })
      .then(res => res.json())
      .then(data => setCategorias(Array.isArray(data) ? data : []));
  }, [id, msg]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    const token = localStorage.getItem('token');
    if (!token) {
      setMsg("Erro: Usuário não autenticado");
      return;
    }
    if (!form.nome || !form.peso) {
      setMsg("Erro: Nome e peso são obrigatórios");
      return;
    }
    const dadosParaEnviar = {
      ...form,
      restaurante: Number(id),
      preco: podeVerPreco ? form.preco : "0.00",
      categoria: form.categoria || null
    };
    const headers = { 
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    };
    fetch("/api/insumos/", {
      method: "POST",
      headers,
      body: JSON.stringify(dadosParaEnviar)
    })
      .then(res => {
        if (res.ok) return res.json();
        return res.text().then(text => { throw new Error(`Erro ${res.status}: ${text}`); });
      })
      .then((data) => {
        setMsg("Insumo cadastrado com sucesso!");
        setForm({ nome: "", peso: "", unidade_medida: "g", preco: "", categoria: "" });
      })
      .catch((error) => {
        setMsg(`Erro ao cadastrar insumo: ${error.message}`);
      });
  }

  function handleNovaCategoria(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!novaCategoria) return;
    fetch('/api/categorias-insumo/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ nome: novaCategoria, restaurante: Number(id) })
    })
      .then(res => res.json())
      .then(data => {
        setCategorias([...categorias, data]);
        setForm(f => ({ ...f, categoria: data.id }));
        setNovaCategoria("");
        setShowCategoriaModal(false);
      });
  }

  if (loading || loadingPerfis) return <div className="text-center text-gray-500 py-10">Carregando...</div>;
  if (!podeEditar && !isAdmin) return <div className="text-center text-red-500 py-10">Acesso negado: você não tem permissão para cadastrar insumos neste restaurante.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-8">
      <div className="w-full max-w-5xl bg-white p-10 rounded-2xl shadow-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Cadastro de Insumo</h1>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold"><ArrowLeft size={20}/> Voltar</button>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nome</label>
            <input name="nome" value={form.nome} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Peso</label>
            <input name="peso" value={form.peso} onChange={handleChange} required type="number" step="0.001" min="0" className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Unidade de Medida</label>
            <select name="unidade_medida" value={form.unidade_medida} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base">
              <option value="g">Grama (g)</option>
              <option value="ml">Mililitro (ml)</option>
              <option value="un">Unidade (un)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Preço</label>
            <input name="preco" value={form.preco} onChange={handleChange} required type="number" step="0.01" min="0" className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Categoria</label>
            <div className="flex gap-2">
              <select name="categoria" value={form.categoria} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base">
                <option value="">Selecione</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowCategoriaModal(true)} className="bg-blue-500 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-600 transition flex items-center"><Plus size={16}/> Nova</button>
            </div>
          </div>
          <button type="submit" className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-green-700 transition mt-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Cadastrar</button>
          {msg && <div className="mt-2 text-center text-sm text-blue-600">{msg}</div>}
        </form>
        {showCategoriaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
              <h2 className="text-lg font-bold mb-4">Nova Categoria</h2>
              <form onSubmit={handleNovaCategoria} className="flex gap-2">
                <input type="text" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} placeholder="Nome da categoria" className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition">Salvar</button>
              </form>
              <button onClick={() => setShowCategoriaModal(false)} className="mt-4 text-gray-500 hover:text-gray-800">Cancelar</button>
            </div>
          </div>
        )}
        <h2 className="text-lg font-bold mb-2 text-gray-800 mt-8">Insumos cadastrados</h2>
        <div className="flex items-center mb-2">
          <input
            type="text"
            placeholder="Buscar insumo por nome..."
            value={buscaInsumo}
            onChange={e => setBuscaInsumo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
            style={{ minWidth: 180 }}
          />
        </div>
        <div className="overflow-x-auto mt-2">
          <table className="w-full bg-white rounded-xl shadow border border-gray-200 text-base">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 px-3 text-left">Nome</th>
                <th className="py-2 px-3 text-left">Peso</th>
                <th className="py-2 px-3 text-left">Unidade</th>
                <th className="py-2 px-3 text-left">Preço</th>
              </tr>
            </thead>
            <tbody>
              {insumos.filter(insumo => insumo.nome.toLowerCase().includes(buscaInsumo.toLowerCase())).map(insumo => (
                <tr key={insumo.id} className="border-t hover:bg-gray-50 transition">
                  <td className="py-2 px-3 font-medium text-gray-900">{insumo.nome}</td>
                  <td className="py-2 px-3">{insumo.peso}</td>
                  <td className="py-2 px-3">{insumo.unidade_medida}</td>
                  <td className="py-2 px-3">R$ {Number(insumo.preco).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 