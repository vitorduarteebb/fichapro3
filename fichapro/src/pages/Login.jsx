import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    fetch("/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.access) {
          localStorage.setItem("token", data.access);
          localStorage.setItem("refresh", data.refresh);
          setMsg("");
          navigate("/");
        } else {
          setMsg("Usuário ou senha inválidos.");
        }
      })
      .catch(() => setMsg("Erro ao tentar logar."))
      .finally(() => setLoading(false));
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 animate-gradient-x">
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 6s ease-in-out infinite;
        }
      `}</style>
      <form onSubmit={handleSubmit} className="bg-white/90 p-8 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-5 relative">
        <div className="flex flex-col items-center mb-2">
          <svg className="w-16 h-16 text-purple-600 mb-2 drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M4 17h16M7 13h10M9 9h6M12 5h0" />
          </svg>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">FichaPro</h1>
          <span className="text-sm text-gray-500">Gestão Moderna para Restaurantes</span>
        </div>
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition placeholder-gray-400"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition placeholder-gray-400"
          required
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:from-purple-700 hover:to-blue-700 transition flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          )}
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {msg && <div className="text-center text-red-600 text-sm bg-red-100 rounded px-2 py-1 animate-pulse shadow">{msg}</div>}
      </form>
    </div>
  );
} 