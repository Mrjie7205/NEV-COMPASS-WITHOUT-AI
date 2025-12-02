import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, Legend, Cell, LineChart, Line } from 'recharts';
import { CAR_DATABASE } from '../constants';
import { CarModel, PowerType, Brand, CarType } from '../types';
import { ChevronDown, ChevronUp, Car, Zap, Shield, Map as MapIcon, Gauge, Rocket, Timer, Armchair, Leaf, TrendingUp } from 'lucide-react';

const MarketAnalysis: React.FC = () => {
  
  // Range Chart State
  const [visibleSeries, setVisibleSeries] = useState<PowerType[]>([
      PowerType.BEV, 
      PowerType.REEV, 
      PowerType.PHEV
  ]);

  // State for Ladder Map expansion
  const [expandedLadder, setExpandedLadder] = useState<{level: string, brand: string} | null>(null);
  const [expandedPerfLadder, setExpandedPerfLadder] = useState<{level: string, brand: string} | null>(null);

  const toggleSeries = (type: PowerType) => {
      setVisibleSeries(prev => {
          if (prev.includes(type)) {
              if (prev.length === 1 && prev[0] === type) return [];
              return prev.filter(t => t !== type);
          } else {
              return [...prev, type];
          }
      });
  };

  // Robust Deduplication
  const uniqueCarsMap = new Map<string, CarModel>();
  CAR_DATABASE.forEach(car => {
      if (!uniqueCarsMap.has(car.id)) {
          uniqueCarsMap.set(car.id, car);
      }
  });

  const uniqueData = Array.from(uniqueCarsMap.values()).filter(car => car.priceRange[0] <= 50);

  // --- JITTER LOGIC ---
  const getDeterministicOffset = (seed: string, scale: number) => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
          hash = ((hash << 5) - hash) + seed.charCodeAt(i);
          hash |= 0; 
      }
      const normalized = (Math.abs(hash) % 100) / 50 - 1; // -1 to 1
      return normalized * scale;
  };

  // --- DATA PROCESSING FOR RANGE CHART ---
  const rangeChartData = uniqueData
      .filter(car => visibleSeries.includes(car.power))
      // EXCLUDE PHEVs with low range (likely Pure Electric Range data, e.g. < 400km)
      // to avoid skewing the chart which mostly shows combined range for hybrids
      .filter(car => {
          if (car.power === PowerType.PHEV && car.range < 400) return false;
          return true;
      })
      .map(car => ({ 
          ...car, 
          // Jitter X by +/- 0.3 wan, Y by +/- 5 km
          x: (car.priceRange[0] + car.priceRange[1]) / 2 + getDeterministicOffset(car.id + 'rx', 0.3), 
          y: car.range + getDeterministicOffset(car.id + 'ry', 5), 
          z: 1 
      }));

  const getPowerColor = (power: PowerType) => {
      switch (power) {
          case PowerType.BEV: return '#06b6d4';
          case PowerType.REEV: return '#10b981';
          case PowerType.PHEV: return '#f59e0b';
          default: return '#94a3b8';
      }
  };

  // --- AXIS CALCULATION HELPERS ---
  const calculateNiceDomain = (data: number[], step: number, padMin: number = 0, padMax: number = 0) => {
      if (data.length === 0) return { domain: [0, 100], ticks: [0, 100] };
      
      const minVal = Math.min(...data);
      const maxVal = Math.max(...data);

      const domainMin = Math.max(0, Math.floor((minVal - padMin) / step) * step);
      const domainMax = Math.ceil((maxVal + padMax) / step) * step;

      const ticks = [];
      for (let i = domainMin; i <= domainMax; i += step) {
          ticks.push(i);
      }
      return { domain: [domainMin, domainMax], ticks };
  };

  // 1. Range Chart Axes
  const { domain: rangeYDomain, ticks: rangeYTicks } = useMemo(() => 
      calculateNiceDomain(rangeChartData.map(d => d.y), 200, 50, 50), 
  [rangeChartData]);

  const { domain: rangeXDomain, ticks: rangeXTicks } = useMemo(() => 
      calculateNiceDomain(rangeChartData.map(d => d.x), 10, 0, 5), 
  [rangeChartData]);


  // --- PENETRATION RATE DATA ---
  const PENETRATION_DATA = [
      { name: '2022', china: 25.6, global: 14, desc: '2022年实际值' },
      { name: '2023', china: 31.6, global: 18, desc: '2023年实际值' },
      { name: '2024', china: 40.9, global: 22, desc: '2024年实际值 (中国来自中汽协，全球来自IEA)' },
      { name: '2025H1(预)', china: 55, global: 24, desc: '基于已公布 2025Q1-Q2 渗透率与 IEA 年度预期的估算', isForecast: true },
      { name: '2025H2(预)', china: 65, global: 26, desc: '为使全年均值大致符合 IEA 对 2025 的">25%全球、约 60% 中国"的判断而做的估算', isForecast: true },
  ];

  // --- SMART DRIVING LADDER DATA ---
  const SMART_DRIVING_TIERS = [
      { id: 'City NOA', label: 'City NOA (城市领航)', desc: '城市+高速全场景领航，自动识别红绿灯、绕行障碍' },
      { id: 'High-Speed NOA', label: 'High-Speed NOA (高速领航)', desc: '高速/高架路段自动上下匝道、变道超车' },
      { id: 'L2+', label: 'L2+ (增强辅助)', desc: '支持打灯变道、自动泊车，部分支持循迹倒车' },
      { id: 'L2', label: 'L2 (基础辅助)', desc: 'ACC自适应巡航 + 车道保持，仅能跟随前车' }
  ];

  const ladderData = SMART_DRIVING_TIERS.map(tier => {
      const cars = uniqueData.filter(c => c.autonomousLevel === tier.id);
      const brandsSet = new Set(cars.map(c => c.brand));
      const brands = Array.from(brandsSet).map(brand => ({
          name: brand,
          cars: cars.filter(c => c.brand === brand)
      }));
      return { ...tier, brands, totalCars: cars.length };
  });

  const getLevelColor = (level: string) => {
      switch(level) {
          case 'City NOA': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'High-Speed NOA': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'L2+': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
          default: return 'bg-slate-50 text-slate-600 border-slate-200';
      }
  };

  const getLevelIcon = (level: string) => {
      switch(level) {
          case 'City NOA': return <MapIcon size={16} />;
          case 'High-Speed NOA': return <Gauge size={16} />;
          case 'L2+': return <Zap size={16} />;
          default: return <Shield size={16} />;
      }
  };

  // --- PERFORMANCE LADDER DATA ---
  const PERF_TIERS = [
      { id: '3s', label: '3秒俱乐部 (<4.0s)', desc: '超跑级性能，强烈推背感', range: [0, 3.99], icon: <Rocket size={16}/>, color: 'bg-red-100 text-red-700 border-red-200' },
      { id: '4s', label: '4秒高性能 (4.0-4.9s)', desc: '性能钢炮，超车随心所欲', range: [4.0, 4.99], icon: <Zap size={16}/>, color: 'bg-orange-100 text-orange-700 border-orange-200' },
      { id: '5s', label: '进阶动力 (5.0-6.9s)', desc: '动力充沛，偶尔激情', range: [5.0, 6.99], icon: <Timer size={16}/>, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      { id: '7s', label: '家用舒适 (≥7.0s)', desc: '平顺够用，经济实惠', range: [7.0, 100], icon: <Leaf size={16}/>, color: 'bg-green-100 text-green-700 border-green-200' }
  ];

  const perfLadderData = PERF_TIERS.map(tier => {
      const cars = uniqueData.filter(c => c.acceleration >= tier.range[0] && c.acceleration <= tier.range[1]);
      const brandsSet = new Set(cars.map(c => c.brand));
      const brands = Array.from(brandsSet).map(brand => ({
          name: brand,
          cars: cars.filter(c => c.brand === brand).sort((a,b) => a.acceleration - b.acceleration)
      }));
      return { ...tier, brands, totalCars: cars.length };
  });

  const RangeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload; 
      
      let colorClass = 'text-slate-600';
      if(d.power === PowerType.BEV) colorClass = 'text-cyan-600';
      if(d.power === PowerType.REEV) colorClass = 'text-emerald-600';
      if(d.power === PowerType.PHEV) colorClass = 'text-orange-600';

      const isHybrid = d.power !== PowerType.BEV;

      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-sm z-50">
          <p className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">{d.name}</p>
          <p className="text-slate-600">价格区间: <span className="font-semibold text-slate-900">{d.priceRange[0]}-{d.priceRange[1]}万</span></p>
          <p className="text-slate-600">
             {isHybrid ? '综合续航' : '纯电续航'}: <span className="font-semibold text-slate-900">{d.y.toFixed(0)}km</span>
          </p>
          <p className={`text-xs mt-1 font-medium ${colorClass}`}>{d.brand} | {d.power}</p>
          {isHybrid && <p className="text-[10px] text-slate-400 mt-1">(含燃油续航)</p>}
        </div>
      );
    }
    return null;
  };

  const PenetrationTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
              <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-lg text-sm z-50 max-w-[250px]">
                  <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
                  <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                          <span className="text-slate-500">中国 NEV 渗透率:</span>
                          <span className="font-bold text-cyan-600 text-base">{data.china}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-slate-500">全球 EV 渗透率:</span>
                          <span className="font-bold text-slate-600 text-base">{data.global}%</span>
                      </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 leading-tight">{data.desc}</p>
                  </div>
              </div>
          );
      }
      return null;
  }

  const renderRangeLegend = () => {
      const items = [
          { type: PowerType.BEV, color: '#06b6d4', shape: 'circle', label: '纯电 (BEV)' },
          { type: PowerType.REEV, color: '#10b981', shape: 'triangle', label: '增程 (REEV)' },
          { type: PowerType.PHEV, color: '#f59e0b', shape: 'square', label: '插混 (PHEV)' },
      ];

      return (
          <div className="flex flex-wrap justify-center gap-4 mb-4 select-none">
              {items.map((item) => {
                  const isVisible = visibleSeries.includes(item.type);
                  return (
                      <div 
                          key={item.type}
                          onClick={() => toggleSeries(item.type)}
                          className={`flex items-center cursor-pointer px-3 py-1.5 rounded-full border transition-all ${isVisible ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-transparent border-transparent opacity-60 grayscale'}`}
                      >
                          <div className={`w-4 h-4 flex items-center justify-center mr-2 rounded border ${isVisible ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-300'}`}>
                             {isVisible && <div className="w-2.5 h-2.5 bg-slate-600 rounded-sm"></div>}
                          </div>
                          
                          <span 
                            className="w-3 h-3 inline-block mr-2" 
                            style={{ 
                                backgroundColor: item.color, 
                                borderRadius: item.shape === 'circle' ? '50%' : item.shape === 'triangle' ? '0' : '2px',
                                clipPath: item.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
                            }}
                          ></span>
                          
                          <span className={`text-sm font-medium ${isVisible ? 'text-slate-700' : 'text-slate-400'}`}>
                              {item.label}
                          </span>
                      </div>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="space-y-8">
      {/* Chart 1: Range vs Price */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-2">
            <h2 className="text-xl font-bold text-slate-800">主流新能源车型续航-价格对比</h2>
            <p className="text-slate-500 text-sm mt-1">
                勾选下方图例可筛选特定动力类型。
            </p>
        </div>
        
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="价格" 
                unit="万" 
                domain={rangeXDomain} 
                ticks={rangeXTicks}
                stroke="#94a3b8"
                tick={{fontSize: 12}}
                label={{ value: '平均价格 (万)', position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="续航" 
                unit="km" 
                domain={rangeYDomain} 
                ticks={rangeYTicks}
                stroke="#94a3b8"
                tick={{fontSize: 12}}
                label={{ value: '续航 (km)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <ZAxis type="number" dataKey="z" range={[60, 60]} />
              <Tooltip content={<RangeTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              
              <Legend 
                verticalAlign="top" 
                height={50} 
                content={renderRangeLegend}
              />
              
              <ReferenceLine y={600} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: "纯电600km及格线", fill: "#94a3b8", fontSize: 10, position: 'insideRight' }} />
              <ReferenceLine x={25} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: "25万分界线", fill: "#94a3b8", fontSize: 10, position: 'insideTop' }} />

              <Scatter 
                name="Vehicles" 
                data={rangeChartData} 
                isAnimationActive={true}
                animationDuration={800}
              >
                  {rangeChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getPowerColor(entry.power)} 
                      />
                  ))}
              </Scatter>

            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Penetration Rate Trend (Replaces Sales Chart) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-2 flex items-start justify-between">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <TrendingUp className="mr-2 text-cyan-600" size={24}/>
                    新能源渗透率趋势：中国 vs 全球
                </h2>
                <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                    中国新能源汽车渗透率呈现爆发式增长，远超全球平均水平。
                    <span className="text-xs text-slate-400 block mt-1">* 2025H1/H2 为基于 Q1-Q2 及 IEA 预期所做的估算值。</span>
                </p>
            </div>
        </div>
        
        <div className="h-[400px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
                data={PENETRATION_DATA}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={{stroke: '#e2e8f0'}}
                padding={{ left: 30, right: 30 }}
              />
              <YAxis 
                unit="%" 
                stroke="#94a3b8" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false}
                domain={[0, 80]}
              />
              <Tooltip content={<PenetrationTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              <Line 
                name="中国 NEV 渗透率"
                type="monotone" 
                dataKey="china" 
                stroke="#0891b2" // Cyan-600
                strokeWidth={4}
                activeDot={{ r: 8, strokeWidth: 0 }}
                dot={{ r: 4, strokeWidth: 0, fill: '#0891b2' }}
              />
              <Line 
                name="全球 EV 渗透率"
                type="monotone" 
                dataKey="global" 
                stroke="#94a3b8" // Slate-400
                strokeWidth={3}
                strokeDasharray="5 5"
                activeDot={{ r: 6, strokeWidth: 0 }}
                dot={{ r: 4, strokeWidth: 0, fill: '#94a3b8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Smart Driving Ladder Map */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                智驾能力天梯图
                <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">点击品牌查看车型</span>
            </h3>
            
            <div className="space-y-4">
                {ladderData.map((tier) => (
                    <div key={tier.id} className={`border rounded-xl overflow-hidden ${getLevelColor(tier.id).split(' ')[2]}`}>
                        {/* Header */}
                        <div className={`px-4 py-3 flex flex-col justify-center ${getLevelColor(tier.id)}`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                    {getLevelIcon(tier.id)}
                                    <span className="font-bold text-sm">{tier.label}</span>
                                </div>
                                <span className="text-[10px] opacity-70 bg-white/30 px-2 py-0.5 rounded">{tier.totalCars} 款车</span>
                            </div>
                            <p className="text-[10px] opacity-80 pl-6">{tier.desc}</p>
                        </div>
                        
                        {/* Brands Grid */}
                        <div className="p-3 bg-white flex flex-wrap gap-2">
                            {tier.brands.map((brandInfo) => {
                                const isExpanded = expandedLadder?.level === tier.id && expandedLadder?.brand === brandInfo.name;
                                
                                return (
                                    <div key={brandInfo.name} className="contents">
                                        <button 
                                            onClick={() => setExpandedLadder(isExpanded ? null : { level: tier.id, brand: brandInfo.name })}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center ${
                                                isExpanded 
                                                    ? 'bg-slate-800 text-white border-slate-800' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600'
                                            }`}
                                        >
                                            {brandInfo.name}
                                            {isExpanded ? <ChevronUp size={12} className="ml-1"/> : <ChevronDown size={12} className="ml-1 opacity-50"/>}
                                        </button>

                                        {/* Expanded Cars Panel */}
                                        {isExpanded && (
                                            <div className="w-full bg-slate-50 rounded-lg p-3 mt-1 mb-2 border border-slate-100 animate-fadeIn">
                                                <h5 className="text-xs font-bold text-slate-500 mb-2">{brandInfo.name} - {tier.label.split(' ')[0]} 车型：</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {brandInfo.cars.map(car => (
                                                        <div key={car.id} className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                                                            <div className="flex items-center space-x-2 overflow-hidden">
                                                                <Car size={14} className="text-cyan-500 flex-shrink-0" />
                                                                <span className="text-xs font-bold text-slate-700 truncate">{car.name}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 flex-shrink-0">{car.priceRange[0]}w起</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                * 注：智驾分级基于厂商硬件能力（芯片/激光雷达）及目前OTA开放的软件版本进行划分。
            </p>
          </div>

          {/* Performance Ladder Map (Replaced simple list) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                性能天梯图 (0-100km/h)
                <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">点击品牌查看车型</span>
            </h3>
             
             <div className="space-y-4">
                {perfLadderData.map((tier) => (
                    <div key={tier.id} className={`border rounded-xl overflow-hidden ${tier.color.split(' ')[2]}`}>
                        {/* Header */}
                        <div className={`px-4 py-3 flex flex-col justify-center ${tier.color}`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                    {tier.icon}
                                    <span className="font-bold text-sm">{tier.label}</span>
                                </div>
                                <span className="text-[10px] opacity-70 bg-white/30 px-2 py-0.5 rounded">{tier.totalCars} 款车</span>
                            </div>
                            <p className="text-[10px] opacity-80 pl-6">{tier.desc}</p>
                        </div>

                         {/* Brands Grid */}
                         <div className="p-3 bg-white flex flex-wrap gap-2">
                            {tier.brands.map((brandInfo) => {
                                const isExpanded = expandedPerfLadder?.level === tier.id && expandedPerfLadder?.brand === brandInfo.name;
                                
                                return (
                                    <div key={brandInfo.name} className="contents">
                                        <button 
                                            onClick={() => setExpandedPerfLadder(isExpanded ? null : { level: tier.id, brand: brandInfo.name })}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center ${
                                                isExpanded 
                                                    ? 'bg-slate-800 text-white border-slate-800' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600'
                                            }`}
                                        >
                                            {brandInfo.name}
                                            {isExpanded ? <ChevronUp size={12} className="ml-1"/> : <ChevronDown size={12} className="ml-1 opacity-50"/>}
                                        </button>

                                        {/* Expanded Cars Panel */}
                                        {isExpanded && (
                                            <div className="w-full bg-slate-50 rounded-lg p-3 mt-1 mb-2 border border-slate-100 animate-fadeIn">
                                                <h5 className="text-xs font-bold text-slate-500 mb-2">{brandInfo.name} - {tier.label.split(' ')[0]} 车型：</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {brandInfo.cars.map(car => (
                                                        <div key={car.id} className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                                                            <div className="flex items-center space-x-2 overflow-hidden">
                                                                <Timer size={14} className="text-orange-500 flex-shrink-0" />
                                                                <span className="text-xs font-bold text-slate-700 truncate">{car.name}</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-900 flex-shrink-0">{car.acceleration}s</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
             </div>
             <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                * 注：性能数据采用官方公布的百公里加速最快版本数据。
            </p>
          </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;