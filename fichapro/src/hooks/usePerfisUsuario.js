import { useEffect, useState } from 'react';

export default function usePerfisUsuario() {
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setPerfis([]);
      setLoading(false);
      return;
    }

    const headers = { Authorization: 'Bearer ' + token };

    // Primeiro, verificar se o usuário é admin global
    fetch('/api/me/', { headers })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(user => {
        // Se for admin global, adicionar perfil de administrador
        if (user.is_staff || user.is_superuser) {
          const adminPerfil = { perfil: 'administrador', restaurante: null };
          
          // Agora buscar os perfis específicos dos restaurantes
          return fetch('/api/meus-perfis/', { headers })
            .then(res => {
              if (!res.ok) {
                if (res.status === 401) {
                  localStorage.removeItem('token');
                  throw new Error('Token inválido');
                }
                throw new Error(`Erro ${res.status}: ${res.statusText}`);
              }
              return res.json();
            })
            .then(data => {
              // Combinar perfil admin com perfis específicos
              const perfisCombinados = [adminPerfil];
              if (Array.isArray(data)) {
                perfisCombinados.push(...data);
              }
              setPerfis(perfisCombinados);
              setLoading(false);
            });
        } else {
          // Se não for admin, buscar apenas perfis específicos
          return fetch('/api/meus-perfis/', { headers })
            .then(res => {
              if (!res.ok) {
                if (res.status === 401) {
                  localStorage.removeItem('token');
                  throw new Error('Token inválido');
                }
                throw new Error(`Erro ${res.status}: ${res.statusText}`);
              }
              return res.json();
            })
            .then(data => {
              setPerfis(Array.isArray(data) ? data : []);
              setLoading(false);
            });
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar perfis:', error);
        setPerfis([]);
        setErro(error.message);
        setLoading(false);
      });
  }, []);

  return { perfis, loading, erro };
} 