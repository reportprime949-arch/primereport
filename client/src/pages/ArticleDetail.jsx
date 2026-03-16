import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { newsApi } from '../lib/api';
import { 
    ChevronLeftIcon, 
    CalendarIcon, 
    UserIcon, 
    ShareIcon,
    ArrowUpRightIcon 
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [artRes, relatedRes] = await Promise.all([
                    newsApi.getArticle(id),
                    newsApi.getRelatedArticles(id)
                ]);
                
                setArticle(artRes.data);
                setRelated(relatedRes.data);
                
                if (artRes.data) {
                    document.title = `${artRes.data.title} | PrimeReport`;
                    injectSchema(artRes.data);
                    window.scrollTo(0, 0);
                }
            } catch (err) {
                console.error("Failed to fetch article data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        return () => {
            const oldSchema = document.getElementById('article-schema');
            if (oldSchema) oldSchema.remove();
        };
    }, [id]);

    const injectSchema = (data) => {
        const oldSchema = document.getElementById('article-schema');
        if (oldSchema) oldSchema.remove();

        const schema = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": data.title,
            "image": [data.image],
            "datePublished": data.publishedAt || new Date().toISOString(),
            "dateModified": data.updatedAt || data.publishedAt || new Date().toISOString(),
            "author": { "@type": "Organization", "name": "PrimeReport" },
            "publisher": {
                "@type": "Organization",
                "name": "PrimeReport",
                "logo": { "@type": "ImageObject", "url": `${window.location.origin}/logo.png` }
            },
            "description": data.summary,
            "mainEntityOfPage": { "@type": "WebPage", "@id": window.location.href }
        };

        const script = document.createElement('script');
        script.id = 'article-schema';
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
    };

    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(article?.title || "");

    const sharePlatforms = [
        { name: 'X', url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`, color: 'bg-black' },
        { name: 'FB', url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, color: 'bg-[#1877F2]' },
        { name: 'LI', url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, color: 'bg-[#0A66C2]' },
        { name: 'WA', url: `https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`, color: 'bg-[#25D366]' }
    ];

    if (loading) return (
        <div className="min-h-screen bg-prime-dark flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-prime-accent/20 border-t-prime-accent rounded-full animate-spin" />
        </div>
    );

    if (!article) return (
        <div className="min-h-screen bg-prime-dark flex items-center justify-center">
            <div className="text-center space-y-6">
                <h2 className="text-3xl font-black italic">Intelligence Null.</h2>
                <Link to="/" className="text-prime-accent font-bold uppercase tracking-widest text-xs hover:underline">Exit to Portal</Link>
            </div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-prime-dark text-white pb-32">
            <div className="container mx-auto px-4 py-12">
                
                <header className="max-w-5xl mx-auto mb-16 space-y-10">
                    <Link to="/" className="inline-flex items-center space-x-2 text-gray-500 hover:text-prime-accent transition-colors group">
                        <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Exit</span>
                    </Link>

                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <span className="bg-prime-accent/10 border border-prime-accent/20 text-prime-accent px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {article.category} Report
                            </span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{article.source}</span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black leading-tight tracking-tighter">
                            {article.title}
                        </h1>
                        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/5">
                            <div className="flex items-center space-x-8 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center space-x-2">
                                    <CalendarIcon className="w-4 h-4 text-prime-accent" />
                                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <UserIcon className="w-4 h-4 text-prime-accent" />
                                    <span>Verified Analyst</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {sharePlatforms.map(p => (
                                    <a key={p.name} href={p.url} target="_blank" rel="noreferrer" className={`w-10 h-10 ${p.color} rounded-xl flex items-center justify-center transition-all hover:scale-110 shadow-xl border border-white/10`}>
                                        <span className="text-[10px] font-black">{p.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="aspect-video w-full rounded-[3rem] overflow-hidden border border-white/5 bg-prime-navy shadow-2xl relative group">
                        <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-prime-dark/40 to-transparent" />
                    </div>
                </header>

                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* Main Content */}
                        <div className="lg:col-span-8">
                            <div 
                                className="prose prose-invert prose-prime max-w-none text-gray-300 leading-relaxed text-lg
                                prose-h2:text-2xl prose-h2:font-black prose-h2:text-white prose-h2:mt-12 prose-h2:mb-6 prose-h2:tracking-tight
                                prose-p:mb-6 prose-li:text-gray-400 prose-a:text-prime-accent prose-a:no-underline hover:prose-a:underline font-medium"
                                dangerouslySetInnerHTML={{ __html: article.content || article.summary }}
                            />
                            
                            <div className="mt-20 p-10 rounded-[2.5rem] bg-gradient-to-br from-prime-navy/50 to-transparent border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-prime-accent/5 blur-[60px]" />
                                <h3 className="text-xl font-black text-prime-accent mb-4 relative z-10">Intelligence Disclosure</h3>
                                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                                    This report was synthesized by our global intelligence network. All data is verified for accuracy using multiple decentralized channels. 
                                    Internal link analysis and entity recognition are active.
                                </p>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="lg:col-span-4 space-y-12">
                            <div className="glass-card p-8 rounded-[2rem] border border-white/5 space-y-6 sticky top-8">
                                <h4 className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-500">Source Protocol</h4>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <span className="text-[10px] text-gray-500 block mb-1">Direct Feed From</span>
                                    <p className="font-black text-prime-accent">{article.source}</p>
                                </div>
                                <a 
                                    href={article.link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center justify-center space-x-3 w-full py-5 bg-prime-accent text-prime-dark font-black rounded-2xl text-[10px] tracking-widest transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-prime-accent/20"
                                >
                                    <span>READ ORIGINAL</span>
                                    <ArrowUpRightIcon className="w-4 h-4" />
                                </a>
                            </div>
                        </aside>
                    </div>

                    {/* Related Articles Section */}
                    {related.length > 0 && (
                        <section className="mt-32 pt-20 border-t border-white/5">
                            <h2 className="text-3xl font-black italic mb-12 tracking-tighter">Related <span className="text-prime-accent text-shadow-glow">Briefings.</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {related.map((art, idx) => (
                                    <motion.div 
                                        key={idx} 
                                        whileHover={{ y: -5 }}
                                        onClick={() => navigate(`/article/${art.slug || art.id}`)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="aspect-[16/10] rounded-3xl overflow-hidden mb-6 bg-prime-navy border border-white/5">
                                            <img src={art.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <h4 className="font-bold text-sm leading-snug group-hover:text-prime-accent transition-colors line-clamp-2">{art.title}</h4>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ArticleDetail;
