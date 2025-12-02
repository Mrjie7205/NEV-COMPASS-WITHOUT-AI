
import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import CarLibrary from './components/CarLibrary';
import SmartSelector from './components/SmartSelector';
import MarketAnalysis from './components/MarketAnalysis';
import KnowledgeBase from './components/KnowledgeBase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  // Signal to reset CarLibrary view without unmounting
  const [resetSignal, setResetSignal] = useState(0);

  const handleSetTab = (tab: string) => {
    // If clicking the active 'home' tab again, trigger the reset signal in CarLibrary
    if (tab === 'home' && activeTab === 'home') {
        setResetSignal(prev => prev + 1);
        // We do NOT scroll to top here, allowing CarLibrary to restore its scroll position
    } else {
        // For normal tab switching, scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 overflow-hidden text-white shadow-xl mb-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">发现你的下一台<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">梦想座驾</span></h1>
                    <p className="text-slate-300 text-lg mb-8">汇集全网热门新能源车型，提供专业的参数对比与智能选车建议，助你做出明智决策。</p>
                    <button onClick={() => setActiveTab('advisor')} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-full font-semibold transition-colors shadow-lg shadow-cyan-500/30">
                        开始智能选车
                    </button>
                </div>
            </div>

            <CarLibrary resetSignal={resetSignal} />
          </div>
        );
      case 'analysis':
        return (
            <div className="animate-fadeIn">
                <MarketAnalysis />
            </div>
        );
      case 'knowledge':
        return (
            <div className="animate-fadeIn">
                <KnowledgeBase />
            </div>
        );
      case 'advisor':
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            {/* Direct render of SmartSelector without toggle */}
            <SmartSelector />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar currentTab={activeTab} setTab={handleSetTab} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
        <footer className="bg-white border-t border-slate-200 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
                <p>© 2024 EV Compass 新能源指南.</p>
            </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
