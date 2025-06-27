import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from 'lucide-react';

export default function CriarNovo() {
  const [form, setForm] = useState({ nome: "", descricao: "" });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setMsg("Cadastro realizado com sucesso!");
    setForm({ nome: "", descricao: "" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-blue-700 hover:text-blue-900 font-semibold self-start"><ArrowLeft size={20}/> Voltar</button>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Criar Novo Registro</h1>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nome</label>
            <input name="nome" value={form.nome} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Descrição</label>
            <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={3} className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base resize-none" />
          </div>
          <button type="submit" className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition mt-2 w-full justify-center"><Plus className="w-4 h-4" /> Salvar</button>
          {msg && <div className="mt-2 text-center text-green-600 font-semibold">{msg}</div>}
        </form>
      </div>
    </div>
  );
} 