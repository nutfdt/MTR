// src/pages/SearchPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SearchPage.css';
import { useSearch } from '../context/SearchContext';
import Header from '../components/Header';
import Filters from '../components/Filters';
import SearchResults from '../components/SearchResults';
import Suggestions from '../components/Suggestions';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { searchQuery, performSearch } = useSearch();
  const [localQuery, setLocalQuery] = useState(searchQuery || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      performSearch(localQuery);
    }
  };


  return (
    <div className="search-page">
      <Header 
      />
      
      <main className="search-main">
        <div className="search-container">
          <aside className="sidebar-left">
            <Filters />
          </aside>
          
          <section className="results-section">
            <SearchResults />
          </section>
          <section className="results-section">
            <Suggestions />
          </section>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;