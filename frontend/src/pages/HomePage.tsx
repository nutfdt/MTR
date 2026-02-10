// src/pages/HomePage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate('/search');
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="logo-container">
          <div className="logo">ASE</div>
          <div className="logo-text">
            <h1>Academic Search Engine</h1>
            <p>Moteur de recherche intelligent</p>
          </div>
        </div>
      </header>

      <main className="home-main">
        <div className="hero-section">
          <div className="hero-badge">
            <span className="badge-icon">📚</span>
            <span>Plus de 1,664 livres disponibles</span>
          </div>
          
          <h1 className="hero-title">
            Explorez notre bibliothèque
            <br />
            <span className="hero-highlight">académique</span>
          </h1>
          
          <p className="hero-description">
            Moteur de recherche intelligent avec algorithmes de centralité avancés,
            suggestions personnalisées et recherche RegEx pour des résultats précis
          </p>

          <button className="explore-btn" onClick={handleExplore}>
            <span>Explorer la bibliothèque</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Recherche simple</h3>
              <p>Trouvez instantanément des livres par mot-clé</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Recherche RegEx</h3>
              <p>Expressions régulières pour recherches complexes</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Algorithmes de centralité</h3>
              <p>PageRank, Closeness, Betweenness</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h3>Suggestions intelligentes</h3>
              <p>Recommandations basées sur le graphe de Jaccard</p>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <div className="stat-number">1,664+</div>
            <div className="stat-label">Livres indexés</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">16M+</div>
            <div className="stat-label">Mots analysés</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10k+</div>
            <div className="stat-label">Mots par livre (min.)</div>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>© 2026 Academic Search Engine - Projet de moteur de recherche de bibliothèque</p>
      </footer>
    </div>
  );
};

export default HomePage;