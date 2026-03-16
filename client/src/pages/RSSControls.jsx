import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RssIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  PlusIcon,
  TrashIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

import { adminApi } from '../lib/api';

const RSSControls = () => {
  const [feeds, setFeeds] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getRssFeeds();
      setFeeds(data);
    } catch (err) {
      console.error("Failed to fetch feeds:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFeeds();
  }, []);

  const startSync = async () => {
    setIsSyncing(true);
    setSyncProgress(20);
    try {
      const { data } = await adminApi.syncRss();
      setSyncProgress(100);
      alert(`Sync Complete! Added ${data.count} new articles.`);
      setTimeout(() => setIsSyncing(false), 2000);
    } catch (err) {
      alert("Sync failed");
      setIsSyncing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RSS Automation</h1>
          <p className="text-gray-400 mt-1">Configure and monitor global news streams.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={startSync}
            disabled={isSyncing}
            className={`
              flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all
              ${isSyncing 
                ? 'bg-prime-glow/20 text-prime-glow cursor-wait' 
                : 'bg-prime-glow text-white hover:shadow-[0_0_20px_rgba(170,59,255,0.4)] active:scale-95'}
            `}
          >
            <ArrowPathIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? `Scanning Streams (${syncProgress}%)` : 'Fetch All Now'}</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-2.5 glass-card rounded-xl font-bold text-sm text-prime-accent hover:bg-white/5 transition-all">
            <PlusIcon className="w-5 h-5" />
            <span>Add Feed</span>
          </button>
        </div>
      </div>

      {/* Sync Progress Bar */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-prime-navy/30 p-1 rounded-full border border-white/5 relative h-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${syncProgress}%` }}
                className="h-full bg-gradient-to-r from-prime-accent to-prime-glow rounded-full neon-glow shadow-[0_0_10px_#00f2ff]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
           <div className="lg:col-span-2 text-center py-20 text-gray-500">
             <div className="flex flex-col items-center space-y-3">
               <ArrowPathIcon className="w-10 h-10 animate-spin text-prime-glow" />
               <span className="text-lg font-bold">Establishing Secure Stream Connection...</span>
             </div>
           </div>
        ) : (feeds || []).map((feed) => (
          <motion.div 
            key={feed.id}
            whileHover={{ scale: 1.01 }}
            className="glass-card p-6 rounded-3xl relative group overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br transition-opacity opacity-5 group-hover:opacity-10 ${feed.status === 'Healthy' ? 'from-emerald-500' : 'from-red-500'}`} />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl bg-prime-navy/50 border border-white/10 ${feed.status === 'Healthy' ? 'text-emerald-500' : 'text-red-500'}`}>
                  <RssIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{feed.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <GlobeAltIcon className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{feed.url}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${feed.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                  {feed.status === 'Healthy' ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationCircleIcon className="w-3 h-3" />}
                  <span>{feed.status}</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-2 font-medium">LATEST SYNC: {feed.lastSync}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">Items Cached</span>
                <span className="text-lg font-bold text-white mt-1">{feed.items}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">Avg Refresh</span>
                <span className="text-lg font-bold text-white mt-1">5m 12s</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">AI Success</span>
                <span className="text-lg font-bold text-emerald-500 mt-1">98%</span>
              </div>
            </div>

            {feed.error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2">
                <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">{feed.error}</span>
              </div>
            )}

            <div className="absolute bottom-6 right-6 flex space-x-2 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
               <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <PlusIcon className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RSSControls;
