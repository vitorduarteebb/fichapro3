import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import usePerfisUsuario from "../hooks/usePerfisUsuario";
import { Search, Filter, ArrowUpDown, ArrowLeft, Plus, DollarSign, Package, Building } from 'lucide-react';

export default function InsumosLista() {
  const [insumos, setInsumos] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    restaurante: '',
    busca: '',
    unidade_medida: '',
    categoria: '',
    preco_min: '',
    preco_max: '',
    ordenacao: 'nome'
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();
  const navigate = useNavigate();

  // Verificar permissões
  const isAdmin = perfis && perfis.some(p => p.perfil === 'administrador' && p.restaurante === null);
  const podeVerPreco = perfis && perfis.some(p => 
    p.perfil === 'administrador' || p.perfil === 'master' || isAdmin
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: 'Bearer ' + token };

    // Carregar restaurantes
    fetch('/api/restaurantes/', { headers })
      .then(res => res.json())
      .then(data => setRestaurantes(data))
      .catch(err => console.error('Erro ao carregar restaurantes:', err));

    // Carregar categorias
    fetch('/api/categorias-insumo/', { headers })
      .then(res => res.json())
      .then(data => setCategorias(Array.isArray(data) ? data : []))
      .catch(err => console.error('Erro ao carregar categorias:', err));

    // Carregar insumos
    fetch('/api/insumos/', { headers })
      .then(res => res.json())
      .then(data => {
        setInsumos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar insumos:', err);
        setInsumos([]);
        setLoading(false);
      });
  }, []);

  // Função para aplicar filtros
  const insumosFiltrados = insumos.filter(insumo => {
    // Filtro por restaurante
    if (filtros.restaurante && insumo.restaurante !== parseInt(filtros.restaurante)) {
      return false;
    }

    // Filtro por busca (nome)
    if (filtros.busca && !insumo.nome.toLowerCase().includes(filtros.busca.toLowerCase())) {
      return false;
    }

    // Filtro por unidade de medida
    if (filtros.unidade_medida && insumo.unidade_medida !== filtros.unidade_medida) {
      return false;
    }

    // Filtro por categoria
    if (filtros.categoria && insumo.categoria !== parseInt(filtros.categoria)) {
      return false;
    }

    // Filtro por preço mínimo
    if (filtros.preco_min && parseFloat(insumo.preco) < parseFloat(filtros.preco_min)) {
      return false;
    }

    // Filtro por preço máximo
    if (filtros.preco_max && parseFloat(insumo.preco) > parseFloat(filtros.preco_max)) {
      return false;
    }

    return true;
  });

  // Função para ordenar
  const insumosOrdenados = [...insumosFiltrados].sort((a, b) => {
    switch (filtros.ordenacao) {
      case 'nome':
        return a.nome.localeCompare(b.nome);
      case 'preco_menor':
        return parseFloat(a.preco) - parseFloat(b.preco);
      case 'preco_maior':
        return parseFloat(b.preco) - parseFloat(a.preco);
      case 'peso':
        return parseFloat(a.peso) - parseFloat(b.peso);
      case 'restaurante':
        const restauranteA = restaurantes.find(r => r.id === a.restaurante)?.nome || '';
        const restauranteB = restaurantes.find(r => r.id === b.restaurante)?.nome || '';
        return restauranteA.localeCompare(restauranteB);
      case 'categoria':
        const categoriaA = categorias.find(c => c.id === a.categoria)?.nome || '';
        const categoriaB = categorias.find(c => c.id === b.categoria)?.nome || '';
        return categoriaA.localeCompare(categoriaB);
      default:
        return 0;
    }
  });

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limparFiltros = () => {
    setFiltros({
      restaurante: '',
      busca: '',
      unidade_medida: '',
      categoria: '',
      preco_min: '',
      preco_max: '',
      ordenacao: 'nome'
    });
  };

  const getUnidadeLabel = (unidade) => {
    const labels = {
      'g': 'Grama (g)',
      'ml': 'Mililitro (ml)',
      'un': 'Unidade (un)'
    };
    return labels[unidade] || unidade;
  };

  if (loading || loadingPerfis) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando insumos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
              >
                <ArrowLeft size={20} />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Insumos dos Restaurantes</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Filter size={16} />
                Filtros
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate('/criar')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Plus size={16} />
                  Novo Insumo
                </button>
              )}
            </div>
          </div>

          {/* Busca rápida */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar insumos por nome..."
              value={filtros.busca}
              onChange={(e) => handleFiltroChange('busca', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
        </div>

        {/* Filtros avançados */}
        {mostrarFiltros && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros Avançados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por restaurante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Restaurante</label>
                <select
                  value={filtros.restaurante}
                  onChange={(e) => handleFiltroChange('restaurante', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todos os restaurantes</option>
                  {(isAdmin
                    ? restaurantes
                    : restaurantes.filter(r => perfis.some(p => p.restaurante === r.id))
                  ).map(restaurante => (
                    <option key={restaurante.id} value={restaurante.id}>
                      {restaurante.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={filtros.categoria}
                  onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por unidade de medida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unidade de Medida</label>
                <select
                  value={filtros.unidade_medida}
                  onChange={(e) => handleFiltroChange('unidade_medida', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todas as unidades</option>
                  <option value="g">Grama (g)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="un">Unidade (un)</option>
                </select>
              </div>

              {/* Filtro por preço mínimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preço Mínimo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filtros.preco_min}
                  onChange={(e) => handleFiltroChange('preco_min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                />
              </div>

              {/* Filtro por preço máximo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preço Máximo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filtros.preco_max}
                  onChange={(e) => handleFiltroChange('preco_max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="999.99"
                />
              </div>
            </div>

            {/* Ordenação */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
              <select
                value={filtros.ordenacao}
                onChange={(e) => handleFiltroChange('ordenacao', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="nome">Nome (A-Z)</option>
                <option value="preco_menor">Preço (Menor)</option>
                <option value="preco_maior">Preço (Maior)</option>
                <option value="peso">Peso</option>
                <option value="restaurante">Restaurante</option>
                <option value="categoria">Categoria</option>
              </select>
            </div>

            {/* Botão limpar filtros */}
            <div className="mt-4">
              <button
                onClick={limparFiltros}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              <Package className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total de Insumos</p>
                <p className="text-2xl font-bold text-gray-900">{insumosFiltrados.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              <Building className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Restaurantes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(insumosFiltrados.map(i => i.restaurante)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="text-yellow-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Preço Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {insumosFiltrados.length > 0 
                    ? (insumosFiltrados.reduce((acc, i) => acc + parseFloat(i.preco), 0) / insumosFiltrados.length).toFixed(2)
                    : '0.00'
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              <ArrowUpDown className="text-purple-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Categorias</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(insumosFiltrados.map(i => i.categoria).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de insumos */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Restaurante</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoria</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Peso/Quantidade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Unidade</th>
                  {podeVerPreco && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Preço</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {insumosOrdenados.length > 0 ? (
                  insumosOrdenados.map(insumo => (
                    <tr key={insumo.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/insumos/${insumo.id}`)}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{insumo.nome}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {restaurantes.find(r => r.id === insumo.restaurante)?.nome || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {insumo.categoria_nome || 'Sem categoria'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{insumo.peso}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getUnidadeLabel(insumo.unidade_medida)}
                        </span>
                      </td>
                      {podeVerPreco && (
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-green-600">
                            R$ {Number(insumo.preco).toFixed(2)}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={podeVerPreco ? 6 : 5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">Nenhum insumo encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros ou adicionar novos insumos.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação simples */}
        {insumosOrdenados.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Mostrando {insumosOrdenados.length} de {insumos.length} insumos
          </div>
        )}
      </div>
    </div>
  );
} 