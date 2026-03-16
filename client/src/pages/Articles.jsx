import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  EyeIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

import { adminApi } from '../lib/api';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getArticles();
      setArticles(data);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    try {
      await adminApi.deleteArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert("Failed to delete article");
    }
  };

  const filteredArticles = (articles || []).filter(art => 
    (selectedCategory === 'All' || art.category === selectedCategory) &&
    (art.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-prime-navy/30 p-6 rounded-3xl glass-card">
        <div className="flex-1 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filter by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-prime-dark/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-prime-accent/50 transition-all text-white"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-prime-dark/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-prime-accent/50 transition-all"
          >
            <option>All Categories</option>
            <option>Technology</option>
            <option>Finance</option>
            <option>Geopolitics</option>
            <option>Science</option>
          </select>
        </div>
        <button className="px-6 py-2.5 bg-prime-accent border border-prime-accent/20 text-prime-dark font-bold rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] active:scale-95">
          + Create Article
        </button>
      </div>

      {/* Table Area */}
      <div className="glass-card rounded-3xl overflow-hidden relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 uppercase text-[10px] tracking-widest text-gray-400 font-bold">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Author</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  <div className="flex flex-col items-center space-y-3">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-prime-accent" />
                    <span className="text-sm font-medium">Scanning Intelligence Repositories...</span>
                  </div>
                </td>
              </tr>
            ) : filteredArticles.map((article) => (
              <motion.tr 
                key={article.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                className="group cursor-default"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-prime-navy flex items-center justify-center border border-white/10 text-prime-accent font-bold group-hover:scale-110 transition-transform">
                      {article.title[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-200">{article.title}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-prime-navy/50 text-prime-accent text-[11px] font-bold rounded-full border border-prime-accent/20 uppercase">
                    {article.category}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-gray-400">{article.author}</td>
                <td className="px-6 py-5 text-sm text-gray-400">{article.date}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-1.5">
                    {article.status === 'Published' ? (
                      <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    <span className={`text-[11px] font-bold uppercase ${article.status === 'Published' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {article.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => { setSelectedArticle(article); setIsPreviewOpen(true); }}
                      className="p-2 rounded-lg bg-prime-navy/50 text-gray-400 hover:text-prime-accent transition-colors"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg bg-prime-navy/50 text-gray-400 hover:text-prime-glow transition-colors">
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(article.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="absolute inset-0 bg-prime-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-card rounded-[40px] p-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                >
                  <XCircleIcon className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-6">
                <span className="text-prime-accent font-bold tracking-[0.2em] uppercase text-xs">
                  {selectedArticle?.category}
                </span>
                <h2 className="text-4xl font-bold text-white leading-tight">
                  {selectedArticle?.title}
                </h2>
                <div className="flex items-center space-x-6 text-sm text-gray-400 py-4 border-y border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Author</span>
                    <span className="text-white mt-1 font-medium">{selectedArticle?.author}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Published</span>
                    <span className="text-white mt-1 font-medium">{selectedArticle?.date}</span>
                  </div>
                </div>
                <div className="text-gray-300 leading-relaxed text-lg">
                  <p>In a world increasingly dominated by neural architectures and large language models, the fabric of media is undergoing a fundamental shift. PrimeReport is at the forefront of this evolution, utilizing advanced AI engines to not only curate but synthetically enhance global narratives...</p>
                </div>
                <div className="pt-6 flex space-x-4">
                  <button className="flex-1 py-4 bg-prime-accent text-prime-dark font-bold rounded-2xl transition-all hover:scale-[1.02]">
                    Edit Draft
                  </button>
                  <button className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl transition-all hover:bg-white/10">
                    Live Preview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Articles;
