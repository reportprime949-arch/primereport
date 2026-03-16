import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GlobeAltIcon, 
  PhotoIcon, 
  UserIcon, 
  EnvelopeIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Configuration</h1>
          <p className="text-gray-400 mt-1">Foundational settings for the PrimeReport global ecosystem.</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-prime-accent text-prime-dark font-black rounded-2xl transition-all hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] active:scale-95"
        >
          {isSaving ? 'SYNCHRONIZING...' : 'SAVE ALL CHANGES'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* General Settings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 rounded-[40px] space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-3">
              <GlobeAltIcon className="w-6 h-6 text-prime-accent" />
              <span>Platform Identity</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Network Name</label>
                <input 
                  type="text" 
                  defaultValue="PrimeReport Global"
                  className="w-full bg-prime-navy/30 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-prime-accent transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Contact Channel</label>
                <input 
                  type="email" 
                  defaultValue="ops@primereport-news.netlify.app"
                  className="w-full bg-prime-navy/30 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-prime-accent transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Platform Branding</label>
              <div className="border-2 border-dashed border-white/10 rounded-[32px] p-10 flex flex-col items-center justify-center space-y-4 hover:border-prime-accent/30 transition-colors cursor-pointer group">
                <div className="p-4 rounded-full bg-prime-navy/50 text-prime-accent group-hover:scale-110 transition-transform">
                  <CloudArrowUpIcon className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">Upload New Logo Asset</p>
                  <p className="text-xs text-gray-500 mt-1">Vector SVG or transparent PNG preferred (Max 5MB)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[40px] space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-3">
              <ShieldCheckIcon className="w-6 h-6 text-emerald-500" />
              <span>Security Protocols</span>
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Two-Factor Authentication', desc: 'Secure admin accounts with biometric verification.' },
                { label: 'AI Integrity Audit', desc: 'Automatically scan all AI rewrites for factual consistency.' },
                { label: 'Real-time Threat Monitoring', desc: 'Active defense against DDoS and scraping bots.' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="w-12 h-6 bg-prime-accent/20 rounded-full relative p-1 cursor-pointer">
                    <div className="w-4 h-4 bg-prime-accent rounded-full neon-accent translate-x-6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-[40px] bg-gradient-to-br from-prime-glow/10 to-transparent">
            <h3 className="text-lg font-bold text-white mb-6">Automation Core</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Sync Frequency</label>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-black text-white">5</span>
                  <span className="text-sm font-bold text-gray-400">MINUTES</span>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-prime-glow h-full w-[20%]" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Default AI Voice</label>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <UserIcon className="w-5 h-5 text-prime-accent" />
                  <span className="text-sm font-medium text-white">Apex Professional</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[40px] border-prime-glow/20">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Internal Version</p>
            <p className="text-3xl font-black text-white opacity-20">v.4.8.2-OMEGA</p>
            <div className="mt-8 flex items-center space-x-2 text-xs font-bold text-prime-accent">
              <span className="animate-pulse">●</span>
              <span>LATEST STABLE BUILD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-[200] flex items-center space-x-3 px-6 py-4 glass-card border-prime-accent/50 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.3)]"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Configuration Synchronized</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">All system nodes updated</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
