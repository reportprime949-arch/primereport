import React from 'react';
import { motion } from 'framer-motion';
import { 
  NewspaperIcon, 
  EyeIcon, 
  ArrowPathIcon, 
  SparklesIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import StatCard from '../components/StatCard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const trafficData = [
  { name: '00:00', views: 4000 },
  { name: '04:00', views: 3000 },
  { name: '08:00', views: 2000 },
  { name: '12:00', views: 2780 },
  { name: '16:00', views: 1890 },
  { name: '20:00', views: 2390 },
  { name: '23:59', views: 3490 },
];

const categoryData = [
  { name: 'Technology', value: 400 },
  { name: 'Finance', value: 300 },
  { name: 'Geopolitics', value: 300 },
  { name: 'Science', value: 200 },
];

const COLORS = ['#00f2ff', '#aa3bff', '#f43f5e', '#fbbf24'];

const RSS_STATUS_DATA = [
  { name: 'BBC', status: 100 },
  { name: 'CNN', status: 85 },
  { name: 'Reuters', status: 95 },
  { name: 'AP', status: 60 },
];

import { adminApi } from '../lib/api';

const Dashboard = () => {
  const [stats, setStats] = React.useState({
    totalArticles: 0,
    totalViews: 0,
    rssImports: 0,
    dailyArticles: 0,
    breakingNews: 0
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await adminApi.getStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Intelligence Overview</h1>
          <p className="text-gray-400 mt-1">Global AI News Engine Monitoring System</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-5 py-2.5 glass-card rounded-xl text-sm font-medium hover:bg-white/5 transition-all active:scale-95">
            System Logs
          </button>
          <button className="px-5 py-2.5 bg-prime-glow/20 border border-prime-glow/30 text-white rounded-xl text-sm font-medium hover:bg-prime-glow/30 transition-all neon-glow active:scale-95">
            Optimize AI Engine
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Articles" 
          value={stats.totalArticles} 
          icon={NewspaperIcon} 
          color="text-blue-500"
          trend={12}
        />
        <StatCard 
          title="Total Views" 
          value={stats.totalViews} 
          icon={EyeIcon} 
          color="text-emerald-500"
          trend={5.4}
        />
        <StatCard 
          title="RSS Imports" 
          value={stats.rssImports} 
          icon={ArrowPathIcon} 
          color="text-purple-500"
          trend={-2.1}
        />
        <StatCard 
          title="Breaking News" 
          value={stats.breakingNews} 
          icon={SparklesIcon} 
          color="text-prime-accent"
          trend={18.5}
        />
        <StatCard 
          title="Daily Articles" 
          value={stats.dailyArticles} 
          icon={ChartBarIcon} 
          color="text-rose-500"
          trend={24}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Traffic Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Platform Traffic Intensity</h3>
            <select className="bg-prime-navy/50 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-400 focus:outline-none">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a1330', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#00f2ff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#00f2ff" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold text-white mb-2 self-start">Contextual Reach</h3>
          <p className="text-gray-400 text-xs mb-8 self-start">Article distribution by AI category</p>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: '#0a1330', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">1,242</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Scope</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-4">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-[10px] text-gray-400 font-medium uppercase truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RSS Feed Status Bar Chart */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-xl font-bold text-white mb-6">RSS Stream Integrity</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={RSS_STATUS_DATA}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                 contentStyle={{ 
                  backgroundColor: '#0a1330', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}
              />
              <Bar 
                dataKey="status" 
                radius={[10, 10, 0, 0]}
              >
                {RSS_STATUS_DATA.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.status > 80 ? '#10b981' : entry.status > 50 ? '#fbbf24' : '#f43f5e'} 
                    fillOpacity={0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
