import React from 'react';
import { Zap, BookOpen, MessageSquareText, BarChart3, Calculator } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab }) => {
  const navItems = [
    { id: 'home', label: '车型库', icon: <Zap size={20} /> },
    { id: 'analysis', label: '市场分析', icon: <BarChart3 size={20} /> },
    { id: 'knowledge', label: '知识百科', icon: <BookOpen size={20} /> },
    { id: 'advisor', label: '智能选车', icon: <Calculator size={20} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setTab('home')}>
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mr-2">
                <Zap className="text-white" size={20} fill="white" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">新能源<span className="text-cyan-600">指南</span></span>
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentTab === item.id
                    ? 'text-cyan-600 bg-cyan-50'
                    : 'text-slate-600 hover:text-cyan-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Menu Button (Simplified) */}
          <div className="md:hidden flex items-center">
             <div className="flex space-x-4">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        className={`p-2 rounded-full ${currentTab === item.id ? 'text-cyan-600 bg-cyan-50' : 'text-slate-500'}`}
                    >
                        {item.icon}
                    </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;