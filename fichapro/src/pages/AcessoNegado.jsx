import { Link } from "react-router-dom";

export default function AcessoNegado() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow flex flex-col items-center">
        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
        </svg>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
        <p className="text-gray-700 mb-4">Você não tem permissão para acessar esta página ou realizar esta ação.</p>
        <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Voltar para o início</Link>
      </div>
    </div>
  );
} 