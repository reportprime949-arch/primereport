import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NewsPortal from './pages/NewsPortal';
import CategoryPage from './pages/CategoryPage';
import ArticleDetail from './pages/ArticleDetail';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import RSSControls from './pages/RSSControls';

function App() {
  return (
    <Router>
      <div className="flex bg-prime-dark min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<NewsPortal />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/rss" element={<RSSControls />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
