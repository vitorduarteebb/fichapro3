import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Pencil, Trash2 } from 'lucide-react';
import usePerfisUsuario from "../hooks/usePerfisUsuario";
import dayjs from 'dayjs';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [form, setForm] = useState({ username: "", email: "", password: "", perfil: "usuario_comum", restaurante: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCadastro, setLoadingCadastro] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ email: "", is_active: true, perfil: "usuario_comum", restaurante: "" });
  const [buscaUsuario, setBuscaUsuario] = useState("");

  const navigate = useNavigate();
  const { perfis, loading: loadingPerfis } = usePerfisUsuario();
  const perfilLogado = perfis[0]?.perfil;
  let restaurantesFiltrados = restaurantes;
  if (!loadingPerfis && perfilLogado === "master") {
    const idsVinculados = perfis.filter(p => p.perfil === "master").map(p => p.restaurante);
    restaurantesFiltrados = restaurantes.filter(r => idsVinculados.includes(r.id));
  }

  // Função utilitária para obter headers com token
  function getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    };
  }

  useEffect(() => {
    fetch("/api/usuarios/", { headers: getAuthHeaders() })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
          window.location.href = "/login";
          return [];
        }
        return res.json();
      })
      .then(data => setUsuarios(Array.isArray(data) ? data : []));
    fetch("/api/restaurantes/", { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setRestaurantes(data));
    setLoading(false);
  }, [msg]);

  function handleChange(e) {
    if (e.target.name === "restaurante" && form.perfil === "redator") {
      // Multi-select para redator
      const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
      setForm({ ...form, restaurante: options });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    // Só exige restaurante se não for administrador
    if (form.perfil !== "administrador" && (!form.restaurante || (Array.isArray(form.restaurante) && form.restaurante.length === 0))) {
      setMsg("Selecione um restaurante para vincular o usuário.");
      return;
    }
    setLoadingCadastro(true);
    // Monta o payload sem restaurante para admin
    let payload = { ...form };
    if (form.perfil === "administrador") {
      delete payload.restaurante;
      payload.is_staff = true;
      payload.is_superuser = true;
    } else if (form.perfil === "redator" && Array.isArray(form.restaurante)) {
      payload.restaurante = form.restaurante.map(id => parseInt(id, 10));
    } else {
      // Para master e usuario_comum, garantir array
      payload.restaurante = [parseInt(form.restaurante, 10)];
    }
    fetch("/api/usuarios/criar/", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
          window.location.href = "/login";
          return {};
        }
        if (res.ok && data.id) {
          setMsg("Usuário cadastrado com sucesso!");
          setForm({ username: "", email: "", password: "", perfil: "usuario_comum", restaurante: "" });
        } else {
          let erro = data.detail || data.non_field_errors || data.username || data.email || data.password || data.perfil || data.restaurante || data;
          if (Array.isArray(erro)) erro = erro.join(" ");
          setMsg("Erro ao cadastrar usuário: " + JSON.stringify(erro));
        }
      })
      .catch(() => setMsg("Erro ao cadastrar usuário."))
      .finally(() => setLoadingCadastro(false));
  }

  function handleDelete(userId) {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
    fetch(`/api/usuarios/${userId}/`, { method: "DELETE", headers: getAuthHeaders() })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
          window.location.href = "/login";
          return;
        }
        if (res.ok) {
          setMsg("Usuário excluído com sucesso!");
          setUsuarios(usuarios.filter(u => u.id !== userId));
        } else {
          setMsg("Erro ao excluir usuário.");
        }
      })
      .catch(() => setMsg("Erro ao excluir usuário."));
  }

  function startEdit(u) {
    setEditandoId(u.id);
    setEditForm({
      email: u.email,
      is_active: u.is_active,
      perfil: u.perfis[0]?.perfil ? perfilToValue(u.perfis[0].perfil) : "usuario_comum",
      restaurante: restaurantesFiltrados.find(r => r.nome === u.perfis[0]?.restaurante)?.id || ""
    });
  }

  function perfilToValue(perfil) {
    if (perfil === "Administrador") return "administrador";
    if (perfil === "Master") return "master";
    if (perfil === "Redator") return "redator";
    return "usuario_comum";
  }

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  }

  function handleEditSave(userId) {
    // Sempre envia perfil e restaurante, mesmo se não alterados
    const payload = {
      email: editForm.email,
      is_active: editForm.is_active,
      perfil: editForm.perfil || "usuario_comum",
      restaurante: editForm.restaurante || ""
    };
    fetch(`/api/usuarios/${userId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
          window.location.href = "/login";
          return {};
        }
        return res.json();
      })
      .then(data => {
        setMsg("Usuário atualizado com sucesso!");
        setEditandoId(null);
        setUsuarios(usuarios.map(u => u.id === userId ? { ...u, ...data } : u));
      })
      .catch(() => setMsg("Erro ao atualizar usuário."));
  }

  function handleEditCancel() {
    setEditandoId(null);
  }

  // Função para status visual
  function getStatusColor(u) {
    if (!u.is_active) return 'bg-red-500';
    if (!u.last_login) return 'bg-red-500';
    const diff = dayjs().diff(dayjs(u.last_login), 'minute');
    if (diff <= 5) return 'bg-green-500';
    if (diff <= 1440) return 'bg-yellow-400';
    return 'bg-red-500';
  }

  if (loading || loadingPerfis) return <div className="text-center text-gray-500 py-10">Carregando...</div>;

  const usuariosArray = Array.isArray(usuarios) ? usuarios : [];

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold"><ArrowLeft size={20}/> Voltar</button>
      <h1 className="text-2xl font-bold mb-4">Usuários</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 mb-8 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Cadastrar novo usuário</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Usuário</label>
            <input name="username" value={form.username} onChange={handleChange} required className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block font-medium">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" required className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block font-medium">Senha</label>
            <input name="password" value={form.password} onChange={handleChange} type="password" required className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block font-medium">Perfil</label>
            <select name="perfil" value={form.perfil} onChange={handleChange} required className="border rounded px-2 py-1 w-full">
              <option value="administrador">Administrador</option>
              <option value="master">Master</option>
              <option value="redator">Redator</option>
              <option value="usuario_comum">Usuário Comum</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium">Restaurante vinculado</label>
            {form.perfil === "redator" ? (
              <>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border rounded p-2">
                  {restaurantesFiltrados.map(r => (
                    <label key={r.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={r.id}
                        checked={Array.isArray(form.restaurante) && form.restaurante.includes(String(r.id))}
                        onChange={e => {
                          let novaLista = Array.isArray(form.restaurante) ? [...form.restaurante] : [];
                          if (e.target.checked) {
                            novaLista.push(String(r.id));
                          } else {
                            novaLista = novaLista.filter(id => id !== String(r.id));
                          }
                          setForm({ ...form, restaurante: novaLista });
                        }}
                      />
                      {r.nome}
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <select name="restaurante" value={form.restaurante} onChange={handleChange} 
                required={form.perfil !== "administrador"} 
                disabled={form.perfil === "administrador"}
                className="border rounded px-2 py-1 w-full">
                <option value="">Selecione o restaurante</option>
                {restaurantesFiltrados.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition" disabled={loadingCadastro}>
          {loadingCadastro ? "Cadastrando..." : "Cadastrar Usuário"}
        </button>
        {msg && <div className="mt-2 text-center text-sm text-blue-600">{msg}</div>}
      </form>
      <h2 className="text-xl font-semibold mb-2">Lista de usuários</h2>
      <div className="flex items-center mb-3">
        <Search className="text-gray-400 mr-2" size={18} />
        <input
          type="text"
          placeholder="Buscar usuário por nome ou email..."
          value={buscaUsuario}
          onChange={e => setBuscaUsuario(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base"
          style={{ minWidth: 220 }}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-2 px-3 text-left">Usuário</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-left">Ativo</th>
              <th className="py-2 px-3 text-left">Perfis/Vínculos</th>
              <th className="py-2 px-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuariosArray.filter(u =>
              u.username.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
              u.email.toLowerCase().includes(buscaUsuario.toLowerCase())
            ).map(u => (
              <tr key={u.id}>
                <td className="py-2 px-3 font-medium text-gray-900 flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full border border-gray-300 ${getStatusColor(u)}`}></span>
                  {u.username}
                </td>
                <td className="py-2 px-3">{u.email}</td>
                <td className="py-2 px-3">{u.is_active ? "Sim" : "Não"}</td>
                <td className="py-2 px-3">
                  {u.is_superuser || u.is_staff ? (
                    <span className="text-xs text-gray-800 font-bold">Administrador</span>
                  ) : u.perfis && u.perfis.length > 0 ? (
                    <ul className="text-xs text-gray-700 space-y-1">
                      {u.perfis.map((p, i) => (
                        <li key={i}><b>{p.perfil}</b> em {p.restaurante}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-gray-400">Nenhum vínculo</span>
                  )}
                </td>
                <td className="py-2 px-3 flex gap-2">
                  {editandoId === u.id ? (
                    <form onSubmit={e => { e.preventDefault(); handleEditSave(u.id); }} className="flex flex-col gap-2 w-64 bg-yellow-50 p-2 rounded shadow">
                      <input name="email" value={editForm.email} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" />
                      <select name="perfil" value={editForm.perfil} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" disabled={u.is_superuser || u.is_staff}>
                        <option value="administrador">Administrador</option>
                        <option value="master">Master</option>
                        <option value="redator">Redator</option>
                        <option value="usuario_comum">Usuário Comum</option>
                      </select>
                      <select name="restaurante" value={editForm.restaurante} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" disabled={u.is_superuser || u.is_staff}>
                        <option value="">Selecione o restaurante</option>
                        {restaurantesFiltrados.map(r => (
                          <option key={r.id} value={r.id}>{r.nome}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" name="is_active" checked={editForm.is_active} onChange={handleEditChange} /> Ativo
                      </label>
                      <div className="flex gap-2 mt-2">
                        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700 transition">Salvar</button>
                        <button type="button" onClick={handleEditCancel} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-300 transition">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button onClick={() => startEdit(u)} className="flex items-center gap-1 border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-1 rounded text-xs font-semibold transition"><Pencil size={14}/> Editar</button>
                      <button onClick={() => handleDelete(u.id)} className="flex items-center gap-1 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs font-semibold transition"><Trash2 size={14}/> Excluir</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500 border border-gray-300"></span>Online</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400 border border-gray-300"></span>Inativo</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-500 border border-gray-300"></span>Offline</span>
      </div>
    </div>
  );
} 