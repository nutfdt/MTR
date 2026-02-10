// src/App.tsx - UPDATED avec toutes les routes

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookPreviewPage from './pages/Bookpreviewpage';
import BookReaderPage from './pages/Bookreaderpage';

function App() {
  return (
    <SearchProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/book/preview/:bookId" element={<BookPreviewPage />} />
          <Route path="/book/read/:bookId" element={<BookReaderPage />} />
        </Routes>
      </Router>
    </SearchProvider>
  );
}

export default App;