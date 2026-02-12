// src/types/index.ts - Types TypeScript complets

export type SearchType = 'simple' | 'regex';
export type SearchMode = 'simple' | 'advanced' | 'highlight';

export interface Book {
  id: number;
  title: string;
  author: string;
  relevance: number;
  occurrences: number;
  excerpt: string;
  icon: string;
  color: string;
}

// Types pour les réponses API Django
export interface ApiBook {
  id: number;
  title: string;
  authors: ApiAuthor[];
  language: string;
  description: string;
  subjects: string;
  bookshelves: string;
  cover_image: string;
  download_count: number;
  copyright: boolean;
  text_content: string;
  // Champs ajoutés par l'API de recherche
  occurrences_count?: number;
  pagerank_score?: number;
  similar_books?: SimilarBook[];
  highlighted_text?: string;
}

export interface ApiAuthor {
  id: number;
  name: string;
  birth_year?: number;
  death_year?: number;
}

export interface SimilarBook {
  book: ApiBook;
  jaccard_similarity: number;
}

export interface ApiSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiBook[];
}

export interface Filters {
  caseSensitive: boolean;
  exactMatch: boolean;
  relevanceMin: number;
  relevanceMax: number;
  occurrencesMin: number;
  sortBy: 'popularity' | 'relevance' | 'occurrences' | 'recent';
}

export interface SuggestionBook {
  id: number;
  title: string;
  rating: number;
  image: string;
}

export interface PopularSearch {
  id: number;
  query: string;
}

export interface Suggestions {
  similar: SuggestionBook[];
  popular: PopularSearch[];
  recommended: SuggestionBook[];
}

// Paramètres de recherche
export interface SearchParams {
  query: string;
  mode: SearchMode;
  author?: string;
  page?: number;
  pageSize?: number;
}