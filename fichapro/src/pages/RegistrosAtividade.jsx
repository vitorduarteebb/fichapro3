import { useEffect, useState } from "react";
import { ArrowLeft, Filter, Calendar, User, FileText, ChefHat, Building, Users } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function RegistrosAtividade() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: "",
    acao: "",
    data_inicio: "",
    data_fim: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    carregarRegistros();
  }, [filtros]);

  const carregarRegistros = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: 'Bearer ' + token };
      
      let url = "/api/registros-atividade/";
      const params = new URLSearchParams();
      
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.acao) params.append('acao', filtros.acao);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      setRegistros(data);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconeTipo = (tipo) => {
    switch (tipo) {
      case 'restaurante': return <Building size={16} />;
      case 'insumo': return <ChefHat size={16} />;
      case 'receita': return <FileText size={16} />;
      case 'ficha_tecnica': return <FileText size={16} />;
      case 'usuario': return <Users size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getCorAcao = (acao) => {
    switch (acao) {
      case 'criado': return 'text-green-600 bg-green-100';
      case 'editado': return 'text-blue-600 bg-blue-100';
      case 'excluido': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const limparFiltros = () => {
    setFiltros({
      tipo: "",
      acao: "",
      data_inicio: "",
      data_fim: ""
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 text-blue-700 hover:text-blue-900 font-semibold"
        >
          <ArrowLeft size={20}/> Voltar
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
            Registro de Atividades
          </h1>

          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os tipos</option>
                  <option value="restaurante">Restaurante</option>
                  <option value="insumo">Insumo</option>
                  <option value="receita">Receita</option>
                  <option value="ficha_tecnica">Ficha Técnica</option>
                  <option value="usuario">Usuário</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ação
                </label>
                <select
                  value={filtros.acao}
                  onChange={(e) => setFiltros({...filtros, acao: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas as ações</option>
                  <option value="criado">Criado</option>
                  <option value="editado">Editado</option>
                  <option value="excluido">Excluído</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => setFiltros({...filtros, data_inicio: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => setFiltros({...filtros, data_fim: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={limparFiltros}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Lista de Registros */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando registros...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registros.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Nenhum registro encontrado</p>
                </div>
              ) : (
                registros.map((registro) => (
                  <div key={registro.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getIconeTipo(registro.tipo)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{registro.nome}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCorAcao(registro.acao)}`}>
                              {registro.acao}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2">{registro.descricao}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{registro.usuario_nome || 'Sistema'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatarData(registro.data_hora)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="capitalize">{registro.tipo.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 