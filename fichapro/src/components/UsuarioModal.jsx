import { useEffect, useState } from "react";

export default function UsuarioModal({ open, onClose, usuario, atualizarUsuario }) {
  const [aba, setAba] = useState('dados');
  const [form, setForm] = useState({ first_name: '', email: '' });
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setForm({ first_name: usuario.first_name || '', email: usuario.email || '' });
    } else {
      setForm({ first_name: '', email: '' });
    }
    setMsg('');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setAba('dados');
  }, [open, usuario]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSalvarDados(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const token = localStorage.getItem('token');
    if (!form.first_name || !form.email) {
      setMsg('Preencha todos os campos.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/me/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Dados atualizados com sucesso!');
        atualizarUsuario && atualizarUsuario();
      } else {
        setMsg('Erro ao atualizar dados.');
      }
    } catch {
      setMsg('Erro de conexão.');
    }
    setLoading(false);
  }

  async function handleAlterarSenha(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMsg('Preencha todos os campos.');
      setLoading(false);
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setMsg('A confirmação da nova senha não confere.');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ old_password: senhaAtual, new_password: novaSenha })
      });
      if (res.ok) {
        setMsg('Senha alterada com sucesso!');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      } else {
        const data = await res.json();
        setMsg(data.detail || 'Erro ao alterar senha.');
      }
    } catch {
      setMsg('Erro de conexão.');
    }
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl p-8 min-w-[350px] relative">
        <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-xl">×</button>
        <div className="flex gap-2 mb-6">
          <button className={`px-4 py-2 rounded-lg font-semibold ${aba === 'dados' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setAba('dados')}>Dados pessoais</button>
          <button className={`px-4 py-2 rounded-lg font-semibold ${aba === 'senha' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setAba('senha')}>Alterar senha</button>
        </div>
        {msg && <div className="mb-3 text-center text-sm text-red-600">{msg}</div>}
        {aba === 'dados' && (
          <form onSubmit={handleSalvarDados} className="flex flex-col gap-4">
            <input
              type="text"
              name="first_name"
              placeholder="Nome"
              className="border rounded-lg px-4 py-3"
              value={form.first_name}
              onChange={handleChange}
              autoComplete="off"
            />
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              className="border rounded-lg px-4 py-3"
              value={form.email}
              onChange={handleChange}
              autoComplete="off"
            />
            <button type="submit" className="bg-blue-600 text-white rounded-lg py-3 font-bold mt-2" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </form>
        )}
        {aba === 'senha' && (
          <form onSubmit={handleAlterarSenha} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Senha atual"
              className="border rounded-lg px-4 py-3"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              autoComplete="current-password"
            />
            <input
              type="password"
              placeholder="Nova senha"
              className="border rounded-lg px-4 py-3"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirmar nova senha"
              className="border rounded-lg px-4 py-3"
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              autoComplete="new-password"
            />
            <button type="submit" className="bg-blue-600 text-white rounded-lg py-3 font-bold mt-2" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </form>
        )}
      </div>
    </div>
  );
} 