// src/components/Suggestions.tsx - Avec images des livres

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import '../styles/Suggestions.css';

interface SuggestedBook {
  id: number;
  title: string;
  author: string;
  cover: string;
  hasImage: boolean;
}

const Suggestions: React.FC = () => {
  const navigate = useNavigate();
  const { searchResults } = useSearch();
  const [suggestions, setSuggestions] = useState<SuggestedBook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchResults.length > 0) {
      loadSuggestions();
    } else {
      loadPopularBooks();
    }
  }, [searchResults]);

  const loadPopularBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/books/?page=1&page_size=8');
      
      if (!response.ok) throw new Error('Failed');
      
      const data = await response.json();
      const books = data.results || [];
      
      const formatted: SuggestedBook[] = books.map((book: any) => ({
        id: book.id,
        title: book.title.substring(0, 60),
        author: book.authors?.[0]?.name || 'Auteur inconnu',
        cover: book.cover_image || '📚',
        hasImage: !!book.cover_image
      }));
      
      setSuggestions(formatted);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      
      // Prendre les top 3 résultats de recherche
      const topResults = searchResults.slice(0, 3);
      const resultIds = new Set(topResults.map(b => b.id));
      
      // Récupérer des livres différents
      const response = await fetch('http://localhost:8000/api/books/?page=1&page_size=20');
      
      if (!response.ok) throw new Error('Failed');
      
      const data = await response.json();
      const allBooks = data.results || [];
      
      // Filtrer pour avoir des livres différents
      const differentBooks = allBooks.filter((book: any) => !resultIds.has(book.id));
      
      const formatted: SuggestedBook[] = differentBooks.slice(0, 8).map((book: any) => ({
        id: book.id,
        title: book.title.substring(0, 60),
        author: book.authors?.[0]?.name || 'Auteur inconnu',
        cover: book.cover_image || '📚',
        hasImage: !!book.cover_image
      }));
      
      setSuggestions(formatted);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (bookId: number) => {
    navigate(`/book/preview/${bookId}`);
  };

  if (loading) {
    return (
      <div className="suggestions-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="suggestions-container">
      <h2 className="suggestions-title">
        {searchResults.length > 0 ? 'Suggestions similaires' : 'Livres populaires'}
      </h2>
      
      <div className="suggestions-grid">
        {suggestions.map(book => (
          <div 
            key={book.id} 
            className="suggestion-card"
            onClick={() => handleBookClick(book.id)}
          >
            <div className="suggestion-cover">
              {book.hasImage ? (
                <img src={book.cover} alt={book.title} className="cover-image" />
              ) : (
                <span className="cover-icon">{book.cover}</span>
              )}
            </div>
            <div className="suggestion-info">
              <h3 className="suggestion-title">{book.title}</h3>
              <p className="suggestion-author">{book.author}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;