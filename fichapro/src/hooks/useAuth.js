import { useState, useEffect } from 'react';

export default function useAuth() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    function checarToken() {
      setAutenticado(!!localStorage.getItem('token'));
    }
    window.addEventListener('storage', checarToken);
    return () => window.removeEventListener('storage', checarToken);
  }, []);

  return { autenticado };
} 