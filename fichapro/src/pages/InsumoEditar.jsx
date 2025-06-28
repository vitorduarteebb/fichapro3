import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from 'lucide-react';

export default function InsumoEditar() {
  const { insumoId } = useParams();
  const navigate = useNavigate();
  const [insumo, setInsumo] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    peso: "",
    unidade_medida: "g",
    preco: "",
    categoria: ""
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};

    // Carregar insumo
    fetch(`/api/insumos/${insumoId}/`, { headers })
      .then(res => res.json())
      .then(data => {
        setInsumo(data);
        setForm({
          nome: data.nome,
          peso: data.peso,
          unidade_medida: data.unidade_medida,
          preco: data.preco,
          categoria: data.categoria || ""
        });
        setLoading(false);
      })
      .catch(() => {
        alert("Erro ao carregar insumo");
        setLoading(false);
      });

    // Carregar categorias
    fetch(`/api/categorias-insumo/?restaurante=${insumo?.restaurante}`, { headers })
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(() => console.log("Erro ao carregar categorias"));
  }, [insumoId, insumo?.restaurante]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    };

    try {
      const response = await fetch(`/api/insumos/${insumoId}/`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...form,
          restaurante: insumo.restaurante,
          categoria: form.categoria || null
        })
      });

      if (response.ok) {
        navigate(`/insumos/${insumoId}`);
      } else {
        const error = await response.json();
        alert(`Erro ao salvar: ${error.detail || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert('Erro ao salvar insumo');
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarCategoria = async () => {
    if (!novaCategoria.trim()) return;

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    };

    try {
      const response = await fetch('/api/categorias-insumo/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome: novaCategoria,
          restaurante: insumo.restaurante
        })
      });

      if (response.ok) {
        const novaCat = await response.json();
        setCategorias([...categorias, novaCat]);
        setForm({ ...form, categoria: novaCat.id });
        setNovaCategoria("");
        setShowCategoriaModal(false);
      } else {
        alert('Erro ao criar categoria');
      }
    } catch (error) {
      alert('Erro ao criar categoria');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Carregando...</div>;
  if (!insumo) return <div className="text-center py-10 text-red-500">Insumo não encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold">
          <ArrowLeft size={20}/> Voltar
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Insumo</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm({...form, nome: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
              <input
                type="number"
                step="0.001"
                value={form.peso}
                onChange={(e) => setForm({...form, peso: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select
                value={form.unidade_medida}
                onChange={(e) => setForm({...form, unidade_medida: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="g">Grama (g)</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="un">Unidade (un)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.preco}
              onChange={(e) => setForm({...form, preco: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <div className="flex gap-2">
              <select
                value={form.categoria}
                onChange={(e) => setForm({...form, categoria: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Sem categoria</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoriaModal(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Modal para criar categoria */}
        {showCategoriaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-semibold mb-4">Nova Categoria</h3>
              <input
                type="text"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Nome da categoria"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCriarCategoria}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                >
                  Criar
                </button>
                <button
                  onClick={() => setShowCategoriaModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 