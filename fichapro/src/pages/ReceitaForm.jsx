import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import usePerfisUsuario from "../hooks/usePerfisUsuario";
import { Plus, ArrowLeft } from 'lucide-react';

export default function ReceitaForm() {
  const { id, receitaId } = useParams(); // id do restaurante, receitaId opcional
  const navigate = useNavigate();
  const [insumos, setInsumos] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    tempo_preparo: "",
    porcao_sugerida: "",
    modo_preparo: ""
  });
  const [itens, setItens] = useState([]); // insumos da receita
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [restauranteId, setRestauranteId] = useState(id);
  const [imagem, setImagem] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();

  // Verificações de segurança para evitar erros
  const perfilRestaurante = perfis && perfis.length > 0 ? perfis.find(p => String(p.restaurante) === String(restauranteId)) : null;
  let perfil = perfilRestaurante ? perfilRestaurante.perfil : null;
  
  // Se não houver vínculo, mas o usuário for admin, considerar como administrador
  if (!perfil && (!perfis || perfis.length === 0)) perfil = 'administrador';
  
  // Verificar se é admin global (is_staff ou is_superuser)
  const isAdmin = perfis && perfis.some(p => p.perfil === 'administrador' && p.restaurante === null);
  const podeEditar = perfil === 'administrador' || perfil === 'redator' || isAdmin;

  // Carregar insumos do restaurante
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = { Authorization: 'Bearer ' + token };
    fetch(`/api/insumos/?restaurante=${id}`, { headers })
      .then(res => res.json())
      .then(data => {
        setInsumos(data);
        setLoading(false);
      });
  }, [id]);

  // Se for edição, buscar dados da receita
  useEffect(() => {
    if (!receitaId || loading || insumos.length === 0) return;
    setEditando(true);
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    fetch(`/api/receitas/${receitaId}/`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Receita não encontrada.');
        return res.json();
      })
      .then(data => {
        setForm({
          nome: data.nome,
          tempo_preparo: data.tempo_preparo,
          porcao_sugerida: data.porcao_sugerida,
          modo_preparo: data.modo_preparo
        });
        setRestauranteId(data.restaurante);
        setItens(
          (data.itens || []).map(item => ({
            insumo: item.insumo,
            quantidade_utilizada: item.quantidade_utilizada,
            unidade_medida: item.unidade_medida,
            ic: item.ic,
            ic_tipo: item.ic_tipo,
            ipc: item.ipc,
            aplicar_ic_ipc: item.aplicar_ic_ipc
          }))
        );
        if (data.imagem) setImagem(data.imagem);
        setLoading(false);
      })
      .catch(err => {
        setMsg(err.message);
        setLoading(false);
      });
  }, [receitaId, insumos.length]);

  if (loading || loadingPerfis) return <div className="text-center text-gray-500 py-10">Carregando...</div>;
  if (!podeEditar && !isAdmin) return <div className="text-center text-red-500 py-10">Acesso negado: você não tem permissão para cadastrar ou editar receitas neste restaurante.</div>;

  if (msg) return <div className="text-center text-red-600 py-10 text-lg font-semibold">{msg}</div>;

  // Adicionar novo insumo à receita
  function addInsumo() {
    setItens([
      ...itens,
      {
        insumo: "",
        quantidade_utilizada: "",
        unidade_medida: "g",
        ic: 100,
        ic_tipo: "menos",
        ipc: 100,
        aplicar_ic_ipc: true
      }
    ]);
  }

  // Remover insumo
  function removeInsumo(idx) {
    setItens(itens.filter((_, i) => i !== idx));
  }

  // Atualizar campo de insumo
  function handleItemChange(idx, field, value) {
    const novos = [...itens];
    novos[idx][field] = value;
    // Se mudou o insumo, sugere unidade padrão do insumo
    if (field === "insumo") {
      const insumoObj = insumos.find(i => String(i.id) === String(value));
      novos[idx].unidade_medida = insumoObj ? insumoObj.unidade_medida : "g";
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

  // Cálculo de peso e custo ajustados
  function calcPesoAjustado(item) {
    if (!item.quantidade_utilizada || !item.aplicar_ic_ipc) return Number(item.quantidade_utilizada) || 0;
    const ic = Number(item.ic) / 100;
    const ipc = Number(item.ipc) / 100;
    if (item.ic_tipo === "mais") {
      return Number(item.quantidade_utilizada) / (ic * ipc || 1);
    } else {
      return Number(item.quantidade_utilizada) * ic * ipc;
    }
  }
  function calcCustoAjustado(item) {
    const insumo = insumos.find(i => String(i.id) === String(item.insumo));
    if (!insumo || !item.quantidade_utilizada) return 0;
    const custo_unit = Number(insumo.preco) / Number(insumo.peso || 1);
    if (!item.aplicar_ic_ipc) {
      return custo_unit * Number(item.quantidade_utilizada);
    }
    const ic = Number(item.ic) / 100;
    const ipc = Number(item.ipc) / 100;
    if (item.ic_tipo === "mais") {
      return (custo_unit * Number(item.quantidade_utilizada)) * (ic * ipc || 1);
    } else {
      return (custo_unit * Number(item.quantidade_utilizada)) / (ic * ipc || 1);
    }
  }

  // Soma total
  const pesoTotal = itens.reduce((acc, item) => acc + calcPesoAjustado(item), 0);
  const custoTotal = itens.reduce((acc, item) => acc + calcCustoAjustado(item), 0);

  // Cálculo do rendimento
  const porcao = Number(form.porcao_sugerida) || 0;
  const rendimento = porcao > 0 ? pesoTotal / porcao : 0;

  // Submissão do formulário
  function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!form.nome || !form.tempo_preparo || !form.modo_preparo || itens.length === 0) {
      setMsg("Preencha todos os campos e adicione pelo menos um insumo.");
      return;
    }
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    if (editando && receitaId) {
      const formData = new FormData();
      formData.append('nome', form.nome);
      formData.append('tempo_preparo', form.tempo_preparo);
      formData.append('modo_preparo', form.modo_preparo);
      formData.append('porcao_sugerida', form.porcao_sugerida);
      formData.append('restaurante', restauranteId);
      // Só adiciona imagem se for um arquivo novo
      if (imagem && typeof imagem !== 'string') {
        formData.append('imagem', imagem);
      }
      fetch(`/api/receitas/${receitaId}/`, {
        method: 'PATCH', // PATCH é mais seguro para multipart/form-data
        headers: {
          Authorization: 'Bearer ' + token
        },
        body: formData
      })
        .then(async res => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error('Erro ao editar receita: ' + errorText);
          }
          return res.json();
        })
        .then(data => {
          // Deleta todos os insumos antigos da receita
          fetch(`/api/receita-insumos/?receita=${receitaId}`, { headers: { Authorization: 'Bearer ' + token } })
            .then(res => res.json())
            .then(insumosAntigos => {
              Promise.all(insumosAntigos.map(item =>
                fetch(`/api/receita-insumos/${item.id}/`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
              )).then(() => {
                // Cria os novos insumos
                Promise.all(
                  itens.map(item =>
                    fetch("/api/receita-insumos/", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: 'Bearer ' + token },
                      body: JSON.stringify({
                        receita: receitaId,
                        insumo: item.insumo,
                        quantidade_utilizada: item.quantidade_utilizada,
                        ic: item.ic,
                        ipc: item.ipc,
                        aplicar_ic_ipc: item.aplicar_ic_ipc
                      })
                    })
                  )
                ).then(() => {
                  setMsg("Receita editada com sucesso!");
                  setTimeout(() => navigate(`/restaurantes/${restauranteId}`), 1200);
                });
              });
            });
        })
        .catch((err) => setMsg(err.message));
      return;
    }
    // Cadastro normal
    const formData = new FormData();
    formData.append('nome', form.nome);
    formData.append('tempo_preparo', form.tempo_preparo);
    formData.append('modo_preparo', form.modo_preparo);
    formData.append('porcao_sugerida', form.porcao_sugerida);
    formData.append('restaurante', id);
    if (imagem) {
      formData.append('imagem', imagem);
    }
    fetch("/api/receitas/", {
      method: "POST",
      headers,
      body: formData
    })
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error('Erro ao cadastrar receita: ' + errorText);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.id) {
          throw new Error('Erro ao cadastrar receita: resposta inválida do servidor.');
        }
        // Cria os itens da receita
        Promise.all(
          itens.map(item =>
            fetch("/api/receita-insumos/", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...headers },
              body: JSON.stringify({
                receita: data.id,
                insumo: item.insumo,
                quantidade_utilizada: item.quantidade_utilizada,
                ic: item.ic,
                ipc: item.ipc,
                aplicar_ic_ipc: item.aplicar_ic_ipc
              })
            })
          )
        ).then(() => {
          setMsg("Receita cadastrada com sucesso!");
          setTimeout(() => navigate(`/restaurantes/${data.restaurante}`), 1200);
        });
      })
      .catch((err) => setMsg(err.message));
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-8">
      <div className="w-full max-w-5xl bg-white p-10 rounded-2xl shadow-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold"><ArrowLeft size={20}/> Voltar</button>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Cadastro de Receita</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Dados principais */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mb-2">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Dados da Receita</h2>
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nome da Receita</label>
            <input name="nome" value={form.nome} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tempo de Preparo (min)</label>
            <input name="tempo_preparo" value={form.tempo_preparo} onChange={handleChange} required type="number" min="0" className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Porção Sugerida</label>
            <input name="porcao_sugerida" value={form.porcao_sugerida} onChange={handleChange} required type="number" min="1" className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block font-semibold text-gray-700 mb-1">Modo de Preparo</label>
            <textarea name="modo_preparo" value={form.modo_preparo} onChange={handleChange} rows={4} className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base resize-none" />
          </div>
          {/* Imagem */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Imagem (opcional)</h2>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-6 bg-white cursor-pointer hover:border-blue-500 transition">
              {imagem ? (
                <img src={typeof imagem === 'string' ? imagem : URL.createObjectURL(imagem)} alt="Preview" className="w-24 h-24 object-cover rounded-full mb-2" />
              ) : (
                <>
                  <span className="text-blue-500 font-medium">Clique para escolher</span>
                  <span className="text-xs text-gray-400 mt-1">Formatos aceitos: JPG, PNG, até 5MB.</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          {/* Insumos */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
            <h2 className="text-lg font-bold mb-2 text-gray-800">Insumos da Receita</h2>
            <button type="button" onClick={addInsumo} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition mb-2"><Plus className="w-4 h-4" /> Adicionar Insumo</button>
            {itens.length === 0 ? (
              <div className="text-gray-500 text-sm mt-2">Nenhum insumo adicionado.</div>
            ) : (
              <div className="space-y-2">
                {itens.map((item, idx) => {
                  const insumoObj = insumos.find(insumo => String(insumo.id) === String(item.insumo));
                  let custoProporcional = 0;
                  if (insumoObj && item.quantidade_utilizada) {
                    const preco = Number(insumoObj.preco);
                    const peso = Number(insumoObj.peso) || 1;
                    custoProporcional = (preco / peso) * Number(item.quantidade_utilizada);
                  }
                  return (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-10 gap-2 items-end bg-gray-50 p-2 rounded border border-gray-200 flex-wrap">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Insumo</label>
                        <select value={item.insumo} onChange={e => handleItemChange(idx, 'insumo', e.target.value)} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                          <option value="">Selecione o insumo</option>
                          {insumos.map(insumo => (
                            <option key={insumo.id} value={insumo.id}>{insumo.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Qtd.</label>
                        <input type="number" min="0" step="0.01" value={item.quantidade_utilizada} onChange={e => handleItemChange(idx, 'quantidade_utilizada', e.target.value)} placeholder="Qtd" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Unidade</label>
                        <select value={item.unidade_medida} onChange={e => handleItemChange(idx, 'unidade_medida', e.target.value)} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="un">un</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">IC (%)</label>
                        <input type="number" min="0" max="999" step="0.01" value={item.ic} onChange={e => handleItemChange(idx, 'ic', e.target.value)} placeholder="IC" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">IC é para</label>
                        <select value={item.ic_tipo} onChange={e => handleItemChange(idx, 'ic_tipo', e.target.value)} className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                          <option value="menos">-</option>
                          <option value="mais">+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">IPC (%)</label>
                        <input type="number" min="0" max="999" step="0.01" value={item.ipc} onChange={e => handleItemChange(idx, 'ipc', e.target.value)} placeholder="IPC" className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Aplicar IC/IPC</label>
                        <input type="checkbox" checked={item.aplicar_ic_ipc} onChange={e => handleItemChange(idx, 'aplicar_ic_ipc', e.target.checked)} className="w-5 h-5 mt-1" />
                      </div>
                      <div className="text-center">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Custo</label>
                        <div className="font-mono text-base text-gray-900">R$ {custoProporcional.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center justify-center">
                        <button type="button" onClick={() => removeInsumo(idx)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold shadow transition">Remover</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Peso final da receita:</span>
            <span className="font-mono text-gray-900">{pesoTotal.toFixed(2)} g</span>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Custo total da receita:</span>
            <span className="font-mono text-gray-900">R$ {custoTotal.toFixed(2)}</span>
          </div>
          <button type="submit" className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition mt-4"><Plus className="w-4 h-4" /> Salvar Receita</button>
        </form>
      </div>
    </div>
  );
} 