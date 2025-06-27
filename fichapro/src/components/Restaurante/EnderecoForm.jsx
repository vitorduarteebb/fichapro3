import { useState } from "react";

export default function EnderecoForm({ values, setValues }) {
  const [cep, setCep] = useState(values.cep || "");

  const buscarCep = async () => {
    if (cep.length === 8) {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      setValues(prev => ({
        ...prev,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || ""
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="block text-sm text-gray-600 mb-1">CEP</label>
        <input
          className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
          value={cep}
          onChange={e => { setCep(e.target.value.replace(/\D/g, "")); setValues(prev => ({ ...prev, cep: e.target.value.replace(/\D/g, "") })); }}
          onBlur={buscarCep}
          placeholder="Digite o CEP"
          maxLength={8}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Rua</label>
        <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.rua} onChange={e => setValues(prev => ({ ...prev, rua: e.target.value }))} placeholder="Rua" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Número</label>
          <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.numero} onChange={e => setValues(prev => ({ ...prev, numero: e.target.value }))} placeholder="Número" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Complemento</label>
          <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.complemento} onChange={e => setValues(prev => ({ ...prev, complemento: e.target.value }))} placeholder="Complemento (opcional)" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Bairro</label>
        <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.bairro} onChange={e => setValues(prev => ({ ...prev, bairro: e.target.value }))} placeholder="Bairro" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Cidade</label>
          <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.cidade} onChange={e => setValues(prev => ({ ...prev, cidade: e.target.value }))} placeholder="Cidade" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Estado (UF)</label>
          <input className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition" value={values.estado} onChange={e => setValues(prev => ({ ...prev, estado: e.target.value }))} placeholder="UF" maxLength={2} />
        </div>
      </div>
    </div>
  );
} 