// src/api/config.ts
/**
 * Configuration centralisée de l'API Backend Django
 */

// URL de base (configurable via variable d'environnement)
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';


// Tous les endpoints de l'API
export const API_ENDPOINTS = {
  // Livres
  BOOKS: `${API_BASE_URL}/books/`,
  BOOKS_PAGINATED: (page: number, pageSize: number = 10) => 
    `${API_BASE_URL}/books/?page=${page}&page_size=${pageSize}`,
  BOOK_DETAIL: (id: number | string) => `${API_BASE_URL}/books/${id}/`,
  
  // Recherche
  SEARCH_SIMPLE: (query: string, page: number = 1, pageSize: number = 10) =>
    `${API_BASE_URL}/books/search/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
  SEARCH_ADVANCED: (query: string, page: number = 1, pageSize: number = 10) =>
    `${API_BASE_URL}/books/advanced-search/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
  
  // Auteurs
  AUTHORS: `${API_BASE_URL}/authors/`,
  AUTHOR_DETAIL: (id: number | string) => `${API_BASE_URL}/authors/${id}/`,
  
  // Auto-complétion
  AUTOCOMPLETE: (query: string, limit: number = 10) =>
    `${API_BASE_URL}/autocomplete/?q=${encodeURIComponent(query)}&limit=${limit}`,
};

// Configuration pour les requêtes fetch
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  mode: 'cors' as RequestMode,
};

// Constantes
export const DEFAULT_PAGE_SIZE = 10;

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  NOT_FOUND: 'Ressource non trouvée',
  SERVER_ERROR: 'Erreur serveur',
  UNKNOWN_ERROR: 'Une erreur est survenue',
};