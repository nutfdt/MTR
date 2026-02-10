// src/pages/BookPreviewPage.tsx - UPDATED avec config centralisé

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/BookPreviewPage.css';
import { API_ENDPOINTS, API_CONFIG } from '../Api/config';

interface BookData {
  id: number;
  title: string;
  authors: Array<{ name: string; birth_year?: number; death_year?: number }>;
  language: string;
  description: string;
  subjects: string;
  bookshelves: string;
  cover_image: string;
  download_count: number;
  text_content: string;
}

interface Chapter {
  number: number;
  title: string;
}

const BookPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookData();
  }, [bookId]);

  const fetchBookData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Utiliser l'endpoint de config
      const url = API_ENDPOINTS.BOOK_DETAIL(bookId!);
      const response = await fetch(url, API_CONFIG);
      
      if (!response.ok) {
        throw new Error('Livre non trouvé');
      }

      const data = await response.json();
      setBook(data);
      
      console.log('📖 Livre chargé:', data.title);
      
    } catch (err) {
      console.error('Erreur lors du chargement du livre:', err);
      setError('Erreur lors du chargement du livre');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!isFavorite) {
      favorites.push(bookId);
    } else {
      const index = favorites.indexOf(bookId);
      if (index > -1) favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
  };

  const handleReadFull = () => {
    navigate(`/book/read/${bookId}`);
  };

  const getAuthorName = () => {
    if (!book || !book.authors || book.authors.length === 0) return 'Auteur inconnu';
    return book.authors[0].name;
  };

  const getAuthorYears = () => {
    if (!book || !book.authors || book.authors.length === 0) return '';
    const author = book.authors[0];
    if (author.birth_year && author.death_year) {
      return `${author.birth_year} - ${author.death_year}`;
    } else if (author.birth_year) {
      return `${author.birth_year}`;
    }
    return '';
  };

  const getCategory = () => {
    if (!book || !book.bookshelves) return 'Littérature';
    const categories = book.bookshelves.split(',');
    return categories[0]?.trim() || 'Littérature';
  };

  const estimatePages = () => {
    if (!book || !book.text_content) return 0;
    const words = book.text_content.split(/\s+/).length;
    return Math.ceil(words / 250);
  };

  const countWords = () => {
    if (!book || !book.text_content) return 0;
    return book.text_content.split(/\s+/).length;
  };

  const getPreviewText = () => {
    if (!book || !book.text_content) return '';
    return book.text_content.substring(0, 2000);
  };

  const generateTableOfContents = (): Chapter[] => {
    if (!book || !book.text_content) return [];
    
    const chapters: Chapter[] = [];
    const text = book.text_content;
    
    // Chercher section CONTENTS
    const contentsMatch = text.match(/CONTENTS\r?\n([\s\S]{1,3000}?)(?:\r?\n\r?\n\r?\n|Letter 1|Chapter 1|CHAPTER I)/i);
    
    if (contentsMatch) {
      console.log('📚 Section CONTENTS trouvée');
      const contentsText = contentsMatch[1];
      const lines = contentsText.split(/\r?\n/);
      
      lines.forEach((line) => {
        const trimmed = line.trim();
        const patterns = [
          /^(Letter\s+\d+)/i,
          /^(Chapter\s+\d+)/i,
          /^(Chapter\s+[IVXLCDM]+)/i,
          /^(CHAPTER\s+\d+)/i,
          /^(CHAPTER\s+[IVXLCDM]+)/i,
        ];
        
        for (const pattern of patterns) {
          const match = trimmed.match(pattern);
          if (match && trimmed.length > 2 && trimmed.length < 100) {
            chapters.push({
              number: chapters.length + 1,
              title: trimmed
            });
            break;
          }
        }
      });
    }
    
    // Fallback: chercher dans le texte
    if (chapters.length === 0) {
      const patterns = [
        /^Letter\s+\d+/gim,
        /^CHAPTER\s+[IVXLCDM]+/gim,
        /^Chapter\s+\d+/gim,
      ];
      
      for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
          matches.forEach((match, index) => {
            chapters.push({
              number: index + 1,
              title: match[0].trim()
            });
          });
          break;
        }
      }
    }
    
    console.log(`📚 ${chapters.length} chapitres trouvés`);
    return chapters.slice(0, 8);
  };

  const getRating = () => {
    if (!book || !book.download_count) return 3.5;
    if (book.download_count > 50000) return 4.5;
    if (book.download_count > 10000) return 4.0;
    if (book.download_count > 1000) return 3.5;
    return 3.0;
  };

  useEffect(() => {
    if (bookId) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favorites.includes(bookId));
    }
  }, [bookId]);

  if (loading) {
    return (
      <div className="book-preview-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement du livre...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-preview-page">
        <div className="error-container">
          <h3>Erreur</h3>
          <p>{error || 'Livre non trouvé'}</p>
          <button onClick={() => navigate(-1)}>Retour</button>
        </div>
      </div>
    );
  }

  const rating = getRating();
  const tableOfContents = generateTableOfContents();

  return (
    <div className="book-preview-page">
      <header className="preview-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M8 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Retour
          </button>

          <div className="header-actions">
            <button className={`favorite-btn ${isFavorite ? 'active' : ''}`} onClick={toggleFavorite}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? '#e53935' : 'none'}>
                <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" 
                  stroke="#e53935" 
                  strokeWidth="2"
                />
              </svg>
              {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
            </button>

            <button className="share-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Partager
            </button>
          </div>
        </div>
      </header>

      <div className="preview-container">
        <div className="preview-main">
          <div className="book-info-section">
            <div className="book-cover-large" style={{ backgroundColor: '#1976d2' }}>
              {book.cover_image ? (
                <img src={book.cover_image} alt={book.title} />
              ) : (
                <span className="cover-icon">📘</span>
              )}
            </div>

            <div className="book-details">
              <div className="book-category">{getCategory()}</div>
              <h1 className="book-title">{book.title}</h1>
              <p className="book-author">Par {getAuthorName()}</p>

              <div className="book-rating">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} width="20" height="20" viewBox="0 0 20 20" fill={star <= Math.floor(rating) ? '#fbbf24' : 'none'}>
                      <path d="M10 1l2.5 6.5L19 8l-5 4.5L15.5 19 10 15l-5.5 4L6 12.5 1 8l6.5-.5L10 1z" 
                        stroke="#fbbf24" 
                        strokeWidth="1"
                        fill={star <= Math.floor(rating) ? '#fbbf24' : 'none'}
                      />
                    </svg>
                  ))}
                  <span className="rating-text">{rating} ({book.download_count.toLocaleString()} téléchargements)</span>
                </div>
              </div>

              <div className="book-meta">
                <div className="meta-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 4h14M3 10h14M3 16h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>~{estimatePages()} pages</span>
                </div>
                <div className="meta-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>{getAuthorYears() || 'Classique'}</span>
                </div>
                <div className="meta-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 4h12v12H4V4z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 1v6M13 1v6M1 7h18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{countWords().toLocaleString()} mots</span>
                </div>
                <div className="meta-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 7l7-4 7 4M3 13l7 4 7-4M3 7v6M17 7v6M10 3v14" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{book.language === 'en' ? 'Anglais' : book.language === 'fr' ? 'Français' : book.language}</span>
                </div>
              </div>

              <div className="book-description">
                <h3>Description</h3>
                <p>{book.description || 'Aucune description disponible.'}</p>
              </div>

              <div className="action-buttons">
                <button className="read-full-btn" onClick={handleReadFull}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 016.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Lire le livre complet
                </button>
                <button className="download-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Télécharger (PDF)
                </button>
              </div>
            </div>
          </div>

          <div className="preview-content">
            <h2>Aperçu du contenu</h2>
            <div className="preview-text">
              {getPreviewText().split('\n\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="preview-fade"></div>
            <button className="continue-reading-btn" onClick={handleReadFull}>
              Continuer la lecture →
            </button>
          </div>
        </div>

        <aside className="preview-sidebar">
          {tableOfContents.length > 0 && (
            <div className="toc-card">
              <h3>Table des matières</h3>
              <ul className="toc-list">
                {tableOfContents.map((chapter) => (
                  <li key={chapter.number} className="toc-item">
                    <span className="toc-number">{chapter.number}</span>
                    <span className="toc-title">{chapter.title}</span>
                  </li>
                ))}
                {tableOfContents.length >= 8 && (
                  <li className="toc-item more">
                    <span>📖 Voir le livre complet pour tous les chapitres</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="similar-books-card">
            <h3>Livres similaires</h3>
            <p style={{ padding: '1rem', color: '#64748b', fontSize: '14px' }}>
              Consultez d'autres œuvres de {getAuthorName()} ou explorez la catégorie "{getCategory()}".
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookPreviewPage;