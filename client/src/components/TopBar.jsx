import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  SunIcon, 
  MoonIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

const TopBar = () => {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className="h-20 glass-card border-b-0 border-l-0 px-8 flex items-center justify-between z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-prime-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search PrimeReport Intelligence..."
            className="w-full bg-prime-navy/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-prime-accent/50 focus:ring-1 focus:ring-prime-accent/50 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6">
        {/* Live RSS Status */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live RSS Sync</span>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg bg-prime-navy/50 text-gray-400 hover:text-prime-accent transition-colors"
        >
          {isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-lg bg-prime-navy/50 text-gray-400 hover:text-prime-accent transition-colors relative">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-prime-glow rounded-full neon-glow" />
          </button>
        </div>

        {/* Profile */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-3 p-1 rounded-xl hover:bg-white/5 transition-colors focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-prime-accent to-prime-glow p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-prime-dark flex items-center justify-center overflow-hidden">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-white">Alex Rivera</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Super Admin</p>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </Menu.Button>

          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 glass-card rounded-xl py-1 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button className={`${active ? 'bg-white/5' : ''} flex w-full items-center px-4 py-2 text-sm text-gray-300`}>
                    My Profile
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button className={`${active ? 'bg-white/5' : ''} flex w-full items-center px-4 py-2 text-sm text-gray-300`}>
                    Account Settings
                  </button>
                )}
              </Menu.Item>
              <div className="h-[1px] bg-white/10 my-1" />
              <Menu.Item>
                {({ active }) => (
                  <button className={`${active ? 'bg-white/5' : ''} flex w-full items-center px-4 py-2 text-sm text-red-400`}>
                    Sign Out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};

export default TopBar;
