import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MegaphoneIcon, 
  CodeBracketIcon, 
  EyeIcon, 
  ChevronRightIcon,
  LayoutIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';

const adPlacements = [
  { id: 'header', name: 'Header Leaderboard', size: '728x90', icon: RectangleGroupIcon },
  { id: 'sidebar', name: 'Sidebar Skyscraper', size: '300x600', icon: RectangleStackIcon },
  { id: 'article', name: 'In-Article Banner', size: '600x250', icon: QueueListIcon },
  { id: 'footer', name: 'Footer Anchor', size: '970x90', icon: RectangleGroupIcon },
];

const Advertisements = () => {
  const [selectedPlacement, setSelectedPlacement] = useState(adPlacements[0]);
  const [adCode, setAdCode] = useState('<div style="background: linear-gradient(45deg, #0a1330, #050a1a); color: #00f2ff; padding: 20px; border: 1px solid #00f2ff33; border-radius: 12px; text-align: center; font-family: sans-serif;">\n  <h3 style="margin: 0; font-size: 18px;">PrimeReport Premium</h3>\n  <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.7;">Subscribe for AI-Powered Insights</p>\n</div>');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Revenue Operations</h1>
        <p className="text-gray-400 mt-1">Manage global advertisement placements and dynamic HTML injections.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Placement Selector */}
        <div className="xl:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Select Active Slot</h3>
          <div className="space-y-3">
            {adPlacements.map((placement) => (
              <button
                key={placement.id}
                onClick={() => setSelectedPlacement(placement)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-2xl transition-all border
                  ${selectedPlacement.id === placement.id 
                    ? 'glass-card border-prime-accent/50 bg-prime-accent/10' 
                    : 'bg-prime-navy/20 border-white/5 hover:border-white/10 text-gray-400 hover:text-white'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <placement.icon className={`w-6 h-6 ${selectedPlacement.id === placement.id ? 'text-prime-accent' : ''}`} />
                  <div className="text-left">
                    <p className={`text-sm font-bold ${selectedPlacement.id === placement.id ? 'text-white' : ''}`}>{placement.name}</p>
                    <p className="text-[10px] uppercase font-bold opacity-50">{placement.size}</p>
                  </div>
                </div>
                <ChevronRightIcon className={`w-4 h-4 transition-transform ${selectedPlacement.id === placement.id ? 'rotate-90 text-prime-accent' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Editor & Preview */}
        <div className="xl:col-span-8 space-y-6">
          <div className="glass-card rounded-[32px] overflow-hidden flex flex-col h-[600px]">
            {/* Tabs */}
            <div className="flex items-center bg-white/5 p-2">
              <button className="flex items-center space-x-2 px-6 py-3 bg-prime-dark border border-white/10 rounded-xl text-sm font-bold text-white">
                <CodeBracketIcon className="w-5 h-5 text-prime-accent" />
                <span>HTML Engine</span>
              </button>
              <div className="flex-1" />
              <button className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors">
                Templates
              </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative flex flex-col md:flex-row divide-x divide-white/5 overflow-hidden">
               {/* Code Editor */}
               <div className="flex-1 bg-prime-dark/30 p-6 overflow-hidden">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 block">Source Injection</label>
                  <textarea 
                    value={adCode}
                    onChange={(e) => setAdCode(e.target.value)}
                    className="w-full h-[calc(100%-40px)] bg-transparent border-none text-white focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed resize-none no-scrollbar"
                    placeholder="Enter HTML/Script code here..."
                  />
               </div>

               {/* Live Preview */}
               <div className="flex-1 bg-prime-dark p-6 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Real-time Visualizer</label>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Render</span>
                    </div>
                  </div>
                  <div className="flex-1 glass-card border-dashed border-white/20 rounded-2xl p-4 flex items-center justify-center overflow-auto bg-grid-slate-100/[0.03]">
                    <div 
                      className="max-w-full"
                      dangerouslySetInnerHTML={{ __html: adCode }}
                    />
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md">
                   <span className="text-[10px] font-bold text-amber-500">OPTIMIZING FOR MOBILE</span>
                </div>
              </div>
              <button className="px-10 py-3 bg-prime-glow text-white font-bold rounded-2xl transition-all hover:shadow-[0_0_20px_rgba(170,59,255,0.4)] active:scale-95">
                DEPLOY TO PRODUCTION
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Advertisements;
