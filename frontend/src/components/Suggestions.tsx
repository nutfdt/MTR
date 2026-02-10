// src/components/Suggestions.tsx - UPDATED avec données API

import React from 'react';
import '../styles/Suggestions.css';
import { useSearch } from '../context/SearchContext';

const Suggestions: React.FC = () => {
  const { suggestions, performSearch } = useSearch();

  const renderStars = (rating: number) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleSearchClick = (query: string) => {
    performSearch(query, 'simple');
  };

  return (
    <div className="suggestions-container">
      <h2 className="suggestions-title">Suggestions</h2>

      {/* Livres similaires - Données de l'API */}
      {suggestions.similar && suggestions.similar.length > 0 && (
        <div className="suggestion-section">
          <h3 className="section-title">Livres populaires</h3>
          <div className="suggestion-list">
            {suggestions.similar.map(book => (
              <div key={book.id} className="suggestion-item book-item">
                <div className="book-cover">
                  {typeof book.image === 'string' && book.image.startsWith('http') ? (
                    <img src={book.image} alt={book.title} />
                  ) : (
                    <span>{book.image}</span>
                  )}
                </div>
                <div className="book-info">
                  <p className="book-title">{book.title}</p>
                  {renderStars(book.rating)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recherches populaires - Données de l'API */}
      {suggestions.popular && suggestions.popular.length > 0 && (
        <div className="suggestion-section">
          <h3 className="section-title">Recherches populaires</h3>
          <div className="suggestion-list">
            {suggestions.popular.map(search => (
              <div 
                key={search.id} 
                className="suggestion-item search-item clickable"
                onClick={() => handleSearchClick(search.query)}
              >
                <span className="search-icon">🔍</span>
                <span className="search-query">{search.query}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connexion Jaccard - Visualisation */}
      <div className="suggestion-section">
        <h3 className="section-title">Connexion Jaccard</h3>
        <div className="jaccard-graph">
          <svg width="100%" height="150" viewBox="0 0 200 150">
            {/* Nodes */}
            <circle cx="50" cy="75" r="20" fill="#42a5f5" opacity="0.8" />
            <circle cx="100" cy="30" r="25" fill="#1976d2" opacity="0.9" />
            <circle cx="100" cy="120" r="20" fill="#42a5f5" opacity="0.8" />
            <circle cx="150" cy="75" r="20" fill="#42a5f5" opacity="0.8" />
            
            {/* Edges */}
            <line x1="50" y1="75" x2="100" y2="30" stroke="#90caf9" strokeWidth="2" opacity="0.6" />
            <line x1="50" y1="75" x2="100" y2="120" stroke="#90caf9" strokeWidth="2" opacity="0.6" />
            <line x1="100" y1="30" x2="150" y2="75" stroke="#90caf9" strokeWidth="2" opacity="0.6" />
            <line x1="100" y1="120" x2="150" y2="75" stroke="#90caf9" strokeWidth="2" opacity="0.6" />
            <line x1="100" y1="30" x2="100" y2="120" stroke="#90caf9" strokeWidth="3" opacity="0.8" />
          </svg>
          <p className="jaccard-description">
            Visualisation des similarités entre livres basée sur l'indice de Jaccard
          </p>
        </div>
      </div>

      {/* Top recommandés - Données de l'API */}
      {suggestions.recommended && suggestions.recommended.length > 0 && (
        <div className="suggestion-section">
          <h3 className="section-title">Top recommandés</h3>
          <div className="suggestion-list">
            {suggestions.recommended.map(book => (
              <div key={book.id} className="suggestion-item book-item">
                <div className="book-cover">
                  {typeof book.image === 'string' && book.image.startsWith('http') ? (
                    <img src={book.image} alt={book.title} />
                  ) : (
                    <span>{book.image}</span>
                  )}
                </div>
                <div className="book-info">
                  <p className="book-title">{book.title}</p>
                  {renderStars(book.rating)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune suggestion */}
      {(!suggestions.similar || suggestions.similar.length === 0) &&
       (!suggestions.popular || suggestions.popular.length === 0) &&
       (!suggestions.recommended || suggestions.recommended.length === 0) && (
        <div className="no-suggestions">
          <p>Chargement des suggestions...</p>
        </div>
      )}
    </div>
  );
};

export default Suggestions;