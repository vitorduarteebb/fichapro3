import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import usePerfisUsuario from "../hooks/usePerfisUsuario";
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function FichaTecnicaForm() {
  const { id, fichaId } = useParams(); // id do restaurante, fichaId opcional
  const navigate = useNavigate();
  const [insumos, setInsumos] = useState([]);
  const [receitas, setReceitas] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    rendimento: "",
    modo_preparo: ""
  });
  const [itens, setItens] = useState([]); // itens da ficha (insumos ou receitas)
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [restauranteId, setRestauranteId] = useState(id || "");
  const [custoSalvo, setCustoSalvo] = useState(null);
  const [pesoSalvo, setPesoSalvo] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();

  // Buscar o id do restaurante da ficha carregada, se for edição
  useEffect(() => {
    if (fichaId) {
      console.log('Carregando ficha técnica para edição, fichaId:', fichaId);
      setEditando(true);
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: 'Bearer ' + token } : {};
      fetch(`/api/fichas-tecnicas/${fichaId}/`, { headers })
        .then(res => {
          console.log('Status da resposta:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('Dados da ficha técnica carregados:', data);
          console.log('Nome:', data.nome);
          console.log('Rendimento:', data.rendimento);
          console.log('Modo preparo:', data.modo_preparo);
          console.log('Itens:', data.itens);
          console.log('Restaurante:', data.restaurante);
          
          // Garantir que os dados sejam definidos corretamente
          const formData = {
            nome: data.nome || "",
            rendimento: data.rendimento || "",
            modo_preparo: data.modo_preparo || ""
          };
          
          const itensData = (data.itens || []).map(item => ({
            tipo: item.insumo ? "insumo" : "receita",
            insumo: item.insumo || "",
            receita: item.receita || "",
            quantidade_utilizada: item.quantidade_utilizada || "",
            unidade_medida: item.unidade_medida || "g",
            ic: item.ic || 100,
            ic_tipo: item.ic_tipo || "menos",
            ipc: item.ipc || 100,
            aplicar_ic_ipc: item.aplicar_ic_ipc !== undefined ? item.aplicar_ic_ipc : true
          }));
          
          console.log('Form data a ser setado:', formData);
          console.log('Itens data a ser setado:', itensData);
          
          setForm(formData);
          setRestauranteId(data.restaurante || id);
          setCustoSalvo(data.custo_total);
          setPesoSalvo(data.peso_final);
          setItens(itensData);
          
          setLoading(false);
        })
        .catch(error => {
          console.error('Erro ao carregar ficha técnica:', error);
          setLoading(false);
        });
    } else {
      // Se não for edição, definir loading como false
      setLoading(false);
    }
  }, [fichaId, id]);

  // Verificações de segurança para evitar erros
  const perfilRestaurante = perfis && perfis.length > 0 ? perfis.find(p => String(p.restaurante) === String(id)) : null;
  let perfil = perfilRestaurante ? perfilRestaurante.perfil : null;
  
  // Se não houver vínculo, mas o usuário for admin, considerar como administrador
  if (!perfil && (!perfis || perfis.length === 0)) perfil = 'administrador';
  
  // Verificar se é admin global (is_staff ou is_superuser)
  const isAdmin = perfis && perfis.some(p => p.perfil === 'administrador' && p.restaurante === null);
  const podeEditar = perfil === 'administrador' || perfil === 'redator' || isAdmin;

  // Carregar insumos e receitas do restaurante
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !restauranteId) return;
    const headers = { Authorization: 'Bearer ' + token };
    
    Promise.all([
      fetch(`/api/insumos/?restaurante=${restauranteId}`, { headers }).then(res => res.json()),
      fetch(`/api/receitas/?restaurante=${restauranteId}`, { headers }).then(res => res.json())
    ])
    .then(([insumosData, receitasData]) => {
      setInsumos(insumosData);
      setReceitas(receitasData);
      console.log('Insumos carregados:', insumosData);
      console.log('Receitas carregadas:', receitasData);
      if (!editando) {
        setLoading(false);
      }
    })
    .catch(error => {
      console.error('Erro ao carregar insumos/receitas:', error);
      if (!editando) {
        setLoading(false);
      }
    });
  }, [restauranteId, editando]);

  // Atualiza peso e custo final em tempo real conforme os itens mudam
  useEffect(() => {
    // Calcula o peso final somando todos os pesos ajustados dos itens
    const peso = itens.reduce((acc, item) => acc + calcPesoAjustado(item), 0);
    setPesoSalvo(peso);

    // Calcula o custo total somando todos os custos ajustados dos itens
    const custo = itens.reduce((acc, item) => acc + calcCustoAjustado(item), 0);
    setCustoSalvo(custo);
  }, [itens]);

  if (loading || loadingPerfis || !restauranteId) return <div className="text-center text-gray-500 py-10">Carregando...</div>;
  if (!podeEditar && !isAdmin) return <div className="text-center text-red-500 py-10">Acesso negado: você não tem permissão para cadastrar ou editar fichas técnicas neste restaurante.</div>;

  // Adicionar novo item à ficha
  function addItem(tipo) {
    setItens([
      ...itens,
      {
        tipo, // 'insumo' ou 'receita'
        insumo: "",
        receita: "",
        quantidade_utilizada: "",
        unidade_medida: "g",
        ic: 100,
        ic_tipo: "menos",
        ipc: 100,
        aplicar_ic_ipc: true
      }
    ]);
  }

  // Remover item
  function removeItem(idx) {
    setItens(itens.filter((_, i) => i !== idx));
  }

  // Atualizar campo de item
  function handleItemChange(idx, field, value) {
    const novos = [...itens];
    novos[idx][field] = value;
    if (field === "insumo" && novos[idx].tipo === "insumo") {
      const insumoObj = insumos.find(i => String(i.id) === String(value));
      novos[idx].unidade_medida = insumoObj ? insumoObj.unidade_medida : "g";
      novos[idx].ic = 100;
      novos[idx].ic_tipo = "menos";
      novos[idx].ipc = 100;
      novos[idx].aplicar_ic_ipc = true;
    }
    if (field === "receita" && novos[idx].tipo === "receita") {
      novos[idx].unidade_medida = "g";
      novos[idx].ic = 100;
      novos[idx].ic_tipo = "menos";
      novos[idx].ipc = 100;
      novos[idx].aplicar_ic_ipc = true;
    }
    setItens(novos);
  }

  // Atualizar campos gerais
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Função recursiva para custo total de uma receita
  function getCustoTotalReceita(receita) {
    if (!receita || !receita.itens) return 0;
    return receita.itens.reduce((acc, subitem) => {
      if (subitem.insumo) {
        const insumo = insumos.find(i => String(i.id) === String(subitem.insumo));
        if (!insumo || !subitem.quantidade_utilizada) return acc;
        const custo_unit = Number(insumo.preco) / Number(insumo.peso || 1);
        const divisor = (Number(subitem.ipc) / 100) * (Number(subitem.ic) / 100) || 1;
        return acc + ((custo_unit * Number(subitem.quantidade_utilizada)) / divisor);
      } else if (subitem.receita) {
        const subReceita = receitas.find(r => String(r.id) === String(subitem.receita));
        // Peso total da sub-receita
        const pesoTotalSub = subReceita && subReceita.itens ? subReceita.itens.reduce((a, s) => a + (s.quantidade_utilizada * (s.ipc/100) * (s.ic/100)), 0) : 0;
        const proporcao = pesoTotalSub > 0 ? Number(subitem.quantidade_utilizada) / pesoTotalSub : 0;
        return acc + getCustoTotalReceita(subReceita) * proporcao;
      }
      return acc;
    }, 0);
  }

  function calcPesoAjustado(item) {
    const qtd = Number(item.quantidade_utilizada) || 0;
    const ic = Number(item.ic) / 100;
    const ipc = Number(item.ipc) / 100;
    if (!item.aplicar_ic_ipc || !item.ic || !item.ipc) return qtd;
    if (item.ic_tipo === "mais") {
      return qtd / (ic * ipc || 1);
    } else {
      return qtd * ic * ipc;
    }
  }

  function calcCustoAjustado(item) {
    if (item.tipo === "insumo") {
      const insumo = insumos.find(i => String(i.id) === String(item.insumo));
      if (!insumo || !item.quantidade_utilizada) return 0;
      const custo_unit = Number(insumo.preco) / Number(insumo.peso || 1);
      if (!item.aplicar_ic_ipc || !item.ic || !item.ipc) {
        return custo_unit * Number(item.quantidade_utilizada);
      }
      const ic = Number(item.ic) / 100;
      const ipc = Number(item.ipc) / 100;
      if (item.ic_tipo === "mais") {
        return (custo_unit * Number(item.quantidade_utilizada)) * (ic * ipc || 1);
      } else {
        return (custo_unit * Number(item.quantidade_utilizada)) / (ic * ipc || 1);
      }
    } else if (item.tipo === "receita") {
      const receita = receitas.find(r => String(r.id) === String(item.receita));
      if (!receita || !item.quantidade_utilizada) return 0;
      // Se custo_total não existir ou for zero, calcula a soma dos custos ajustados dos itens da receita
      let custoTotalReceita = receita.custo_total;
      if (!custoTotalReceita || custoTotalReceita === 0) {
        custoTotalReceita = (receita.itens || []).reduce((acc, subitem) => acc + calcCustoAjustado(subitem), 0);
      }
      const pesoTotalReceita = (receita.itens || []).reduce((acc, subitem) => acc + calcPesoAjustado(subitem), 0);
      const proporcao = pesoTotalReceita > 0 ? Number(item.quantidade_utilizada) / pesoTotalReceita : 0;
      return custoTotalReceita * proporcao;
    }
    return 0;
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setLoadingImg(true);
      setTimeout(() => {
        setImagem(file);
        setLoadingImg(false);
      }, 800);
    }
  }

  // Submissão do formulário
  function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!form.nome || !form.rendimento || !form.modo_preparo || itens.length === 0) {
      setMsg("Preencha todos os campos e adicione pelo menos um item.");
      return;
    }
    // Se for edição, atualizar ficha técnica
    if (editando && fichaId) {
      const pesoFinal = pesoSalvo;
      const custoFinal = custoSalvo;
      const formData = new FormData();
      formData.append('nome', form.nome);
      formData.append('rendimento', form.rendimento);
      formData.append('modo_preparo', form.modo_preparo);
      formData.append('restaurante', restauranteId);
      formData.append('peso_final', pesoFinal);
      formData.append('custo_total', custoFinal);
      if (imagem) {
        formData.append('imagem', imagem);
      }
      fetch(`/api/fichas-tecnicas/${fichaId}/`, {
        method: "PUT",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          // Atualizar itens: deletar todos e recriar
          fetch(`/api/ficha-tecnica-itens/?ficha=${fichaId}`)
            .then(res => res.json())
            .then(itensAntigos => {
              Promise.all(
                itensAntigos.map(item =>
                  fetch(`/api/ficha-tecnica-itens/${item.id}/`, { method: "DELETE" })
                )
              ).then(() => {
                Promise.all(
                  itens.map(item => {
                    const payload = {
                      ficha: Number(fichaId),
                      insumo: item.tipo === "insumo" ? Number(item.insumo) : null,
                      receita: item.tipo === "receita" ? Number(item.receita) : null,
                      quantidade_utilizada: Number(item.quantidade_utilizada),
                      unidade_medida: item.unidade_medida,
                      ic: Number(item.ic),
                      ic_tipo: item.ic_tipo,
                      ipc: Number(item.ipc),
                      aplicar_ic_ipc: Boolean(item.aplicar_ic_ipc)
                    };
                    return fetch("/api/ficha-tecnica-itens/", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    });
                  })
                ).then(() => {
                  setMsg("Ficha técnica atualizada com sucesso!");
                  setTimeout(() => navigate(`/restaurantes/${restauranteId}`), 1200);
                });
              });
            });
        })
        .catch(() => setMsg("Erro ao atualizar ficha técnica."));
      return;
    }
    // Cadastro normal (código original)
    // Validação dos itens
    for (const [idx, item] of itens.entries()) {
      if (item.tipo === "insumo" && !item.insumo) {
        setMsg(`Selecione um insumo para o item ${idx + 1}.`);
        return;
      }
      if (item.tipo === "receita" && !item.receita) {
        setMsg(`Selecione uma receita para o item ${idx + 1}.`);
        return;
      }
      if (!item.quantidade_utilizada) {
        setMsg(`Informe a quantidade utilizada para o item ${idx + 1}.`);
        return;
      }
    }
    // Calcula peso e custo total antes de enviar
    const pesoFinal = pesoSalvo;
    const custoFinal = custoSalvo;
    const formData = new FormData();
    formData.append('nome', form.nome);
    formData.append('rendimento', form.rendimento);
    formData.append('modo_preparo', form.modo_preparo);
    formData.append('restaurante', id);
    formData.append('peso_final', pesoFinal);
    formData.append('custo_total', custoFinal);
    if (imagem) {
      formData.append('imagem', imagem);
    }
    fetch("/api/fichas-tecnicas/", {
      method: "POST",
      body: formData
    })
      .then(async res => {
        const data = await res.json();
        console.log('Resposta do backend ao cadastrar ficha técnica:', data);
        if (!res.ok) {
          throw new Error('Erro ao cadastrar ficha técnica: ' + JSON.stringify(data));
        }
        return data;
      })
      .then(data => {
        if (!data.id) {
          setMsg("Erro ao cadastrar ficha técnica (ID não retornado).");
          return;
        }
        Promise.all(
          itens.map(item => {
            const payload = {
              ficha: Number(data.id),
              insumo: item.tipo === "insumo" ? Number(item.insumo) : null,
              receita: item.tipo === "receita" ? Number(item.receita) : null,
              quantidade_utilizada: Number(item.quantidade_utilizada),
              unidade_medida: item.unidade_medida,
              ic: Number(item.ic),
              ic_tipo: item.ic_tipo,
              ipc: Number(item.ipc),
              aplicar_ic_ipc: Boolean(item.aplicar_ic_ipc)
            };
            return fetch("/api/ficha-tecnica-itens/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            }).then(res => {
              if (!res.ok) {
                return res.text().then(text => { throw new Error(text); });
              }
              return res.json();
            });
          })
        )
        .then(() => {
          fetch(`/api/fichas-tecnicas/${data.id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          });
          setMsg("Ficha técnica cadastrada com sucesso!");
          setTimeout(() => navigate(`/restaurantes/${id}`), 1200);
        })
        .catch(err => {
          setMsg("Erro ao cadastrar item da ficha técnica: " + err.message);
        });
      })
      .catch(() => setMsg("Erro ao cadastrar ficha técnica."));
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-8">
      <div className="w-full max-w-5xl bg-white p-10 rounded-2xl shadow-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold"><ArrowLeft size={20}/> Voltar</button>
        <h1 className="text-2xl font-bold mb-6 text-gray-900 text-left">{editando ? 'Editar Ficha Técnica' : 'Cadastro de Ficha Técnica'}</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="mb-6 flex flex-col items-center">
            <label className="block font-semibold mb-2 text-gray-700">Imagem (opcional)</label>
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-full w-36 h-36 bg-white shadow-md cursor-pointer hover:bg-blue-50 transition"
              style={{ position: "relative" }}
              onClick={() => document.getElementById("imagem").click()}
            >
              {loadingImg ? (
                <div className="flex items-center justify-center h-full">
                  <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                </div>
              ) : imagem ? (
                <img
                  src={URL.createObjectURL(imagem)}
                  alt="Preview"
                  className="rounded-full object-cover w-32 h-32 shadow-lg border-4 border-blue-200"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-blue-400">
                  <Plus className="w-10 h-10 mb-2" />
                  <span className="text-xs text-blue-400">Clique para escolher</span>
                </div>
              )}
              <input
                id="imagem"
                type="file"
                accept="image/*"
                name="imagem"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Formatos aceitos: JPG, PNG, até 5MB.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nome da Ficha Técnica</label>
              <input name="nome" value={form.nome} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-lg" />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Rendimento (ex: 10 porções de 100g)</label>
              <input name="rendimento" value={form.rendimento} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-lg" />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Modo de Preparo</label>
            <textarea name="modo_preparo" value={form.modo_preparo} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-3 w-full min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Itens da Ficha Técnica</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-2">
                <div className="flex gap-3 mb-4 flex-wrap">
                  <button type="button" onClick={() => addItem('insumo')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"><Plus className="w-4 h-4" /> Adicionar Insumo</button>
                  <button type="button" onClick={() => addItem('receita')} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition"><Plus className="w-4 h-4" /> Adicionar Receita</button>
                </div>
                {itens.length === 0 && <div className="text-gray-500 mb-4">Nenhum item adicionado.</div>}
                <div className="space-y-3">
                  {itens.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition hover:shadow-md">
                      <div className="md:col-span-2">
                        {item.tipo === "insumo" ? (
                          <>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Insumo</label>
                            <select value={item.insumo} onChange={e => handleItemChange(idx, "insumo", e.target.value)} required className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                              <option value="">Selecione o insumo</option>
                              {insumos.map(insumo => (
                                <option key={insumo.id} value={insumo.id}>{insumo.nome}</option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Receita</label>
                            <select value={item.receita} onChange={e => handleItemChange(idx, "receita", e.target.value)} required className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition">
                              <option value="">Selecione a receita</option>
                              {receitas.map(receita => (
                                <option key={receita.id} value={receita.id}>{receita.nome}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Qtd.</label>
                        <input type="number" min="0" step="0.001" value={item.quantidade_utilizada} onChange={e => handleItemChange(idx, "quantidade_utilizada", e.target.value)} required className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Unidade</label>
                        <select value={item.unidade_medida} onChange={e => handleItemChange(idx, "unidade_medida", e.target.value)} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="un">un</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Índice de Cocção (%)</label>
                        <input type="number" min="0" max="999" step="0.01" value={item.ic} onChange={e => handleItemChange(idx, "ic", e.target.value)} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">IC é para</label>
                        <select value={item.ic_tipo} onChange={e => handleItemChange(idx, "ic_tipo", e.target.value)} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                          <option value="menos">-</option>
                          <option value="mais">+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Índice de Partes Comestíveis (%)</label>
                        <input type="number" min="0" max="999" step="0.01" value={item.ipc} onChange={e => handleItemChange(idx, "ipc", e.target.value)} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Aplicar IC/IPC</label>
                        <input type="checkbox" checked={item.aplicar_ic_ipc} onChange={e => handleItemChange(idx, "aplicar_ic_ipc", e.target.checked)} className="w-5 h-5 mt-1" />
                      </div>
                      <div className="text-center">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Peso Ajustado</label>
                        <div className="font-mono text-base text-gray-900">{calcPesoAjustado(item).toFixed(2)} {item.unidade_medida}</div>
                      </div>
                      <div className="text-center">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Custo Ajustado</label>
                        <div className="font-mono text-base text-gray-900">R$ {calcCustoAjustado(item).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center justify-center">
                        <button type="button" onClick={() => removeItem(idx)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold shadow transition">Remover</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between font-semibold text-blue-700">
                    <span>Peso final:</span>
                    <span>{typeof pesoSalvo === "number" && !isNaN(pesoSalvo) ? pesoSalvo.toFixed(2) : "-"} g</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-700">
                    <span>Custo total:</span>
                    <span>R$ {typeof custoSalvo === "number" && !isNaN(custoSalvo) ? custoSalvo.toFixed(2) : "-"}</span>
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-green-700 transition flex items-center justify-center gap-2">{editando ? 'Atualizar Ficha Técnica' : 'Cadastrar Ficha Técnica'}</button>
              </div>
            </div>
          </div>
          {msg && <div className="mt-2 text-center text-sm text-blue-600">{msg}</div>}
        </form>
      </div>
    </div>
  );
} 