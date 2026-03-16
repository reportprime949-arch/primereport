import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CpuChipIcon, 
  BoltIcon, 
  ChartPieIcon, 
  CheckCircleIcon,
  ServerIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const tokenUsageData = [
  { time: '10:00', tokens: 1200 },
  { time: '11:00', tokens: 1800 },
  { time: '12:00', tokens: 1500 },
  { time: '13:00', tokens: 2800 },
  { time: '14:00', tokens: 2100 },
  { time: '15:00', tokens: 3400 },
  { time: '16:00', tokens: 2900 },
];

const AIEngine = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are PrimeReport AI, a world-class news editor. Rewrite news articles with maximum objectivity and SEO optimization.'
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Neural Core</h1>
          <p className="text-gray-400 mt-1">Configure the intelligence engine and monitor computational load.</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-prime-accent/10 border border-prime-accent/20">
          <div className="w-2 h-2 rounded-full bg-prime-accent animate-pulse" />
          <span className="text-xs font-bold text-prime-accent uppercase tracking-widest">Core Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-[32px] space-y-8">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <BoltIcon className="w-6 h-6 text-yellow-500" />
              <span>Model Parameters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Operational Model</label>
                <select 
                  value={config.model}
                  onChange={(e) => setConfig({...config, model: e.target.value})}
                  className="w-full bg-prime-dark/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-prime-accent transition-all appearance-none"
                >
                  <option value="gpt-4-turbo">GPT-4 Turbo (Proprietary)</option>
                  <option value="claude-3-opus">Claude 3 Opus (Logical)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Multimodal)</option>
                  <option value="llama-3-70b">Llama 3 70B (Open Source)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right block">Creativity Index (Temp: {config.temperature})</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={config.temperature}
                  onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-prime-navy rounded-lg appearance-none cursor-pointer accent-prime-accent"
                />
                <div className="flex justify-between text-[10px] text-gray-600 font-bold">
                  <span>DETERMINISTIC</span>
                  <span>RANDOM</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Protocol (Core Instruction)</label>
              <textarea 
                rows="4"
                value={config.systemPrompt}
                onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                className="w-full bg-prime-dark/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-prime-accent transition-all resize-none font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="relative overflow-hidden px-10 py-4 bg-prime-accent text-prime-dark font-black rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] active:scale-95 disabled:opacity-50"
              >
                <AnimatePresence mode="wait">
                  {isSaving ? (
                    <motion.div 
                      key="saving"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span>UPDATING CORE...</span>
                    </motion.div>
                  ) : (
                    <motion.span 
                      key="save"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                    >
                      SAVE CONFIGURATION
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar/Stats */}
        <div className="space-y-6">
          {/* Token Usage Chart */}
          <div className="glass-card p-6 rounded-[32px] relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
              <ChartPieIcon className="w-5 h-5 text-prime-glow" />
              <span>Computational Load</span>
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tokenUsageData}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#aa3bff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a1330', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="tokens" stroke="#aa3bff" fillOpacity={1} fill="url(#colorTokens)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold uppercase">Peak Usage</span>
              <span className="text-white font-bold">3,400 t/hr</span>
            </div>
          </div>

          {/* Engine Status */}
          <div className="glass-card p-6 rounded-[32px] space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <ServerIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">API Endpoint</span>
                </div>
                <span className="text-xs font-bold text-emerald-500">STABLE</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <CommandLineIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Latent Delay</span>
                </div>
                <span className="text-xs font-bold text-white">420ms</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <CpuChipIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Memory Load</span>
                </div>
                <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-prime-accent h-full w-[65%]" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIEngine;
