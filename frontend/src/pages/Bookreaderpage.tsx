// src/pages/BookReaderPage.tsx - UPDATED avec config centralisé

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/BookReaderPage.css';
import { API_ENDPOINTS, API_CONFIG } from '../Api/config';

interface BookData {
  id: number;
  title: string;
  authors: Array<{ name: string }>;
  text_content: string;
}

interface Chapter {
  number: number;
  title: string;
  startPosition: number;
  content: string;
}

const CHARS_PER_PAGE = 800; // Caractères par page

const BookReaderPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  
  const [book, setBook] = useState<BookData | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [bookmark, setBookmark] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookData();
  }, [bookId]);

  useEffect(() => {
    const savedBookmark = localStorage.getItem(`bookmark-${bookId}`);
    if (savedBookmark) setBookmark(parseInt(savedBookmark));

    const savedPage = localStorage.getItem(`lastPage-${bookId}`);
    if (savedPage) setCurrentPage(parseInt(savedPage));

    const savedTheme = localStorage.getItem(`theme-${bookId}`);
    if (savedTheme) setTheme(savedTheme as 'light' | 'sepia' | 'dark');

    const savedFontSize = localStorage.getItem(`fontSize-${bookId}`);
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
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
      
      const extractedChapters = extractChapters(data.text_content);
      setChapters(extractedChapters);
      
      
    } catch (err) {
      console.error('Erreur lors du chargement du livre:', err);
      setError('Erreur lors du chargement du livre');
    } finally {
      setLoading(false);
    }
  };

  const extractChapters = (text: string): Chapter[] => {
    const chapters: Chapter[] = [];
    
    // Chercher section CONTENTS
    const contentsMatch = text.match(/CONTENTS\r?\n([\s\S]{1,3000}?)(?:\r?\n\r?\n\r?\n|Letter 1|Chapter 1|CHAPTER I)/i);
    
    if (contentsMatch) {
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
            const position = text.indexOf(trimmed);
            if (position !== -1) {
              chapters.push({
                number: chapters.length + 1,
                title: trimmed,
                startPosition: position,
                content: ''
              });
            }
            break;
          }
        }
      });
    }
    
    // Fallback
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
              title: match[0].trim(),
              startPosition: match.index || 0,
              content: ''
            });
          });
          break;
        }
      }
    }
    
    if (chapters.length === 0) {
      return [{
        number: 1,
        title: "Lecture complète",
        startPosition: 0,
        content: text
      }];
    }

    chapters.forEach((chapter, index) => {
      const startPos = chapter.startPosition;
      const endPos = chapters[index + 1]?.startPosition || text.length;
      chapter.content = text.substring(startPos, endPos);
    });

    return chapters;
  };

  const getTotalPages = (): number => {
    if (!book) return 1;
    return Math.ceil(book.text_content.length / CHARS_PER_PAGE);
  };

  const getCurrentPageContent = (): string => {
    if (!book) return '';
    const start = (currentPage - 1) * CHARS_PER_PAGE;
    const end = start + CHARS_PER_PAGE;
    return book.text_content.substring(start, end);
  };

  const getCurrentChapter = (): Chapter | null => {
    if (!book || chapters.length === 0) return null;
    const currentPosition = (currentPage - 1) * CHARS_PER_PAGE;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentPosition >= chapters[i].startPosition) {
        return chapters[i];
      }
    }
    return chapters[0];
  };

  const goToChapter = (chapter: Chapter) => {
    const page = Math.floor(chapter.startPosition / CHARS_PER_PAGE) + 1;
    setCurrentPage(page);
    saveLastPage(page);
    setShowTOC(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      saveLastPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      saveLastPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = fontSize + delta;
    if (newSize >= 14 && newSize <= 24) {
      setFontSize(newSize);
      localStorage.setItem(`fontSize-${bookId}`, newSize.toString());
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'sepia' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem(`theme-${bookId}`, newTheme);
  };

  const toggleBookmark = () => {
    if (bookmark === currentPage) {
      setBookmark(null);
      localStorage.removeItem(`bookmark-${bookId}`);
    } else {
      setBookmark(currentPage);
      localStorage.setItem(`bookmark-${bookId}`, currentPage.toString());
    }
  };

  const saveLastPage = (page: number) => {
    localStorage.setItem(`lastPage-${bookId}`, page.toString());
  };

  const goToBookmark = () => {
    if (bookmark) {
      setCurrentPage(bookmark);
      saveLastPage(bookmark);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showSettings || showTOC) {
        if (e.key === 'Escape') {
          setShowSettings(false);
          setShowTOC(false);
        }
        return;
      }
      if (e.key === 'ArrowLeft') handlePreviousPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'b' || e.key === 'B') toggleBookmark();
      if (e.key === 't' || e.key === 'T') setShowTOC(true);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, showSettings, showTOC, bookmark]);

  if (loading) {
    return (
      <div className="book-reader-page theme-light">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement du livre...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-reader-page theme-light">
        <div className="error-container">
          <h3>Erreur</h3>
          <p>{error || 'Livre non trouvé'}</p>
          <button onClick={() => navigate(-1)}>Retour</button>
        </div>
      </div>
    );
  }

  const totalPages = getTotalPages();
  const currentChapter = getCurrentChapter();
  const authorName = book.authors && book.authors.length > 0 ? book.authors[0].name : 'Auteur inconnu';
  const progressPercent = ((currentPage / totalPages) * 100).toFixed(1);

  return (
    <div className={`book-reader-page theme-${theme}`}>
      <div className="reader-topbar">
        <div className="topbar-left">
          <button className="close-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="book-info-mini">
            <span className="book-title-mini">{book.title}</span>
            <span className="book-author-mini">par {authorName}</span>
          </div>
        </div>

        <div className="topbar-center">
          <div className="page-indicator">
            Page {currentPage.toLocaleString()} / {totalPages.toLocaleString()}
            <span className="progress-percent"> • {progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="topbar-right">
          {bookmark && bookmark !== currentPage && (
            <button className="goto-bookmark-btn" onClick={goToBookmark}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
              </svg>
            </button>
          )}

          <button 
            className={`bookmark-btn ${bookmark === currentPage ? 'active' : ''}`}
            onClick={toggleBookmark}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={bookmark === currentPage ? 'currentColor' : 'none'}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>

          <button className="toc-btn" onClick={() => setShowTOC(!showTOC)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>

          <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-content">
            <h3>Paramètres de lecture</h3>
            <div className="setting-group">
              <label>Taille du texte</label>
              <div className="font-size-controls">
                <button onClick={() => handleFontSizeChange(-2)}>A-</button>
                <span>{fontSize}px</span>
                <button onClick={() => handleFontSizeChange(2)}>A+</button>
              </div>
            </div>
            <div className="setting-group">
              <label>Thème</label>
              <div className="theme-controls">
                <button className={theme === 'light' ? 'active' : ''} onClick={() => handleThemeChange('light')}>
                  Clair
                </button>
                <button className={theme === 'sepia' ? 'active' : ''} onClick={() => handleThemeChange('sepia')}>
                  Sépia
                </button>
                <button className={theme === 'dark' ? 'active' : ''} onClick={() => handleThemeChange('dark')}>
                  Sombre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTOC && (
        <div className="toc-panel">
          <div className="toc-content">
            <div className="toc-header">
              <h3>Table des matières ({chapters.length} chapitres)</h3>
              <button onClick={() => setShowTOC(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
            <ul className="toc-chapters">
              {chapters.map((chapter) => (
                <li key={chapter.number} className="toc-chapter">
                  <button onClick={() => goToChapter(chapter)}>
                    <span className="chapter-number">Ch. {chapter.number}</span>
                    <span className="chapter-title">{chapter.title}</span>
                    <span className="chapter-page">
                      Page {Math.floor(chapter.startPosition / CHARS_PER_PAGE) + 1}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="reading-area">
        <div className="reading-content" style={{ fontSize: `${fontSize}px` }}>
          {currentChapter && (
            <h2 className="chapter-title">{currentChapter.title}</h2>
          )}
          <div className="chapter-content">
            {getCurrentPageContent().split('\n\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="reader-navigation">
        <button className="nav-btn prev-btn" onClick={handlePreviousPage} disabled={currentPage === 1}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Précédent</span>
        </button>

        <button className="nav-btn next-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
          <span>Suivant</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      <div className="click-zone left-zone" onClick={handlePreviousPage}></div>
      <div className="click-zone right-zone" onClick={handleNextPage}></div>
    </div>
  );
};

export default BookReaderPage;