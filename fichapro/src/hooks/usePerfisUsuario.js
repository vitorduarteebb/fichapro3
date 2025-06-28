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

    fetch('/api/meus-perfis/', { headers })
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