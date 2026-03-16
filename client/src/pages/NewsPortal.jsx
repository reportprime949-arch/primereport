import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { newsApi } from '../lib/api';
import NewsTicker from '../components/NewsTicker';
import { 
    ChevronRightIcon, 
    SparklesIcon, 
    FireIcon, 
    ClockIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

const NewsPortal = () => {
    const navigate = useNavigate();
    const [heroArt, setHeroArt] = useState([]);
    const [trending, setTrending] = useState([]);
    const [breaking, setBreaking] = useState([]);
    const [latest, setLatest] = useState([]);
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortalData = async () => {
            try {
                setLoading(true);
                const [heroRes, trendRes, breakRes, latestRes] = await Promise.all([
                    newsApi.getHero(),
                    newsApi.getTrending(),
                    newsApi.getBreaking(),
                    newsApi.getArticles('all', 1, 12)
                ]);

                setHeroArt(heroRes.data);
                setTrending(trendRes.data);
                setBreaking(breakRes.data);
                setLatest(latestRes.data.articles);

                // Fetch data for category blocks
                const cats = ['world', 'technology', 'ai', 'business', 'sports'];
                const catData = {};
                await Promise.all(cats.map(async (cat) => {
                    const res = await newsApi.getArticles(cat, 1, 4);
                    catData[cat] = res.data.articles;
                }));
                setCategories(catData);

            } catch (err) {
                console.error("Portal fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPortalData();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-prime-dark flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-prime-accent/20 border-t-prime-accent rounded-full animate-spin" />
        </div>
    );

    const mainHero = heroArt[0] || latest[0];

    return (
        <div className="min-h-screen bg-prime-dark text-white font-inter pb-20 selection:bg-prime-accent selection:text-prime-dark">
            <NewsTicker news={breaking} />

            <div className="container mx-auto px-4 py-8">
                
                {/* 1. HERO SECTION (Breaking Focus) */}
                <section className="mb-16">
                    <div className="flex items-center space-x-2 mb-6 ml-1">
                        <BoltIcon className="w-4 h-4 text-prime-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-prime-accent">Elite Intelligence Feed</span>
                    </div>
                    
                    {mainHero && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => navigate(`/article/${mainHero.slug || mainHero.id}`)}
                            className="group relative cursor-pointer overflow-hidden rounded-[3rem] bg-prime-navy border border-white/5 ring-1 ring-white/10"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-12">
                                <div className="lg:col-span-8 aspect-video lg:aspect-auto relative overflow-hidden">
                                    <img src={mainHero.image} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-prime-dark via-transparent to-transparent hidden lg:block" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-prime-dark/90 via-transparent to-transparent lg:hidden" />
                                </div>
                                <div className="lg:col-span-4 p-8 lg:p-12 flex flex-col justify-center">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <span className="px-3 py-1 bg-prime-accent/10 border border-prime-accent/20 rounded-full text-[10px] font-bold text-prime-accent uppercase tracking-widest">{mainHero.category}</span>
                                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{mainHero.source}</span>
                                    </div>
                                    <h1 className="text-3xl lg:text-4xl font-black leading-tight mb-6 group-hover:text-prime-accent transition-colors">
                                        {mainHero.title}
                                    </h1>
                                    <p className="text-gray-400 text-sm line-clamp-3 mb-8 leading-relaxed">
                                        {mainHero.summary}
                                    </p>
                                    <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-prime-accent">
                                        <span>Initialize Read</span>
                                        <ChevronRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
                    {/* 2. TRENDING VERTICAL ROW */}
                    <div className="lg:col-span-4">
                        <section className="glass-card p-10 rounded-[2.5rem] border border-white/5 h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-prime-accent/5 blur-[80px] -mr-16 -mt-16" />
                            <h2 className="text-2xl font-black flex items-center space-x-3 mb-10 relative z-10">
                                <FireIcon className="w-6 h-6 text-red-500" />
                                <span>Trending Now</span>
                            </h2>
                            <div className="space-y-10 relative z-10">
                                {trending.slice(0, 6).map((art, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => navigate(`/article/${art.slug || art.id}`)}
                                        className="group cursor-pointer flex items-start gap-5"
                                    >
                                        <span className="text-4xl font-black text-white/5 leading-none group-hover:text-prime-accent/20 transition-colors">0{idx + 1}</span>
                                        <div>
                                            <span className="text-[10px] font-bold text-prime-accent/60 uppercase tracking-widest block mb-1">{art.category}</span>
                                            <h4 className="font-bold text-sm leading-snug group-hover:text-prime-accent transition-colors line-clamp-2">{art.title}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* 3. LATEST INTELLIGENCE (Main Feed) */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black flex items-center space-x-3">
                                <ClockIcon className="w-6 h-6 text-prime-accent" />
                                <span>Global Analysis</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                            {latest.slice(0, 6).map((art, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    onClick={() => navigate(`/article/${art.slug || art.id}`)}
                                    className="group cursor-pointer"
                                >
                                    <div className="aspect-[16/10] rounded-[2rem] overflow-hidden mb-6 relative bg-prime-navy border border-white/5">
                                        <img src={art.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        {art.isBreaking && (
                                            <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">Breaking</div>
                                        )}
                                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-white border border-white/10">
                                            {art.source}
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <span className="text-[10px] font-black tracking-[0.2em] text-prime-accent uppercase mb-2 block">{art.category}</span>
                                        <h3 className="font-bold text-lg leading-snug group-hover:text-prime-accent transition-colors line-clamp-2">{art.title}</h3>
                                        <p className="text-gray-500 text-sm mt-3 line-clamp-2 leading-relaxed">{art.summary}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. CATEGORY BLOCKS (The Scale Factor) */}
                <div className="space-y-24 mt-32">
                    {Object.entries(categories).map(([cat, articles]) => (
                        <section key={cat} className="relative">
                            <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                                <h2 className="text-4xl font-black italic tracking-tighter uppercase">{cat} <span className="text-prime-accent font-normal not-italic tracking-normal">Network</span></h2>
                                <button onClick={() => navigate(`/category/${cat}`)} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-prime-accent transition-colors flex items-center gap-2">
                                    Full Archive <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {articles.map((art, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => navigate(`/article/${art.slug || art.id}`)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="aspect-square rounded-3xl overflow-hidden mb-5 bg-prime-navy border border-white/5 relative">
                                            <img src={art.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-prime-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="px-1">
                                            <h4 className="font-bold text-sm leading-tight group-hover:text-prime-accent transition-colors line-clamp-2">{art.title}</h4>
                                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2 block">{art.source}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* 5. ELITE SCALE FOOTER */}
                <section className="mt-40 p-16 lg:p-24 rounded-[5rem] bg-gradient-to-tr from-prime-accent/20 via-prime-glow/5 to-transparent border border-white/10 text-center relative overflow-hidden group">
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-prime-accent/20 rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <SparklesIcon className="w-12 h-12 text-prime-accent mx-auto mb-8 animate-pulse" />
                        <h2 className="text-5xl lg:text-7xl font-black tracking-tighter mb-8 max-w-4xl mx-auto leading-none">Global Intelligence, <span className="text-shadow-glow">Fully Automated.</span></h2>
                        <p className="text-gray-400 max-w-xl mx-auto mb-12 text-lg lg:text-xl font-medium">Processing 10,000+ reports across 40 neural channels daily.</p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                            <input type="email" placeholder="access-key@prime.ai" className="w-full bg-prime-dark/50 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:border-prime-accent outline-none transition-all placeholder:text-gray-700" />
                            <button className="w-full md:w-auto bg-prime-accent text-prime-dark font-black px-10 py-5 rounded-2xl uppercase text-xs tracking-[0.2em] hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-prime-accent/20">Grant Access</button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default NewsPortal;
