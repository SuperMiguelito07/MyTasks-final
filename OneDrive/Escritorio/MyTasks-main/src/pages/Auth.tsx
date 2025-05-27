import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const { user, loading, error, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Si el usuario ya está autenticado, redirigir a la página principal
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validación básica
    if (!email || !password) {
      setFormError('Si us plau, omple tots els camps obligatoris');
      return;
    }

    if (!isLogin && !nom) {
      setFormError('Si us plau, introdueix el teu nom');
      return;
    }

    try {
      if (isLogin) {
        // Iniciar sesión
        const { success, error } = await signIn(email, password);
        if (!success && error) {
          setFormError(`Error al iniciar sessió: ${error.message || 'Comprova les teves credencials'}`);
        }
      } else {
        // Registrarse
        const { success, error } = await signUp(email, password, nom);
        if (!success && error) {
          setFormError(`Error al registrar-se: ${error.message || 'Comprova les dades introduïdes'}`);
        }
      }
    } catch (err: any) {
      setFormError(`Error inesperat: ${err.message || 'Intenta-ho de nou més tard'}`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>MyTask</h1>
        <h2>Gestor de Projectes i Tasques</h2>
        
        <h3>{isLogin ? 'Iniciar Sessió' : 'Registrar-se'}</h3>
        
        {(error || formError) && (
          <div className="error-message">
            {error || formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="El teu nom"
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Correu electrònic</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@correu.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contrasenya</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La teva contrasenya"
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Carregant...' : isLogin ? 'Iniciar Sessió' : 'Registrar-se'}
          </button>
        </form>
        
        <div className="auth-toggle">
          <p>
            {isLogin ? 'No tens compte?' : 'Ja tens compte?'}{' '}
            <button 
              className="link-button" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Registra\'t' : 'Inicia sessió'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
