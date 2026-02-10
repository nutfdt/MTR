// src/components/ResultCard.tsx - UPDATED

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ResultCard.css';
import type { Book } from '../types';

interface ResultCardProps {
  result: Book;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handlePreview = () => {
    navigate(`/book/preview/${result.id}`);
  };

  const handleOpen = () => {
    navigate(`/book/read/${result.id}`);
  };

  return (
    <div className="result-card">
      <div className="result-header">
       <div className="result-icon" style={{ backgroundColor: result.color }}>
  <img
    src={result.icon}
    alt={result.title}
    className="result-image"
  />
</div>

        <div className="result-info">
          <h3 className="result-title" onClick={handlePreview} style={{ cursor: 'pointer' }}>
            {result.title}
          </h3>
          <p className="result-author">{result.author}</p>
        </div>
        <div className="result-relevance">
          <span className="relevance-badge" style={{ 
            backgroundColor: result.relevance >= 80 ? '#4caf50' : '#ff9800' 
          }}>
            {result.relevance}% Pertinent
          </span>
        </div>
      </div>

      <div className="result-body">
        <p className="result-occurrences">
          {result.occurrences} occurrence{result.occurrences > 1 ? 's' : ''} trouvée{result.occurrences > 1 ? 's' : ''}
        </p>
        <p className="result-excerpt">{result.excerpt}</p>
      </div>

      <div className="result-actions">
        <button className="action-btn preview-btn" onClick={handlePreview}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Aperçu
        </button>
        <button className="action-btn open-btn" onClick={handleOpen}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M14 8H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Ouvrir
        </button>
        <button 
          className={`action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={toggleFavorite}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={isFavorite ? '#e53935' : 'none'}>
            <path d="M8 13.5l-5.5-5.5c-1.5-1.5-1.5-4 0-5.5s4-1.5 5.5 0 4-1.5 5.5 0 1.5 4 0 5.5L8 13.5z" 
              stroke="#e53935" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ResultCard;