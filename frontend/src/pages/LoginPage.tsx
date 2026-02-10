// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Loginpage.css'

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation simple
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Simulation de connexion (remplacer par appel API)
    console.log('Login:', { email, password, rememberMe });
    
    // Simulation réussie - redirection
    setTimeout(() => {
      navigate('/search');
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-branding">
            <div className="brand-logo">ASE</div>
            <h1>Academic Search Engine</h1>
            <p>Accédez à plus de 1,664 livres académiques</p>
          </div>
          
          <div className="login-features">
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <span>Bibliothèque complète</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <span>Recherche avancée</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💡</span>
              <span>Suggestions intelligentes</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <span>Favoris personnalisés</span>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Connexion</h2>
              <p>Bienvenue ! Connectez-vous à votre compte</p>
            </div>

            {error && (
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Se souvenir de moi</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button type="submit" className="submit-btn">
                Se connecter
              </button>

              <div className="divider">
                <span>ou</span>
              </div>

              <button type="button" className="google-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18 10c0-4.4-3.6-8-8-8s-8 3.6-8 8c0 4 2.9 7.3 6.7 7.9v-5.6H6.9V10h1.8V8.3c0-1.8 1.1-2.8 2.7-2.8.8 0 1.6.1 1.6.1v1.8h-.9c-.9 0-1.2.6-1.2 1.1V10h2l-.3 2.3h-1.7v5.6c3.8-.6 6.7-3.9 6.7-7.9z" fill="#4285F4"/>
                </svg>
                Continuer avec Google
              </button>
            </form>

            <div className="signup-link">
              Pas encore de compte ? <Link to="/register">S'inscrire</Link>
            </div>
          </div>

          <button className="back-home-btn" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 10H5M8 6l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;