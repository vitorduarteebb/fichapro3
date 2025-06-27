import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DadosGerais from "../components/Restaurante/DadosGerais";
import EnderecoForm from "../components/Restaurante/EnderecoForm";
import LogoUpload from "../components/Restaurante/LogoUpload";
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

const steps = [
  { label: "Dados Gerais" },
  { label: "Endereço" },
  { label: "Logo" },
];

export default function RestauranteForm() {
  const [step, setStep] = useState(0);
  // Estado centralizado
  const [dadosGerais, setDadosGerais] = useState({
    tipoPessoa: "J",
    cnpj: "",
    cpf: "",
    nome: "",
    fantasia: "",
    ie: "",
    email: "",
    telefone: "",
    status: "ativo"
  });
  const [endereco, setEndereco] = useState({
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: ""
  });
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      // Dados gerais
      Object.entries(dadosGerais).forEach(([k, v]) => formData.append(k, v));
      // Endereço
      Object.entries(endereco).forEach(([k, v]) => formData.append(k, v));
      // Logo
      if (logo) formData.append("logo", logo);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: 'Bearer ' + token } : {};
      const resp = await fetch("/api/restaurantes/", {
        method: "POST",
        headers,
        body: formData
      });
      if (resp.ok) {
        alert("Restaurante cadastrado com sucesso!");
        navigate('/restaurantes');
      } else {
        alert("Erro ao cadastrar restaurante.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex items-center justify-center">
      <form className="w-full max-w-lg mx-auto px-8 py-10 bg-white rounded-3xl shadow-2xl flex flex-col gap-8" onSubmit={handleSubmit}>
        {/* Barra de progresso dos passos */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {steps.map((s, idx) => (
            <div key={s.label} className="flex flex-col items-center">
              <button
                type="button"
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 text-xl font-bold shadow-sm ${step === idx ? "bg-blue-600 border-blue-600 text-white" : step > idx ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 text-gray-400"}`}
                onClick={() => setStep(idx)}
                aria-label={s.label}
              >
                {step > idx ? <CheckCircle size={28} /> : idx + 1}
              </button>
              <span className={`mt-2 text-sm font-semibold ${step === idx ? "text-blue-600" : step > idx ? "text-green-600" : "text-gray-500"}`}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2">
          {step === 0 && <DadosGerais values={dadosGerais} setValues={setDadosGerais} />}
          {step === 1 && <EnderecoForm values={endereco} setValues={setEndereco} />}
          {step === 2 && <LogoUpload logo={logo} setLogo={setLogo} />}
          <div className="flex justify-between mt-10 gap-4">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-xl text-lg font-semibold shadow transition w-1/2"><ArrowLeft size={20}/> Voltar</button>
            )}
            {step < steps.length - 1 && (
              <button type="button" onClick={() => setStep(step + 1)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow transition w-1/2">Avançar <ArrowRight size={20}/></button>
            )}
            {step === steps.length - 1 && (
              <button type="submit" className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow transition w-full" disabled={loading}>
                <CheckCircle size={22}/>
                {loading ? "Salvando..." : "Finalizar Cadastro"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
} 