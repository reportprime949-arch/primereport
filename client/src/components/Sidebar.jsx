import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon, 
  GlobeAltIcon,
  CpuChipIcon,
  SparklesIcon,
  ChartBarSquareIcon,
  TrophyIcon,
  ChartBarIcon, 
  Cog6ToothIcon, 
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { name: 'Portal', icon: HomeIcon, path: '/' },
  { name: 'World', icon: GlobeAltIcon, path: '/category/world' },
  { name: 'Tech', icon: CpuChipIcon, path: '/category/technology' },
  { name: 'AI', icon: SparklesIcon, path: '/category/ai' },
  { name: 'Biz', icon: ChartBarSquareIcon, path: '/category/business' },
  { name: 'Sports', icon: TrophyIcon, path: '/category/sports' },
  { name: 'Admin', icon: ChartBarIcon, path: '/admin' },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="h-screen glass-card border-r-0 relative flex flex-col transition-all duration-300 ease-in-out z-50"
    >
      <div className="p-6 flex items-center justify-between overflow-hidden">
        {!isCollapsed && (
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold bg-gradient-to-r from-prime-accent to-prime-glow bg-clip-text text-transparent whitespace-nowrap"
          >
            PrimeReport
          </motion.h1>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-prime-navy/50 hover:bg-prime-glow/20 text-prime-accent transition-colors"
        >
          {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center p-3 rounded-xl transition-all duration-200 group relative
              ${isActive 
                ? 'bg-prime-glow/20 text-white neon-glow' 
                : 'text-gray-400 hover:bg-prime-navy/50 hover:text-prime-accent'}
            `}
          >
            <item.icon className="w-6 h-6 shrink-0" />
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ml-3 font-medium whitespace-nowrap"
              >
                {item.name}
              </motion.span>
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-prime-navy text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button className="flex items-center w-full p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors group relative">
          <ArrowLeftOnRectangleIcon className="w-6 h-6 shrink-0" />
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 font-medium"
            >
              Logout
            </motion.span>
          )}
          {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-prime-navy text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            )}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
