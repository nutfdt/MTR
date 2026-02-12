// src/components/SearchBar.tsx - SearchBar Intelligente Complète

import React, { useState } from 'react';
import { useSearch } from '../context/SearchContext';
import type { SearchType } from '../types';
import '../styles/SearchBar.css';
import type { SearchMode } from '../Api/config';

const SearchBar: React.FC = () => {
  const { performSearch, searchQuery, setSearchQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [searchType, setSearchType] = useState<SearchType>('simple');
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  const [searchScope, setSearchScope] = useState<'all' | 'title' | 'author'>('all');
  const [showModeSelector, setShowModeSelector] = useState(false);

  // 🔍 Détection intelligente du type de recherche
  const detectSearchType = (query: string): SearchType => {
    // Patterns regex communs
    const regexPatterns = [
      /\[.*\]/,           // [Ww]hale, [a-z]
      /\(.*\|.*\)/,       // (whale|sea)
      /\.\*/,             // whale.*
      /\.\+/,             // whale.+
      /\^/,               // ^start
      /\$/,               // end$
      /\\/,               // \w, \d
    ];

    for (const pattern of regexPatterns) {
      if (pattern.test(query)) {
        return 'regex';
      }
    }

    return 'simple';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localQuery.trim()) return;

    // Détection automatique si nécessaire
    let finalType = searchType;
    if (searchType === 'simple') {
      const detectedType = detectSearchType(localQuery);
      if (detectedType === 'regex') {
        console.log('🔧 Regex pattern détecté automatiquement !');
        finalType = 'regex';
        setSearchType('regex'); // Mettre à jour l'UI
      }
    }

    // Construire la requête selon le scope
    let finalQuery = localQuery.trim();
    
    // Note: Le scope est géré côté frontend pour l'instant
    // On pourrait l'envoyer au backend si nécessaire
    
    performSearch(finalQuery, finalType, searchMode);
  };

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
    setShowModeSelector(false);
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setShowModeSelector(false);
  };

  const handleScopeChange = (scope: 'all' | 'title' | 'author') => {
    setSearchScope(scope);
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="search-bar-form">
        {/* Input de recherche */}
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM18 18l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={
              searchType === 'regex' 
                ? "Regex (ex: [Ww]hale, whale.*, (whale|sea))" 
                : searchScope === 'title'
                ? "Rechercher dans les titres..."
                : searchScope === 'author'
                ? "Rechercher un auteur..."
                : "Rechercher un livre, auteur, mot-clé..."
            }
            className="search-input"
          />

          {localQuery && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setLocalQuery('');
                setSearchQuery('');
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Scope Selector (Tout / Titre / Auteur) */}
        <div className="search-scope-selector">
          <button
            type="button"
            className={`scope-btn ${searchScope === 'all' ? 'active' : ''}`}
            onClick={() => handleScopeChange('all')}
            title="Rechercher partout"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2h12v12H2z" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 6h4M6 10h4" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Tout</span>
          </button>

          <button
            type="button"
            className={`scope-btn ${searchScope === 'title' ? 'active' : ''}`}
            onClick={() => handleScopeChange('title')}
            title="Rechercher dans les titres"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3h10M3 8h10M3 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Titre</span>
          </button>

          <button
            type="button"
            className={`scope-btn ${searchScope === 'author' ? 'active' : ''}`}
            onClick={() => handleScopeChange('author')}
            title="Rechercher par auteur"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Auteur</span>
          </button>
        </div>

        {/* Sélecteur de mode */}
        <div className="search-mode-selector">
          <button
            type="button"
            className="mode-toggle-btn"
            onClick={() => setShowModeSelector(!showModeSelector)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>
              {searchType === 'regex' ? 'Regex' : 'Simple'}
              {searchMode === 'highlight' && ' + Surlignage'}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {showModeSelector && (
            <div className="mode-dropdown">
              <div className="mode-section">
                <h4>Type de recherche</h4>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="searchType"
                    checked={searchType === 'simple'}
                    onChange={() => handleTypeChange('simple')}
                  />
                  <div className="mode-info">
                    <span className="mode-name">Recherche Simple</span>
                    <span className="mode-desc">Recherche par mot-clé exact</span>
                  </div>
                </label>
                
                <label className="mode-option">
                  <input
                    type="radio"
                    name="searchType"
                    checked={searchType === 'regex'}
                    onChange={() => handleTypeChange('regex')}
                  />
                  <div className="mode-info">
                    <span className="mode-name">Recherche Regex</span>
                    <span className="mode-desc">Expressions régulières avancées</span>
                  </div>
                </label>
              </div>

              <div className="mode-section">
                <h4>Options d'affichage</h4>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="searchMode"
                    checked={searchMode === 'simple'}
                    onChange={() => handleModeChange('simple')}
                  />
                  <div className="mode-info">
                    <span className="mode-name">Normal</span>
                    <span className="mode-desc">Affichage standard</span>
                  </div>
                </label>
                
                <label className="mode-option">
                  <input
                    type="radio"
                    name="searchMode"
                    checked={searchMode === 'highlight'}
                    onChange={() => handleModeChange('highlight')}
                  />
                  <div className="mode-info">
                    <span className="mode-name">Avec Surlignage</span>
                    <span className="mode-desc">Mots recherchés en surbrillance</span>
                  </div>
                </label>
              </div>

              {searchType === 'regex' && (
                <div className="mode-help">
                  <h5>Exemples Regex :</h5>
                  <code>[Ww]hale</code> - Whale ou whale<br/>
                  <code>whale.*</code> - Commence par whale<br/>
                  <code>(whale|sea)</code> - whale OU sea<br/>
                  <code>^The</code> - Commence par "The"<br/>
                  <code>end$</code> - Finit par "end"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bouton rechercher */}
        <button type="submit" className="search-submit-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM18 18l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Rechercher</span>
        </button>
      </form>

      {/* Info badges */}
      <div className="search-badges">
        {searchScope !== 'all' && (
          <span className="search-badge scope">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {searchScope === 'title' ? 'Titres uniquement' : 'Auteurs uniquement'}
          </span>
        )}
        
        {searchType === 'regex' && (
          <span className="search-badge regex">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Regex activé
          </span>
        )}
        
        {searchMode === 'highlight' && (
          <span className="search-badge highlight">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Surlignage activé
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchBar;