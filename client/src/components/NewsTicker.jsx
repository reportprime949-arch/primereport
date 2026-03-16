import React from 'react';
import { motion } from 'framer-motion';
import { BoltIcon } from '@heroicons/react/24/solid';

const NewsTicker = ({ news = [] }) => {
  if (!news || news.length === 0) return null;

  return (
    <div className="bg-prime-navy/80 backdrop-blur-md border-y border-white/5 py-3 relative overflow-hidden">
      <div className="container mx-auto flex items-center">
        <div className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center space-x-1 z-10 mr-4 shadow-lg shadow-red-600/20">
          <BoltIcon className="w-3 h-3" />
          <span>Breaking</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative h-6">
          <motion.div 
            animate={{ x: [0, -2000] }}
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="flex items-center space-x-12 whitespace-nowrap absolute left-0"
          >
            {news.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3 group cursor-pointer">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{item.source || 'News'} —</span>
                <span className="text-white text-sm font-medium group-hover:text-prime-accent transition-colors">
                  {item.title}
                </span>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {news.map((item, idx) => (
              <div key={`dup-${idx}`} className="flex items-center space-x-12 whitespace-nowrap">
                 <div className="flex items-center space-x-3 group cursor-pointer">
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{item.source || 'News'} —</span>
                  <span className="text-white text-sm font-medium group-hover:text-prime-accent transition-colors">
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-prime-navy/80 to-transparent z-10" />
      <div className="absolute inset-y-0 left-[110px] w-20 bg-gradient-to-r from-prime-navy/80 to-transparent z-10" />
    </div>
  );
};

export default NewsTicker;
