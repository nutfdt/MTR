
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import type { SearchType } from '../types';
import '../styles/Header.css';
import type { SearchMode } from '../Api/config';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { performSearch } = useSearch();
  const [localQuery, setLocalQuery] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('simple');
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  const [searchScope, setSearchScope] = useState<'all' | 'title' | 'author'>('all');

  const detectSearchType = (query: string): SearchType => {
    const regexPatterns = [
      /\[.*\]/,           // [Ww]hale
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

    // Détection automatique
    let finalType = searchType;
    if (searchType === 'simple') {
      const detectedType = detectSearchType(localQuery);
      if (detectedType === 'regex') {
        finalType = 'regex';
        setSearchType('regex');
      }
    }
    navigate('/search');
    performSearch(localQuery.trim(), finalType, searchMode, searchScope);
    setShowOptions(false);
  };

  const handleLogoClick = () => {
    navigate('/');
  };


  return (
    <header className="search-header">
      <div className="header-content">
        <div className="logo-section" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <div className="logo-small">📚</div>
          <span className="logo-title">BiblioSearch</span>
        </div>

        {/* Barre de recherche */}
        <form className="search-form-header" onSubmit={handleSearch}>
          <div className="search-box-header">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            
            <input
              type="text"
              className="search-input-header"
              placeholder={
                searchScope === 'title' ? "Chercher dans les titres..." :
                searchScope === 'author' ? "Chercher par auteur..." :
                searchType === 'regex' ? "Regex (ex: [Ww]hale, whale.*)" :
                "Rechercher livre, auteur, mot-clé..."
              }
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />

            {/* Options rapides */}

            <button type="submit" className="search-submit-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 10h10M13 14l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Dropdown options */}
          {showOptions && (
            <div className="search-options-dropdown">
              <label className="option-item">
                <input
                  type="checkbox"
                  checked={searchMode === 'highlight'}
                  onChange={(e) => setSearchMode(e.target.checked ? 'highlight' : 'simple')}
                />
                <span>Surligner les résultats</span>
              </label>
              
              <div className="option-help">
                {searchType === 'regex' && (
                  <>
                    <p><strong>Exemples Regex :</strong></p>
                    <code>[Ww]hale</code> - Whale ou whale<br/>
                    <code>whale.*</code> - Commence par whale<br/>
                    <code>(whale|sea)</code> - whale OU sea
                  </>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Actions */}
        <div className="header-actions">
          
          <button className="connect-btn" onClick={() => navigate('/login')}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 16c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Connexion</span>
          </button>
        </div>
      </div>

      {/* Active filters badges */}
      {(searchScope !== 'all' || searchType === 'regex' || searchMode === 'highlight') && (
        <div className="active-filters">
          {searchScope === 'title' && <span className="filter-badge">📄 Titres</span>}
          {searchScope === 'author' && <span className="filter-badge">👤 Auteurs</span>}
          {searchType === 'regex' && <span className="filter-badge">🔧 Regex</span>}
          {searchMode === 'highlight' && <span className="filter-badge">✨ Surlignage</span>}
        </div>
      )}
    </header>
  );
};

export default Header;