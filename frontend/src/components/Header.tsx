// src/components/Header.tsx - UPDATED

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onSearch, onLogoClick }) => {
  const navigate = useNavigate();

  return (
    <header className="search-header">
      <div className="header-content">
        <div className="logo-section" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
          <div className="logo-small">ASE</div>
          <span className="logo-title">Academic Search Engine</span>
        </div>

        <form className="search-form" onSubmit={onSearch}>
          <div className="search-box-header">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="search-input-header"
              placeholder="Recherche avancée"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button type="submit" className="search-submit-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 10h10M13 14l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>

        <div className="header-actions">
          <button className="advanced-search-btn">Recherche avancée</button>
          <button className="connect-btn" onClick={() => navigate('/login')}>
            Se connecter
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;