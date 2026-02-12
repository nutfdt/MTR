// src/pages/AdvancedSearchPage.tsx - Page recherche avancée + Favoris

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import type { SearchType } from '../types';
import '../styles/AdvancedSearchPage.css'
import type { SearchMode } from '../Api/config';

interface Favorite {
  id: number;
  title: string;
  author: string;
  cover: string;
  addedAt: string;
}

const AdvancedSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { performSearch } = useSearch();
  
  // États de recherche avancée
  const [query, setQuery] = useState('');
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('simple');
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  const [caseSensitive, setCaseSensitive] = useState(false);
  
  // Favoris
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    // Charger les favoris depuis localStorage
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('bibliosearch_favorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(parsed);
      }
    } catch (err) {
    }
  };

  const removeFavorite = (id: number) => {
    try {
      const updated = favorites.filter(fav => fav.id !== id);
      setFavorites(updated);
      localStorage.setItem('bibliosearch_favorites', JSON.stringify(updated));
    } catch (err) {
      console.error('❌ Erreur suppression favori:', err);
    }
  };

  const clearAllFavorites = () => {
    if (window.confirm('Supprimer tous les favoris ?')) {
      setFavorites([]);
      localStorage.removeItem('bibliosearch_favorites');
    }
  };

  const handleAdvancedSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Construire la requête
    let finalQuery = query.trim();
    
    if (title.trim()) {
      finalQuery = title.trim();
    } else if (author.trim()) {
      finalQuery = author.trim();
    }

    if (!finalQuery) {
      alert('Veuillez entrer au moins un critère de recherche');
      return;
    }

    navigate('/search');
    
    const scope = title.trim() ? 'title' : author.trim() ? 'author' : 'all';
    performSearch(finalQuery, searchType, searchMode, scope);
  };

  return (
    <div className="advanced-search-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 16l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Retour</span>
        </button>
        <h1>Recherche Avancée</h1>
      </div>

      <div className="advanced-content">
        <div className="search-panel">
          <h2>🔍 Critères de Recherche</h2>
          
          <form onSubmit={handleAdvancedSearch} className="advanced-form">
            <div className="form-group">
              <label>Recherche générale</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mot-clé, sujet, concept..."
                className="form-input"
              />
            </div>

            {/* Titre */}
            <div className="form-group">
              <label>Titre du livre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Frankenstein, Moby Dick..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Auteur</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Mary Shelley, Herman Melville..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Année de publication</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ex: 1818, 1851..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Type de recherche</label>
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    checked={searchType === 'simple'}
                    onChange={() => setSearchType('simple')}
                  />
                  <span>Simple (mot-clé exact)</span>
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    checked={searchType === 'regex'}
                    onChange={() => setSearchType('regex')}
                  />
                  <span>Regex (expressions régulières)</span>
                </label>
              </div>
            </div>

            {/* Options */}
            <div className="form-group">
              <label>Options</label>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                  />
                  <span>Sensible à la casse</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={searchMode === 'highlight'}
                    onChange={(e) => setSearchMode(e.target.checked ? 'highlight' : 'simple')}
                  />
                  <span>Surligner les résultats</span>
                </label>
              </div>
            </div>

            {/* Boutons */}
            <div className="form-actions">
              <button type="button" className="reset-btn" onClick={() => {
                setQuery('');
                setTitle('');
                setAuthor('');
                setYear('');
                setSearchType('simple');
                setSearchMode('simple');
                setCaseSensitive(false);
              }}>
                Réinitialiser
              </button>
              <button type="submit" className="search-btn">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M8 16A7 7 0 108 2a7 7 0 000 14zM17 17l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Rechercher
              </button>
            </div>
          </form>

          {/* Aide regex */}
          {searchType === 'regex' && (
            <div className="regex-help">
              <h3>Aide Regex</h3>
              <ul>
                <li><code>[Ww]hale</code> - Whale ou whale</li>
                <li><code>whale.*</code> - Commence par "whale"</li>
                <li><code>(whale|sea)</code> - "whale" OU "sea"</li>
                <li><code>^The</code> - Commence par "The"</li>
                <li><code>end$</code> - Finit par "end"</li>
              </ul>
            </div>
          )}
        </div>

        {/* Panel des favoris */}
        <div className="favorites-panel">
          <div className="panel-header">
            <h2>⭐ Mes Favoris ({favorites.length})</h2>
            {favorites.length > 0 && (
              <button className="clear-all-btn" onClick={clearAllFavorites}>
                Tout supprimer
              </button>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="empty-favorites">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path d="M40 15l8 16 18 3-13 13 3 18-16-9-16 9 3-18-13-13 18-3z" stroke="#e0e6ed" strokeWidth="3" fill="none"/>
              </svg>
              <p>Aucun favori pour le moment</p>
              <span>Ajoutez des livres depuis les résultats de recherche</span>
            </div>
          ) : (
            <div className="favorites-grid">
              {favorites.map(fav => (
                <div key={fav.id} className="favorite-card">
                  <button
                    className="remove-fav-btn"
                    onClick={() => removeFavorite(fav.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>

                  <div
                    className="fav-cover"
                    style={{
                      backgroundImage: fav.cover.startsWith('http') ? `url(${fav.cover})` : 'none',
                      backgroundColor: fav.cover.startsWith('http') ? 'transparent' : '#1976d2'
                    }}
                    onClick={() => navigate(`/book/preview/${fav.id}`)}
                  >
                    {!fav.cover.startsWith('http') && <span className="fav-icon">{fav.cover}</span>}
                  </div>

                  <div className="fav-info" onClick={() => navigate(`/book/preview/${fav.id}`)}>
                    <h4>{fav.title.substring(0, 50)}{fav.title.length > 50 ? '...' : ''}</h4>
                    <p>{fav.author}</p>
                    <span className="fav-date">{new Date(fav.addedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchPage;