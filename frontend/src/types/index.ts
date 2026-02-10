// src/types/index.ts

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

export interface Filters {
  caseSensitive: boolean;
  exactMatch: boolean;
  relevanceMin: number;
  relevanceMax: number;
  occurrencesMin: number;
  sortBy: string;
}

export interface SuggestedBook {
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
  similar: SuggestedBook[];
  popular: PopularSearch[];
  recommended: SuggestedBook[];
}

export type SearchType = 'simple' | 'regex';