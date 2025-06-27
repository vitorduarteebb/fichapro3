import { useState } from "react";

export default function DadosGerais({ values, setValues }) {
  const [cnpj, setCnpj] = useState(values.cnpj || "");

  const handleConsultaCnpj = async () => {
    try {
      const resp = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
      if (!resp.ok) throw new Error("CNPJ não encontrado");
      const data = await resp.json();
      setValues(prev => ({
        ...prev,
        nome: data.razao_social || "",
        fantasia: data.estabelecimento?.nome_fantasia || "",
        ie: data.estabelecimento?.inscricoes_estaduais?.[0]?.inscricao_estadual || ""
      }));
    } catch (e) {
      alert("CNPJ não encontrado ou erro na consulta.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Tipo de Pessoa</label>
        <select
          className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          value={values.tipoPessoa}
          onChange={e => setValues(prev => ({ ...prev, tipoPessoa: e.target.value }))}
        >
          <option value="F">Física</option>
          <option value="J">Jurídica</option>
        </select>
      </div>
      {values.tipoPessoa === "J" && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">CNPJ</label>
          <div className="flex gap-2">
            <input
              className="border border-gray-300 rounded-lg p-3 flex-1 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              value={cnpj}
              onChange={e => { setCnpj(e.target.value); setValues(prev => ({ ...prev, cnpj: e.target.value })); }}
              placeholder="Digite o CNPJ"
            />
            <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg transition" onClick={handleConsultaCnpj}>
              Buscar Dados
            </button>
          </div>
        </div>
      )}
      {values.tipoPessoa === "F" && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">CPF</label>
          <input
            className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
            value={values.cpf}
            onChange={e => setValues(prev => ({ ...prev, cpf: e.target.value }))}
            placeholder="Digite o CPF"
          />
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Nome/Razão Social</label>
        <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.nome} onChange={e => setValues(prev => ({...prev, nome: e.target.value}))} placeholder="Nome do Restaurante" />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Nome Fantasia</label>
        <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.fantasia} onChange={e => setValues(prev => ({...prev, fantasia: e.target.value}))} placeholder="Nome Fantasia" />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">IE (Inscrição Estadual)</label>
        <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.ie} onChange={e => setValues(prev => ({...prev, ie: e.target.value}))} placeholder="Inscrição Estadual" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">E-mail</label>
          <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.email} onChange={e => setValues(prev => ({...prev, email: e.target.value}))} placeholder="E-mail" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Telefone</label>
          <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.telefone} onChange={e => setValues(prev => ({...prev, telefone: e.target.value}))} placeholder="Telefone" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Status</label>
        <select className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.status} onChange={e => setValues(prev => ({...prev, status: e.target.value}))}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>
    </div>
  );
} 