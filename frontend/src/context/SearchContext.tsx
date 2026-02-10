// src/context/SearchContext.tsx - FINAL avec config centralisé

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Book, Filters, SearchType, Suggestions } from '../types';
import { API_ENDPOINTS, API_CONFIG, DEFAULT_PAGE_SIZE } from '../Api/config';

interface SearchContextType {
  searchQuery: string;
  searchType: SearchType;
  filters: Filters;
  searchResults: Book[];
  suggestions: Suggestions;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalResults: number;
  setSearchQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  updateFilters: (newFilters: Partial<Filters>) => void;
  performSearch: (query: string, type?: SearchType) => void;
  setSearchResults: (results: Book[]) => void;
  setSuggestions: (suggestions: Suggestions) => void;
  loadNextPage: () => void;
  loadPreviousPage: () => void;
  goToPage: (page: number) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('simple');
  const [filters, setFilters] = useState<Filters>({
    caseSensitive: false,
    exactMatch: false,
    relevanceMin: 0,
    relevanceMax: 100,
    occurrencesMin: 0,
    sortBy: 'popularity'
  });

  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [previousPageUrl, setPreviousPageUrl] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestions>({
    similar: [],
    popular: [],
    recommended: []
  });

  // Charger les livres et suggestions au démarrage
  useEffect(() => {
    loadInitialBooks();
    loadSuggestions();
  }, []);

  const loadInitialBooks = async () => {
    await loadBooksFromUrl(API_ENDPOINTS.BOOKS_PAGINATED(1, DEFAULT_PAGE_SIZE));
  };

  const loadSuggestions = async () => {
    try {
      // Charger les livres recommandés (top 3 par download_count)
      const recommendedResponse = await fetch(
        API_ENDPOINTS.BOOKS_PAGINATED(1, 3),
        API_CONFIG
      );
      
      if (recommendedResponse.ok) {
        const data = await recommendedResponse.json();
        const recommendedBooks = transformToSuggestionBooks(data.results || []);
        
        setSuggestions(prev => ({
          ...prev,
          recommended: recommendedBooks,
          similar: recommendedBooks // Pour l'instant, utiliser les mêmes
        }));
      }

      // Charger les recherches populaires (simulation basée sur sujets populaires)
      const popularBooks = await fetch(
        API_ENDPOINTS.BOOKS_PAGINATED(1, 5),
        API_CONFIG
      );
      
      if (popularBooks.ok) {
        const data = await popularBooks.json();
        const popularSearches = (data.results || []).slice(0, 3).map((book: any, index: number) => ({
          id: index + 1,
          query: book.title.split(':')[0] || book.title.substring(0, 30)
        }));
        
        setSuggestions(prev => ({
          ...prev,
          popular: popularSearches
        }));
      }

      console.log('✅ Suggestions chargées');
      
    } catch (err) {
      console.warn('⚠️ Erreur chargement suggestions:', err);
      // Garder les suggestions vides en cas d'erreur
    }
  };

  const transformToSuggestionBooks = (apiBooks: any[]) => {
    return apiBooks.map((book, index) => {
      const rating = book.download_count > 50000 ? 5 
                   : book.download_count > 10000 ? 4 
                   : book.download_count > 1000 ? 3 : 2;
      
      return {
        id: book.id,
        title: book.title.length > 40 ? book.title.substring(0, 40) + '...' : book.title,
        rating: rating,
        image: book.cover_image || ['📘', '📙', '📗'][index % 3]
      };
    });
  };

  const loadBooksFromUrl = async (url: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement depuis:', url);
      const response = await fetch(url, API_CONFIG);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Données reçues:', data);
      
      // Mettre à jour la pagination
      setTotalResults(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / DEFAULT_PAGE_SIZE));
      setNextPageUrl(data.next);
      setPreviousPageUrl(data.previous);
      
      // Transformer les données
      const transformedBooks = transformApiBooks(data.results || []);
      setSearchResults(transformedBooks);
      
      // Scroll vers le haut
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log('✅ Résultats transformés:', transformedBooks.length);
      
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      setError('Erreur lors du chargement des livres');
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const transformApiBooks = (apiBooks: any[]): Book[] => {
    return apiBooks.map((book, index) => {
      const author = book.authors && book.authors.length > 0 
        ? book.authors[0].name 
        : 'Auteur inconnu';

      const excerpt = book.description 
        ? book.description.substring(0, 200) + '...'
        : (book.text_content 
          ? book.text_content.substring(0, 200) + '...'
          : 'Aucun aperçu disponible...');

      const icons = ['📘', '📙', '📗', '📕', '📓', '📔', '📖', '📚'];
      const colors = ['#1976d2', '#f57c00', '#388e3c', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#5d4037'];

      return {
        id: book.id,
        title: book.title,
        author: author,
        relevance: book.download_count ? Math.min(100, Math.floor(book.download_count / 1000)) : 70,
        occurrences: 0,
        excerpt: excerpt,
        icon: book.cover_image || icons[index % icons.length],
        color: colors[index % colors.length]
      };
    });
  };

  const performSearch = async (query: string, type: SearchType = 'simple') => {
    setSearchQuery(query);
    setSearchType(type);
    setCurrentPage(1);
    setLoading(true);
    setError(null);

    if (!query.trim()) {
      await loadInitialBooks();
      return;
    }

    try {
      // Utiliser les endpoints de config
      const url = type === 'simple'
        ? API_ENDPOINTS.SEARCH_SIMPLE(query, 1, DEFAULT_PAGE_SIZE)
        : API_ENDPOINTS.SEARCH_ADVANCED(query, 1, DEFAULT_PAGE_SIZE);

      console.log('🔍 Recherche:', url);
      const response = await fetch(url, API_CONFIG);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setTotalResults(data.count || data.results?.length || 0);
      setTotalPages(Math.ceil((data.count || data.results?.length || 0) / DEFAULT_PAGE_SIZE));
      setNextPageUrl(data.next || null);
      setPreviousPageUrl(data.previous || null);
      
      let transformedBooks = transformApiBooks(data.results || []);
      transformedBooks = applyClientFilters(transformedBooks, query);
      transformedBooks = sortResults(transformedBooks, filters.sortBy);

      setSearchResults(transformedBooks);
      
      console.log(`✅ Trouvé ${transformedBooks.length} résultats pour "${query}"`);
      
    } catch (err) {
      console.error('❌ Erreur de recherche:', err);
      setError('Erreur lors de la recherche');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNextPage = async () => {
    console.log('▶️ loadNextPage appelé');
    
    if (nextPageUrl) {
      setCurrentPage(prev => prev + 1);
      await loadBooksFromUrl(nextPageUrl);
    } else {
      console.warn('⚠️ Pas de nextPageUrl disponible');
    }
  };

  const loadPreviousPage = async () => {
    console.log('◀️ loadPreviousPage appelé');
    
    if (previousPageUrl) {
      setCurrentPage(prev => prev - 1);
      await loadBooksFromUrl(previousPageUrl);
    } else {
      console.warn('⚠️ Pas de previousPageUrl disponible');
    }
  };

  const goToPage = async (page: number) => {
    console.log(`🎯 goToPage appelé avec page: ${page}`);
    
    if (page < 1 || page > totalPages || page === currentPage) {
      console.warn('⚠️ Page invalide');
      return;
    }
    
    setCurrentPage(page);
    
    // Utiliser les endpoints de config
    let url = '';
    
    if (searchQuery) {
      url = searchType === 'simple'
        ? API_ENDPOINTS.SEARCH_SIMPLE(searchQuery, page, DEFAULT_PAGE_SIZE)
        : API_ENDPOINTS.SEARCH_ADVANCED(searchQuery, page, DEFAULT_PAGE_SIZE);
    } else {
      url = API_ENDPOINTS.BOOKS_PAGINATED(page, DEFAULT_PAGE_SIZE);
    }
    
    console.log('📡 URL construite:', url);
    await loadBooksFromUrl(url);
  };

  const applyClientFilters = (books: Book[], query: string): Book[] => {
    return books.filter(book => {
      if (book.relevance < filters.relevanceMin || book.relevance > filters.relevanceMax) {
        return false;
      }

      const text = `${book.title} ${book.author} ${book.excerpt}`.toLowerCase();
      const searchTerm = filters.caseSensitive ? query : query.toLowerCase();
      const occurrences = text.split(searchTerm).length - 1;
      
      book.occurrences = occurrences;

      if (occurrences < filters.occurrencesMin) {
        return false;
      }

      return true;
    });
  };

  const sortResults = (books: Book[], sortBy: string): Book[] => {
    const sorted = [...books];

    switch (sortBy) {
      case 'popularity':
      case 'relevance':
        return sorted.sort((a, b) => b.relevance - a.relevance);
      case 'occurrences':
        return sorted.sort((a, b) => b.occurrences - a.occurrences);
      case 'recent':
        return sorted.sort((a, b) => b.id - a.id);
      default:
        return sorted;
    }
  };

  const value: SearchContextType = {
    searchQuery,
    searchType,
    filters,
    searchResults,
    suggestions,
    loading,
    error,
    currentPage,
    totalPages,
    totalResults,
    setSearchQuery,
    setSearchType,
    updateFilters,
    performSearch,
    setSearchResults,
    setSuggestions,
    loadNextPage,
    loadPreviousPage,
    goToPage
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};