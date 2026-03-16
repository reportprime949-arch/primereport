import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { newsApi } from '../lib/api';
import { SparklesIcon, FireIcon } from '@heroicons/react/24/outline';

const CategoryPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [artRes, trendRes] = await Promise.all([
                    newsApi.getArticles(slug, 1, 15),
                    newsApi.getTrending()
                ]);
                setArticles(artRes.data.articles);
                setTrending(trendRes.data.filter(a => a.category.toLowerCase() === slug.toLowerCase()));
            } catch (err) {
                console.error("Failed to fetch category data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen bg-prime-dark flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-prime-accent/20 border-t-prime-accent rounded-full animate-spin" />
        </div>
    );

    const titleCat = slug.charAt(0).toUpperCase() + slug.slice(1);
    const heroArt = articles[0];

    return (
        <div className="min-h-screen bg-prime-dark text-white font-inter pb-20">
            <div className="container mx-auto px-4 py-12">
                <header className="mb-12">
                    <h1 className="text-5xl font-black tracking-tight">{titleCat} <span className="text-prime-accent">Intelligence</span></h1>
                    <p className="text-gray-400 mt-2">Latest global reports and neural analysis on {slug}.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Category Feed */}
                    <div className="lg:col-span-8 space-y-12">
                        {heroArt && (
                            <section 
                                onClick={() => navigate(`/article/${heroArt.slug || heroArt.id}`)}
                                className="group cursor-pointer relative overflow-hidden rounded-[2.5rem] bg-prime-navy border border-white/5 ring-1 ring-white/10"
                            >
                                <div className="aspect-video w-full relative">
                                    <img src={heroArt.image} alt={heroArt.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-prime-dark via-prime-dark/20 to-transparent" />
                                </div>
                                <div className="absolute bottom-0 left-0 p-8 w-full">
                                    <h2 className="text-3xl font-black mb-4 group-hover:text-prime-accent transition-all">{heroArt.title}</h2>
                                    <p className="text-gray-400 line-clamp-2 max-w-2xl">{heroArt.summary}</p>
                                </div>
                            </section>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {articles.slice(1).map((art, idx) => (
                                <motion.div 
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    onClick={() => navigate(`/article/${art.slug || art.id}`)}
                                    className="group cursor-pointer"
                                >
                                    <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white/5 border border-white/5 relative mb-4">
                                        <img src={art.image} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        {art.isBreaking && (
                                            <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">BREAKING</div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg leading-tight group-hover:text-prime-accent transition-colors line-clamp-2">{art.title}</h3>
                                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{art.summary}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-10">
                        <div className="glass-card p-8 rounded-[2rem]">
                            <h3 className="text-xl font-bold flex items-center space-x-2 mb-6">
                                <FireIcon className="w-5 h-5 text-red-500" />
                                <span>Trending in {titleCat}</span>
                            </h3>
                            <div className="space-y-6">
                                {trending.length > 0 ? trending.map((art, idx) => (
                                    <div key={idx} onClick={() => navigate(`/article/${art.slug || art.id}`)} className="group cursor-pointer flex gap-4">
                                         <span className="text-3xl font-black text-white/10 group-hover:text-prime-accent/20 transition-colors">0{idx+1}</span>
                                         <h4 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-prime-accent transition-all">{art.title}</h4>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-sm">No trending topics in this category yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-prime-accent/10 to-transparent border border-white/5">
                            <h3 className="text-lg font-bold mb-4">Subscribe to {titleCat} Updates</h3>
                            <div className="space-y-3">
                                <input type="email" placeholder="access-code@news.ai" className="w-full bg-prime-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                                <button className="w-full bg-prime-accent text-prime-dark font-black py-3 rounded-xl text-xs uppercase tracking-widest">Register Access</button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CategoryPage;
