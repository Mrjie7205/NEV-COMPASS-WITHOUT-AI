

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CAR_DATABASE } from '../constants';
import { Brand, CarType, PowerType } from '../types';
import CarCard from './CarCard';
import { ChevronLeft, Search, Car, Filter, Zap, Layout, Tag } from 'lucide-react';

interface CarLibraryProps {
    resetSignal?: number;
}

const BrandLogo: React.FC<{ brand: string }> = ({ brand }) => {
    return (
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-cyan-50 border border-cyan-100 text-cyan-700 shadow-sm transition-transform group-hover:scale-110 duration-300">
            <span className="text-2xl font-bold select-none">
                {brand.charAt(0)}
            </span>
        </div>
    );
};

// Define Brand Categories
const BRAND_CATEGORIES: { title: string; brands: Brand[] }[] = [
    {
        title: "造车新势力",
        brands: [
            Brand.XIAOMI, Brand.TESLA, Brand.NIO, Brand.XPENG, 
            Brand.LIXIANG, Brand.LEAPMOTOR, Brand.ONVO
        ]
    },
    {
        title: "鸿蒙智行 (华为系)",
        brands: [
            Brand.AITO, Brand.LUXEED, Brand.STELATO, Brand.MAEXTRO
        ]
    },
    {
        title: "比亚迪系",
        brands: [
            Brand.BYD, Brand.FANGCHENGBAO, Brand.DENZA
        ]
    },
    {
        title: "吉利系",
        brands: [
            Brand.ZEEKR, Brand.GEELY, Brand.GALAXY, Brand.GEOMETRY, Brand.SMART,
            Brand.LYNKCO, Brand.LIVAN, Brand.CAOCAO
        ]
    },
    {
        title: "奇瑞系",
        brands: [
            Brand.CHERY, Brand.FULWIN, Brand.ICAR
        ]
    },
    {
        title: "传统自主品牌 (长城/长安/广汽/上汽/东风等)",
        brands: [
            Brand.AVATR, Brand.DEEPAL, Brand.CHANGAN, // Changan Group
            Brand.GAC_AION, Brand.HYPER, Brand.TRUMPCHI, // GAC Group
            Brand.IM, Brand.RISING, Brand.MG, Brand.ROEWE, Brand.WULING, Brand.BAOJUN, // SAIC Group
            Brand.VOYAH, Brand.EPI, Brand.NAMMI, Brand.FENGSHEN, Brand.FORTHING, // Dongfeng Group
            Brand.ARCFOX, Brand.HONGQI, Brand.JMEV, // BAIC, FAW, JMC
            Brand.WEY, Brand.TANK, Brand.ORA, Brand.HAVAL // Great Wall Group
        ]
    },
    {
        title: "海外/合资品牌",
        brands: [
            Brand.BMW, Brand.BENZ, Brand.VW, Brand.AUDI, Brand.BUICK, Brand.CADILLAC, Brand.VOLVO
        ]
    }
];

const CarLibrary: React.FC<CarLibraryProps> = ({ resetSignal }) => {
    const [view, setView] = useState<'brands' | 'models'>('brands');
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filters
    const [filterPower, setFilterPower] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Ref to store scroll position
    const scrollPosRef = useRef(0);

    // Effect to handle reset signal from parent (when clicking 'Car Library' tab while active)
    useEffect(() => {
        if (resetSignal && resetSignal > 0 && view === 'models') {
            handleBack();
        }
    }, [resetSignal]);

    // Group cars by brand for counting
    const brandCounts = useMemo(() => CAR_DATABASE.reduce((acc, car) => {
        acc[car.brand] = (acc[car.brand] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), []);

    // Derived view state
    const isFiltering = searchTerm !== '' || filterPower !== 'all' || filterType !== 'all';
    
    // Filter Logic
    const filteredCars = useMemo(() => {
        return CAR_DATABASE.filter(car => {
            // 1. Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                if (!car.name.toLowerCase().includes(searchLower) && 
                    !car.brand.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // 2. Power filter
            if (filterPower !== 'all' && car.power !== filterPower) {
                return false;
            }

            // 3. Type filter
            if (filterType !== 'all' && car.type !== filterType) {
                return false;
            }

            // 4. Brand selection
            if (selectedBrand && !isFiltering && view === 'models') {
                return car.brand === selectedBrand;
            }
            if (view === 'models' && selectedBrand && !searchTerm) {
                 return car.brand === selectedBrand;
            }

            return true;
        });
    }, [searchTerm, filterPower, filterType, selectedBrand, view, isFiltering]);

    const handleBrandClick = (brand: Brand) => {
        // Save current scroll position
        scrollPosRef.current = window.scrollY;
        
        setSelectedBrand(brand);
        setView('models');
        setSearchTerm('');
        // Scroll to top when entering a specific brand
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setView('brands');
        setSelectedBrand(null);
        setSearchTerm('');
        setFilterPower('all');
        setFilterType('all');
        
        // Restore saved scroll position
        setTimeout(() => {
            window.scrollTo({ top: scrollPosRef.current, behavior: 'auto' });
        }, 10);
    };

    // Determine what to render
    const showModelList = isFiltering || (view === 'models' && selectedBrand);

    return (
        <div className="animate-fadeIn min-h-[600px] flex flex-col">
            {/* Controls Section - Always Visible to keep focus */}
            <div className="sticky top-[64px] z-30 bg-slate-50/90 backdrop-blur pb-4 pt-2 mb-4 border-b border-slate-200">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="搜索车型或品牌..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        />
                        <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <div className="relative">
                            <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                                <Zap size={16} />
                            </div>
                            <select 
                                value={filterPower}
                                onChange={(e) => setFilterPower(e.target.value)}
                                className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <option value="all">所有动力</option>
                                <option value={PowerType.BEV}>纯电 BEV</option>
                                <option value={PowerType.REEV}>增程 REEV</option>
                                <option value={PowerType.PHEV}>插混 PHEV</option>
                            </select>
                        </div>

                        <div className="relative">
                             <div className="absolute left-3 top-3.5 text-slate-400 pointer-events-none">
                                <Layout size={16} />
                            </div>
                            <select 
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <option value="all">所有车型</option>
                                <option value={CarType.SEDAN}>轿车</option>
                                <option value={CarType.SUV}>SUV</option>
                                <option value={CarType.MPV}>MPV</option>
                                <option value={CarType.WAGON}>旅行车</option>
                                <option value={CarType.COUPE}>跑车</option>
                                <option value={CarType.OFFROAD}>越野</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Active Filter Indicators */}
                {isFiltering && (
                    <div className="flex items-center mt-3 text-sm text-slate-500">
                         <Filter size={14} className="mr-2" />
                         <span>筛选结果: {filteredCars.length} 款车型</span>
                         {(filterPower !== 'all' || filterType !== 'all') && (
                             <button 
                                onClick={() => {setFilterPower('all'); setFilterType('all');}} 
                                className="ml-4 text-cyan-600 hover:underline text-xs"
                             >
                                清空筛选
                             </button>
                         )}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
                {showModelList ? (
                    <div>
                        <div className="flex items-center mb-6">
                            {(selectedBrand || isFiltering) && (
                                <button 
                                    onClick={handleBack} 
                                    className="mr-4 p-2 hover:bg-slate-200 rounded-full transition-colors flex items-center text-slate-600 font-medium"
                                    title="返回品牌库"
                                >
                                    <ChevronLeft size={20} className="mr-1"/>
                                    {isFiltering ? '返回' : selectedBrand}
                                </button>
                            )}
                            <h2 className="text-xl font-bold text-slate-800">
                                {isFiltering ? '筛选列表' : `${selectedBrand} 车型列表`}
                            </h2>
                        </div>

                        {filteredCars.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredCars.map(car => (
                                    <CarCard key={car.id} car={car} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                                <Car size={48} className="mx-auto mb-4 opacity-30" />
                                <p>未找到符合条件的车型</p>
                                <button 
                                    onClick={handleBack}
                                    className="mt-4 text-cyan-600 font-medium hover:underline"
                                >
                                    清空条件重试
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-10 pb-10">
                         {BRAND_CATEGORIES.map((category) => {
                             // Only render category if it has active brands in the DB
                             const activeBrands = category.brands.filter(b => brandCounts[b] && brandCounts[b] > 0);
                             
                             if (activeBrands.length === 0) return null;

                             return (
                                <div key={category.title}>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center pl-2 border-l-4 border-cyan-500">
                                        {category.title}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {activeBrands.map((brand) => (
                                            <button 
                                                key={brand}
                                                onClick={() => handleBrandClick(brand)}
                                                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-cyan-200 transition-all flex flex-col items-center justify-center group"
                                            >
                                                <BrandLogo brand={brand} />
                                                <span className="font-bold text-slate-700 group-hover:text-cyan-700 text-center text-sm">{brand}</span>
                                                <span className="text-xs text-slate-400 mt-1">{brandCounts[brand]} 款车型</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                             );
                         })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarLibrary;