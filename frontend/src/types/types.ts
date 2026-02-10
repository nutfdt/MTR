// src/types/index.ts - UPDATED pour correspondre à l'API Django

export interface Book {
  id: number;
  title: string;
  author: string;  // Nom de l'auteur (extrait du premier auteur)
  relevance: number;
  occurrences: number;
  excerpt: string;
  icon: string;  // URL de cover_image ou emoji
  color: string;
}

export interface Filters {
  caseSensitive: boolean;
  exactMatch: boolean;
  relevanceMin: number;
  relevanceMax: number;
  occurrencesMin: number;
  sortBy: string;
}

export type SearchType = 'simple' | 'regex';

export interface Suggestion {
  id: number;
  title?: string;
  query?: string;
  rating?: number;
  image?: string;
}

export interface Suggestions {
  similar: Suggestion[];
  popular: Suggestion[];
  recommended: Suggestion[];
}

// Types complets de l'API Django (pour référence)
export interface ApiAuthor {
  id: number;
  name: string;
  birth_year: number | null;
  death_year: number | null;
}

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
}

export interface ApiSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiBook[];
}