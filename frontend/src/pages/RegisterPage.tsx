// src/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/RegisterPage.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    // Simulation d'inscription (remplacer par appel API)
    console.log('Register:', formData);
    
    // Simulation réussie
    setTimeout(() => {
      navigate('/login');
    }, 500);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-left">
          <div className="register-branding">
            <div className="brand-logo">ASE</div>
            <h1>Rejoignez-nous</h1>
            <p>Créez votre compte et accédez à notre bibliothèque complète</p>
          </div>
          
          <div className="register-benefits">
            <h3>Ce que vous obtenez :</h3>
            <ul>
              <li>
                <span className="check-icon">✓</span>
                Accès à plus de 1,664 livres académiques
              </li>
              <li>
                <span className="check-icon">✓</span>
                Recherche avancée avec RegEx
              </li>
              <li>
                <span className="check-icon">✓</span>
                Suggestions personnalisées
              </li>
              <li>
                <span className="check-icon">✓</span>
                Sauvegarde de vos favoris
              </li>
              <li>
                <span className="check-icon">✓</span>
                Historique de recherche
              </li>
            </ul>
          </div>
        </div>

        <div className="register-right">
          <div className="register-card">
            <div className="register-header">
              <h2>Créer un compte</h2>
              <p>Remplissez le formulaire ci-dessous</p>
            </div>

            {error && (
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Prénom</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Nom</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre.email@exemple.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Au moins 8 caractères"
                  className="form-input"
                />
                <small className="input-hint">
                  Utilisez au moins 8 caractères avec des lettres et des chiffres
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Retapez votre mot de passe"
                  className="form-input"
                />
              </div>

              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span>
                  J'accepte les <Link to="/terms">conditions d'utilisation</Link> et la{' '}
                  <Link to="/privacy">politique de confidentialité</Link>
                </span>
              </label>

              <button type="submit" className="submit-btn">
                Créer mon compte
              </button>

              <div className="divider">
                <span>ou</span>
              </div>

              <button type="button" className="google-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18 10c0-4.4-3.6-8-8-8s-8 3.6-8 8c0 4 2.9 7.3 6.7 7.9v-5.6H6.9V10h1.8V8.3c0-1.8 1.1-2.8 2.7-2.8.8 0 1.6.1 1.6.1v1.8h-.9c-.9 0-1.2.6-1.2 1.1V10h2l-.3 2.3h-1.7v5.6c3.8-.6 6.7-3.9 6.7-7.9z" fill="#4285F4"/>
                </svg>
                S'inscrire avec Google
              </button>
            </form>

            <div className="login-link">
              Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
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

export default RegisterPage;