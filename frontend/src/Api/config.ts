// src/api/config.ts - Configuration complète avec TOUS les endpoints Django

/**
 * Configuration centralisée de l'API Backend Django
 */

// URL de base (configurable via variable d'environnement)
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api';



// Tous les endpoints de l'API Django
export const API_ENDPOINTS = {
  // ==================== LIVRES ====================
  
  // Liste paginée de tous les livres
  BOOKS: `${API_BASE_URL}/books/`,
  BOOKS_PAGINATED: (page: number, pageSize: number = 10) => 
    `${API_BASE_URL}/books/?page=${page}&page_size=${pageSize}`,
  
  // Détails d'un livre spécifique
  BOOK_DETAIL: (id: number | string) => `${API_BASE_URL}/books/${id}/`,
  
  // ==================== RECHERCHE ====================
  
  /**
   * Recherche SIMPLE par mot-clé
   * - Utilise l'index inversé
   * - Calcule Jaccard Similarity
   * - Calcule PageRank
   * - Retourne similar_books
   */
  SEARCH_SIMPLE: (query: string, page: number = 1, pageSize: number = 10, author?: string) => {
    let url = `${API_BASE_URL}/books/search/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`;
    if (author) {
      url += `&author=${encodeURIComponent(author)}`;
    }
    return url;
  },
  
  /**
   * Recherche AVANCÉE avec expressions régulières
   * - Supporte regex patterns
   * - Ex: [Ww]hale, whale.*, (whale|sea)
   * - Calcule PageRank
   */
  SEARCH_ADVANCED: (query: string, page: number = 1, pageSize: number = 10) =>
    `${API_BASE_URL}/books/advanced-search/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
  
  /**
   * Recherche avec SURLIGNAGE des occurrences
   * - Retourne highlighted_text avec balises <mark>
   * - Positions exactes des mots
   */
  SEARCH_HIGHLIGHT: (query: string, page: number = 1, pageSize: number = 10) =>
    `${API_BASE_URL}/books/highlight-search/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
  
  // ==================== AUTEURS ====================
  
  // Liste de tous les auteurs
  AUTHORS: `${API_BASE_URL}/authors/`,
  AUTHORS_PAGINATED: (page: number, pageSize: number = 10) =>
    `${API_BASE_URL}/authors/?page=${page}&page_size=${pageSize}`,
  
  // Détails d'un auteur spécifique (avec ses livres)
  AUTHOR_DETAIL: (id: number | string) => `${API_BASE_URL}/authors/${id}/`,
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

// Types de recherche
export type SearchMode = 'simple' | 'advanced' | 'highlight';

// Messages d'erreur
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  NOT_FOUND: 'Ressource non trouvée',
  SERVER_ERROR: 'Erreur serveur',
  UNKNOWN_ERROR: 'Une erreur est survenue',
  NO_QUERY: 'Veuillez entrer un terme de recherche',
};