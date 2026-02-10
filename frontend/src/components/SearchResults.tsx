// src/components/SearchResults.tsx - VERSION SIMPLIFIÉE QUI MARCHE

import React from 'react';
import { useSearch } from '../context/SearchContext';
import ResultCard from './ResultCard';
import '../styles/SearchResults.css';
import LoadingSpinner from './Loadingspinner';

const SearchResults: React.FC = () => {
  const { 
    searchResults, 
    searchQuery, 
    loading, 
    error,
    currentPage,
    totalPages,
    totalResults,
    loadNextPage,
    loadPreviousPage,
    goToPage
  } = useSearch();

  // Debug
  console.log('🔍 SearchResults render:', { currentPage, totalPages, totalResults });

  // État de chargement
  if (loading) {
    return <LoadingSpinner />;
  }

  // État d'erreur
  if (error) {
    return (
      <div className="error-container">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="35" stroke="#ef4444" strokeWidth="3"/>
          <path d="M40 25v20M40 55h.01" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <h3>Erreur</h3>
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      <h2 className="results-title">
        {searchQuery 
          ? `Résultats pour "${searchQuery}" (${totalResults})`
          : `Livres disponibles (${totalResults})`
        }
      </h2>
      
      {searchResults.length > 0 ? (
        <>
          <div className="results-list">
            {searchResults.map(result => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>

          {/* PAGINATION - Affichée si plus d'1 page */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <div className="pagination-container">
                
                {/* Bouton PRÉCÉDENT */}
                <button 
                  className="pagination-btn prev-btn"
                  onClick={() => {
                    console.log('🔵 Clic PRÉCÉDENT');
                    loadPreviousPage();
                  }}
                  disabled={currentPage === 1}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 16l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Précédent</span>
                </button>

                {/* NUMÉROS DE PAGE */}
                <div className="pagination-pages">
                  {/* Afficher jusqu'à 5 pages autour de la page actuelle */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    
                    if (totalPages <= 5) {
                      // Si 5 pages ou moins, afficher toutes
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      // Si au début, afficher 1-5
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // Si à la fin, afficher les 5 dernières
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Sinon, centrer autour de currentPage
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button 
                        key={pageNum}
                        className={`page-number ${pageNum === currentPage ? 'active' : ''}`}
                        onClick={() => {
                          console.log(`🔵 Clic page ${pageNum}`);
                          goToPage(pageNum);
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Bouton SUIVANT */}
                <button 
                  className="pagination-btn next-btn"
                  onClick={() => {
                    console.log('🔵 Clic SUIVANT');
                    loadNextPage();
                  }}
                  disabled={currentPage === totalPages}
                >
                  <span>Suivant</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M8 16l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Info pagination */}
              <div className="pagination-footer">
                <p>
                  Page {currentPage} sur {totalPages} • 
                  Affichage de {((currentPage - 1) * 10) + 1} à {Math.min(currentPage * 10, totalResults)} sur {totalResults.toLocaleString()} résultats
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-results">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" stroke="#e0e6ed" strokeWidth="4"/>
            <path d="M40 50h40M40 70h40" stroke="#e0e6ed" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="45" cy="50" r="5" fill="#94a3b8"/>
            <circle cx="75" cy="50" r="5" fill="#94a3b8"/>
          </svg>
          <h3>Aucun résultat trouvé</h3>
          <p>
            {searchQuery 
              ? `Aucun livre ne correspond à "${searchQuery}"`
              : 'Essayez de rechercher un livre ou un auteur'
            }
          </p>
          <div className="search-suggestions">
            <p><strong>Suggestions :</strong></p>
            <ul>
              <li>Vérifiez l'orthographe de votre recherche</li>
              <li>Essayez des mots-clés plus généraux</li>
              <li>Utilisez moins de filtres</li>
              <li>Essayez de rechercher par auteur</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;