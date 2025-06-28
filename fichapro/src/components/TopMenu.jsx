import { useEffect, useState } from "react";

export default function TopMenu() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/me/', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => setUsuario(data));
  }, []);

  return (
    <header className="w-full h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 shadow-sm z-50">
      {usuario ? (
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-700 text-base">Olá, {usuario.first_name || usuario.username}</span>
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 uppercase">
            {usuario.first_name ? usuario.first_name[0] : usuario.username[0]}
          </div>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">Usuário</span>
      )}
    </header>
  );
} 