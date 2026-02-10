// src/components/Filters.tsx - UPDATED avec recherche fonctionnelle

import React, { useState } from 'react';
import '../styles/Filters.css';
import { useSearch } from '../context/SearchContext';

const Filters: React.FC = () => {
  const { filters, updateFilters, searchQuery, performSearch, searchType } = useSearch();
  const [showOccurrences, setShowOccurrences] = useState(false);
  const [showSortBy, setShowSortBy] = useState(false);
  const [localKeyword, setLocalKeyword] = useState('');
  const [localRegex, setLocalRegex] = useState('');

  const handleCheckboxChange = (field: string, value: boolean) => {
    updateFilters({ [field]: value });
    // Redéclencher la recherche avec les nouveaux filtres
    if (searchQuery) {
      setTimeout(() => {
        performSearch(searchQuery, searchType);
      }, 100);
    }
  };

  const handleSliderChange = (field: string, value: number) => {
    updateFilters({ [field]: value });
    // Redéclencher la recherche avec les nouveaux filtres
    if (searchQuery) {
      setTimeout(() => {
        performSearch(searchQuery, searchType);
      }, 100);
    }
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy });
    // Redéclencher la recherche avec le nouveau tri
    if (searchQuery) {
      setTimeout(() => {
        performSearch(searchQuery, searchType);
      }, 100);
    }
  };

  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localKeyword.trim()) {
      performSearch(localKeyword, 'simple');
    }
  };

  const handleRegexSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localRegex.trim()) {
      performSearch(localRegex, 'regex');
    }
  };

  return (
    <div className="filters-container">
      <h2 className="filters-title">Filtres</h2>

      {/* Mot-clé */}
      <div className="filter-section">
        <label className="filter-label">Mot-clé</label>
        <form onSubmit={handleKeywordSearch}>
          <input 
            type="text" 
            className="filter-input" 
            placeholder="Entrez un mot..."
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleKeywordSearch(e);
              }
            }}
          />
        </form>
      </div>

      {/* Recherche RegEx */}
      <div className="filter-section">
        <label className="filter-label">Recherche RegEx</label>
        <form onSubmit={handleRegexSearch}>
          <input 
            type="text" 
            className="filter-input filter-regex" 
            placeholder="Ex: [Vv]oyage"
            value={localRegex}
            onChange={(e) => setLocalRegex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRegexSearch(e);
              }
            }}
          />
        </form>
        
        <div className="filter-checkbox">
          <input 
            type="checkbox" 
            id="caseSensitive"
            checked={filters.caseSensitive}
            onChange={(e) => handleCheckboxChange('caseSensitive', e.target.checked)}
          />
          <label htmlFor="caseSensitive">Sensible à la casse</label>
        </div>
        
        <div className="filter-checkbox">
          <input 
            type="checkbox" 
            id="exactMatch"
            checked={filters.exactMatch}
            onChange={(e) => handleCheckboxChange('exactMatch', e.target.checked)}
          />
          <label htmlFor="exactMatch">Correspondance exacte</label>
        </div>
      </div>

      {/* Pertinence */}
      <div className="filter-section">
        <div className="filter-label-with-icon">
          <label className="filter-label">Pertinence (min: {filters.relevanceMin}%)</label>
          <span className="info-icon">ⓘ</span>
        </div>
        <div className="slider-labels">
          <span>Faible</span>
          <span>Élevée</span>
        </div>
        <input 
          type="range" 
          className="filter-slider"
          min="0"
          max="100"
          value={filters.relevanceMin}
          onChange={(e) => handleSliderChange('relevanceMin', parseInt(e.target.value))}
        />
      </div>

      {/* Occurrences */}
      <div className="filter-section">
        <div 
          className="filter-dropdown-header"
          onClick={() => setShowOccurrences(!showOccurrences)}
        >
          <label className="filter-label">Occurrences (min: {filters.occurrencesMin})</label>
          <svg 
            className={`dropdown-icon ${showOccurrences ? 'open' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {showOccurrences && (
          <div className="slider-container">
            <input 
              type="range" 
              className="filter-slider"
              min="0"
              max="50"
              value={filters.occurrencesMin}
              onChange={(e) => handleSliderChange('occurrencesMin', parseInt(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Trier par */}
      <div className="filter-section">
        <div 
          className="filter-dropdown-header"
          onClick={() => setShowSortBy(!showSortBy)}
        >
          <label className="filter-label">Trier par:</label>
          <svg 
            className={`dropdown-icon ${showSortBy ? 'open' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {showSortBy && (
          <select 
            className="filter-select"
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="popularity">Popularité</option>
            <option value="relevance">Pertinence</option>
            <option value="recent">Plus récent</option>
            <option value="occurrences">Occurrences</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default Filters;