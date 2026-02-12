import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Book, Filters, SearchType, Suggestions } from '../types';
import { API_ENDPOINTS, API_CONFIG, DEFAULT_PAGE_SIZE, type SearchMode } from '../Api/config';
import type { ApiSearchResponse } from '../types/types';

interface SearchContextType {
  searchQuery: string;
  searchType: SearchType;
  searchMode: SearchMode;
  searchScope: 'all' | 'title' | 'author';
  filters: Filters;
  searchResults: Book[];
  suggestions: Suggestions;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalResults: number;
  highlightedResults: Map<number, string>;
  setSearchQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  setSearchMode: (mode: SearchMode) => void;
  setSearchScope: (scope: 'all' | 'title' | 'author') => void;
  updateFilters: (newFilters: Partial<Filters>) => void;
  performSearch: (query: string, type?: SearchType, mode?: SearchMode, scope?: 'all' | 'title' | 'author') => void;
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
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  const [searchScope, setSearchScope] = useState<'all' | 'title' | 'author'>('all');
  const [filters, setFilters] = useState<Filters>({
    caseSensitive: false,
    exactMatch: false,
    relevanceMin: 0,
    relevanceMax: 100,
    occurrencesMin: 0,
    sortBy: 'popularity'
  });

  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [highlightedResults, setHighlightedResults] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  useEffect(() => {
    loadInitialBooks();
    loadSuggestions();
  }, []);

  const loadInitialBooks = async () => {
    await loadBooksFromUrl(API_ENDPOINTS.BOOKS_PAGINATED(1, DEFAULT_PAGE_SIZE));
  };

  const loadSuggestions = async () => {
    try {
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
          similar: recommendedBooks
        }));
      }

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

      
    } catch (err) {
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
      const response = await fetch(url, API_CONFIG);
      
      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch (e) {
        }
        throw new Error(errorMessage);
      }
      
      const data: ApiSearchResponse = await response.json();
      
      setTotalResults(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / DEFAULT_PAGE_SIZE));
      setNextPageUrl(data.next);
      setPreviousPageUrl(data.previous);
      
      const transformedBooks = transformApiBooks(data.results || []);
      setSearchResults(transformedBooks);
      
      if (searchMode === 'highlight') {
        const highlightMap = new Map<number, string>();
        data.results.forEach((book: any) => {
          if (book.highlighted_text) {
            highlightMap.set(book.id, book.highlighted_text);
          }
        });
        setHighlightedResults(highlightMap);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      
    } catch (err: any) {
      console.error('❌ Erreur chargement:', err);
      setError(err.message || 'Erreur lors du chargement des livres');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const transformApiBooks = (apiBooks: any[]): Book[] => {
    
    return apiBooks.map((book, index) => {
      let author = 'Auteur inconnu';
      if (book.authors && Array.isArray(book.authors) && book.authors.length > 0) {
        author = book.authors[0].name;
      }

      let excerpt = 'Aucun aperçu disponible...';
      if (book.description && book.description.trim()) {
        excerpt = book.description.substring(0, 200) + '...';
      } else if (book.text_content && book.text_content.trim()) {
        excerpt = book.text_content.substring(0, 200) + '...';
      }

      const icons = ['📘', '📙', '📗', '📕', '📓', '📔', '📖', '📚'];
      const colors = ['#1976d2', '#f57c00', '#388e3c', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#5d4037'];

      const occurrences = book.occurrences_count || 0;
      
      let relevance = 70;
      if (book.pagerank_score && book.pagerank_score > 0) {
        relevance = Math.min(100, Math.floor(book.pagerank_score * 1000));
      } else if (book.download_count && book.download_count > 0) {
        relevance = Math.min(100, Math.floor(book.download_count / 1000));
      }

      return {
        id: book.id,
        title: book.title || 'Sans titre',
        author: author,
        relevance: relevance,
        occurrences: occurrences,
        excerpt: excerpt,
        icon: book.cover_image || icons[index % icons.length],
        color: colors[index % colors.length]
      };
    });
  };

  const performSearch = async (
    query: string, 
    type: SearchType = 'simple', 
    mode: SearchMode = 'simple',
    scope: 'all' | 'title' | 'author' = 'all'
  ) => {
    setSearchQuery(query);
    setSearchType(type);
    setSearchMode(mode);
    setSearchScope(scope);
    setCurrentPage(1);
    setLoading(true);
    setError(null);
    setHighlightedResults(new Map());

    if (!query.trim()) {
      await loadInitialBooks();
      return;
    }

    try {
      let url = '';
      

      // Choisir l'endpoint selon le type
      if (type === 'regex') {
        url = API_ENDPOINTS.SEARCH_ADVANCED(query, 1, DEFAULT_PAGE_SIZE);
        
      } else if (mode === 'highlight') {
        url = API_ENDPOINTS.SEARCH_HIGHLIGHT(query, 1, DEFAULT_PAGE_SIZE);
        
      } else {
        url = API_ENDPOINTS.SEARCH_SIMPLE(query, 1, DEFAULT_PAGE_SIZE);
      }

      const response = await fetch(url, API_CONFIG);
      
      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch (e) {
        }
        throw new Error(errorMessage);
      }

      const data: ApiSearchResponse = await response.json();
      
      setTotalResults(data.count || data.results?.length || 0);
      setTotalPages(Math.ceil((data.count || data.results?.length || 0) / DEFAULT_PAGE_SIZE));
      setNextPageUrl(data.next || null);
      setPreviousPageUrl(data.previous || null);
      
      let transformedBooks = transformApiBooks(data.results || []);

      if (mode === 'highlight') {
        const highlightMap = new Map<number, string>();
        data.results.forEach((book: any) => {
          if (book.highlighted_text) {
            highlightMap.set(book.id, book.highlighted_text);
          }
        });
        setHighlightedResults(highlightMap);
      }
      if (scope !== 'all') {
        transformedBooks = filterByScope(transformedBooks, query, scope);
      }

      transformedBooks = applyClientFilters(transformedBooks, query);
      
      transformedBooks = sortResults(transformedBooks, filters.sortBy);

      setSearchResults(transformedBooks);
      
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByScope = (books: Book[], query: string, scope: 'title' | 'author'): Book[] => {
    const lowerQuery = query.toLowerCase();
    
    return books.filter(book => {
      if (scope === 'title') {
        return book.title.toLowerCase().includes(lowerQuery);
      } else if (scope === 'author') {
        return book.author.toLowerCase().includes(lowerQuery);
      }
      return true;
    });
  };

  const loadNextPage = async () => {
    if (nextPageUrl) {
      setCurrentPage(prev => prev + 1);
      await loadBooksFromUrl(nextPageUrl);
    }
  };

  const loadPreviousPage = async () => {
    if (previousPageUrl) {
      setCurrentPage(prev => prev - 1);
      await loadBooksFromUrl(previousPageUrl);
    }
  };

  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    setCurrentPage(page);
    
    let url = '';
    
    if (searchQuery) {
      if (searchType === 'regex') {
        url = API_ENDPOINTS.SEARCH_ADVANCED(searchQuery, page, DEFAULT_PAGE_SIZE);
      } else if (searchMode === 'highlight') {
        url = API_ENDPOINTS.SEARCH_HIGHLIGHT(searchQuery, page, DEFAULT_PAGE_SIZE);
      } else {
        url = API_ENDPOINTS.SEARCH_SIMPLE(searchQuery, page, DEFAULT_PAGE_SIZE);
      }
    } else {
      url = API_ENDPOINTS.BOOKS_PAGINATED(page, DEFAULT_PAGE_SIZE);
    }
    
    await loadBooksFromUrl(url);
  };

  const applyClientFilters = (books: Book[], query: string): Book[] => {
    return books.filter(book => {
      if (book.relevance < filters.relevanceMin || book.relevance > filters.relevanceMax) {
        return false;
      }

      if (book.occurrences < filters.occurrencesMin) {
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
    searchMode,
    searchScope,
    filters,
    searchResults,
    suggestions,
    loading,
    error,
    currentPage,
    totalPages,
    totalResults,
    highlightedResults,
    setSearchQuery,
    setSearchType,
    setSearchMode,
    setSearchScope,
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