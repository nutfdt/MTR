// src/components/ResultCard.tsx - Carte de résultat avec surlignage

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import type { Book } from '../types';
import '../styles/ResultCard.css';

interface ResultCardProps {
  result: Book;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const navigate = useNavigate();
  const { highlightedResults } = useSearch();

  const handlePreview = () => {
    navigate(`/book/preview/${result.id}`);
  };

  const handleRead = () => {
    navigate(`/book/read/${result.id}`);
  };

  // Récupérer le texte surligné s'il existe
  const highlightedText = highlightedResults.get(result.id);

  return (
    <div className="result-card">
      <div className="result-card-header">
        {/* Cover ou icône */}
        <div className="book-cover-mini" style={{ backgroundColor: result.color }}>
          {typeof result.icon === 'string' && result.icon.startsWith('http') ? (
            <img src={result.icon} alt={result.title} />
          ) : (
            <span>{result.icon}</span>
          )}
        </div>

        {/* Info livre */}
        <div className="book-info-mini">
          <h3 className="book-title-result">{result.title}</h3>
          <p className="book-author-result">par {result.author}</p>
        </div>

        {/* Badges */}
        <div className="result-badges">
          <span className="badge relevance" title="Pertinence">
            {result.relevance}%
          </span>
          {result.occurrences > 0 && (
            <span className="badge occurrences" title="Occurrences">
              {result.occurrences}×
            </span>
          )}
        </div>
      </div>

      {/* Excerpt ou texte surligné */}
      <div className="result-card-body">
        {highlightedText ? (
          <div 
            className="highlighted-excerpt"
            dangerouslySetInnerHTML={{ __html: highlightedText.substring(0, 500) + '...' }}
          />
        ) : (
          <p className="book-excerpt">{result.excerpt}</p>
        )}
      </div>

      {/* Actions */}
      <div className="result-card-footer">
        <button className="preview-btn" onClick={handlePreview}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3.5A6.5 6.5 0 002.5 9a6.5 6.5 0 006.5 6.5A6.5 6.5 0 0015.5 9 6.5 6.5 0 009 3.5z" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="9" cy="9" r="2" fill="currentColor"/>
          </svg>
          Aperçu
        </button>

        <button className="read-btn" onClick={handleRead}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 15.5A1.5 1.5 0 014.5 14h12M3 15.5A1.5 1.5 0 014.5 17h12V2H4.5A1.5 1.5 0 003 3.5v12z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Lire
        </button>
      </div>
    </div>
  );
};

export default ResultCard;