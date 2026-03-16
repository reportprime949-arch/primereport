import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

const AnimatedNumber = ({ value }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => 
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer"
    >
      {/* Background Icon Glow */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity ${color}`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">
            <AnimatedNumber value={value} />
          </h3>
          {trend && (
            <div className={`mt-2 text-xs font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last week
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-opacity-20 ${color} bg-current`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
