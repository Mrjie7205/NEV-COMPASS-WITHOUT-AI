
import React, { useState } from 'react';
import { Sparkles, ChevronLeft, Check, RotateCcw, Calculator, Wallet, Users, RefreshCw } from 'lucide-react';
import { CAR_DATABASE } from '../constants';
import { QuizQuestion, CarModel, PowerType, CarType, Brand } from '../types';
import CarCard from './CarCard';

const QUESTIONS: QuizQuestion[] = [
    {
        id: 'budget',
        text: '您的购车预算大约是多少？',
        description: '我们将根据落地价格为您匹配',
        options: [
            { label: '10万以内', value: '10万以内', icon: '💰' },
            { label: '10-20万', value: '10-20万', icon: '💴' },
            { label: '20-30万', value: '20-30万', icon: '💵' },
            { label: '30-50万', value: '30-50万', icon: '💶' },
            { label: '50万以上', value: '50万以上', icon: '💳' }
        ]
    },
    {
        id: 'type',
        text: '您倾向于哪种车型？',
        description: '决定了车身形态和空间布局',
        options: [
            { label: '轿车', value: '轿车', icon: '🚗' },
            { label: 'SUV', value: 'SUV', icon: '🚙' },
            { label: 'MPV', value: 'MPV', icon: '🚐' },
            { label: '跑车/个性', value: '跑车', icon: '🏎️' },
            { label: '越野', value: '越野车', icon: '⛰️' }
        ]
    },
    {
        id: 'power',
        text: '您对动力形式有要求吗？',
        description: '纯电成本低，混动无焦虑',
        options: [
            { label: '纯电 (BEV)', value: '纯电', icon: '⚡' },
            { label: '增程/插混 (可油可电)', value: '混动', icon: '⛽' },
            { label: '都可以', value: '不限', icon: '🤷' }
        ]
    },
    {
        id: 'charging',
        text: '您的充电便利性如何？',
        description: '这直接决定了纯电车型的用车体验',
        options: [
            { label: '有家用充电桩', value: '有家充', icon: '🏠' },
            { label: '周边公共充电方便', value: '公充方便', icon: '🔋' },
            { label: '充电不便/无固定车位', value: '充电困难', icon: '🚫' }
        ]
    },
    {
        id: 'seats',
        text: '您需要几个座位？',
        description: '家庭成员数量决定',
        options: [
            { label: '2-4座 (个人/情侣)', value: '常规', icon: '👫' },
            { label: '大5座 (三口之家)', value: '大5座', icon: '👪' },
            { label: '6/7座 (二胎/三代)', value: '6/7座', icon: '🚐' }
        ]
    },
    {
        id: 'usage',
        text: '这辆车主要怎么用？',
        options: [
            { label: '上下班代步', value: '代步', icon: '🏙️' },
            { label: '家庭主力 (带娃/露营)', value: '家用', icon: '⛺' },
            { label: '商务接待', value: '商务', icon: '💼' },
            { label: '追求驾驶乐趣', value: '操控', icon: '🏁' }
        ]
    },
    {
        id: 'smart',
        text: '对智能驾驶的依赖程度？',
        options: [
            { label: '极客 (必须有城市NOA)', value: '高阶智驾', icon: '🤖' },
            { label: '实用 (高速能自动巡航)', value: '高速智驾', icon: '🛣️' },
            { label: '保守 (不太需要)', value: '基础L2', icon: '🛡️' },
            { label: '无所谓', value: '不限', icon: '🤷' }
        ]
    },
    {
        id: 'cabin',
        text: '座舱风格偏好？',
        options: [
            { label: '大彩电+大沙发 (舒适)', value: '舒适', icon: '🛋️' },
            { label: '极简科技 (特斯拉风)', value: '极简', icon: '📱' },
            { label: '豪华质感 (传统豪华)', value: '豪华', icon: '🎩' }
        ]
    },
    {
        id: 'brand_pref',
        text: '品牌偏好？',
        options: [
            { label: '新势力 (蔚小理/小米等)', value: '新势力', icon: '🚀' },
            { label: '传统大厂 (比亚迪/吉利等)', value: '传统大厂', icon: '🏭' },
            { label: '无所谓', value: '不限', icon: '🤝' }
        ]
    }
];

interface Recommendation {
    id: string;
    reason: string;
    score: number;
}

interface ScoredCar {
    car: CarModel;
    score: number;
    reasons: string[];
}

const SmartSelector: React.FC = () => {
    const [mode, setMode] = useState<'intro' | 'quiz' | 'analyzing' | 'result'>('intro');
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    
    // Result State
    const [allScoredCars, setAllScoredCars] = useState<ScoredCar[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [analysisText, setAnalysisText] = useState('');
    const [batchIndex, setBatchIndex] = useState(0);

    const startQuiz = () => {
        setMode('quiz');
        setCurrentQuestionIdx(0);
        setAnswers({});
        setRecommendations([]);
        setAllScoredCars([]);
        setBatchIndex(0);
    };

    const handleAnswer = (option: string) => {
        const question = QUESTIONS[currentQuestionIdx];
        const newAnswers = { ...answers, [question.id]: option };
        setAnswers(newAnswers);

        // Small delay for animation feel
        setTimeout(() => {
            if (currentQuestionIdx < QUESTIONS.length - 1) {
                setCurrentQuestionIdx(prev => prev + 1);
            } else {
                submitQuiz(newAnswers);
            }
        }, 200);
    };

    const handlePrevious = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx(prev => prev - 1);
        } else {
            setMode('intro');
        }
    };

    // --- ALGORITHM LOGIC START ---

    const parseBudget = (budgetStr: string): [number, number] => {
        if (budgetStr === '10万以内') return [0, 10];
        if (budgetStr === '10-20万') return [10, 20];
        if (budgetStr === '20-30万') return [20, 30];
        if (budgetStr === '30-50万') return [30, 50];
        if (budgetStr === '50万以上') return [50, 999];
        return [0, 999];
    };

    const isNewForce = (brand: Brand) => {
        const newForces = [
            Brand.XIAOMI, Brand.TESLA, Brand.NIO, Brand.XPENG, Brand.LIXIANG, 
            Brand.LEAPMOTOR, Brand.ONVO, Brand.AITO, Brand.LUXEED, Brand.STELATO,
            Brand.AVATR, Brand.DEEPAL, Brand.ZEEKR, Brand.IM
        ];
        return newForces.includes(brand);
    };

    const calculateScore = (car: CarModel, answers: Record<string, string>): { score: number, reasons: string[] } => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Budget (Weight: 40) - Critical
        const [minB, maxB] = parseBudget(answers['budget']);
        const carMin = car.priceRange[0];
        const carMax = car.priceRange[1];
        
        // Check overlap
        if (carMin <= maxB && carMax >= minB) {
            score += 40;
            // Bonus for perfect fit (center of range)
            const carAvg = (carMin + carMax) / 2;
            const userAvg = (minB + (maxB === 999 ? 80 : maxB)) / 2;
            if (Math.abs(carAvg - userAvg) < 5) score += 5;
        } else if (Math.abs(carMin - maxB) < 5 || Math.abs(carMax - minB) < 5) {
            // Slightly out of budget but close
            score += 20;
        }

        // 2. Car Type (Weight: 20)
        const typePref = answers['type'];
        if (typePref === '越野车' && car.type === CarType.OFFROAD) {
            score += 25; // Niche match bonus
            reasons.push("硬派越野");
        } else if (typePref === '跑车' && car.type === CarType.COUPE) {
            score += 25;
            reasons.push("运动轿跑");
        } else if (car.type === CarType.SUV && typePref === 'SUV') {
            score += 20;
            reasons.push("SUV车型");
        } else if (car.type === CarType.SEDAN && typePref === '轿车') {
            score += 20;
            reasons.push("轿车车型");
        } else if (car.type === CarType.MPV && typePref === 'MPV') {
            score += 25;
            reasons.push("MPV车型");
        } else {
             // Soft match: Sedan user might like Coupe, SUV user might like Offroad
             if ((typePref === '轿车' && car.type === CarType.COUPE) ||
                 (typePref === '跑车' && car.type === CarType.SEDAN)) {
                 score += 10;
             }
        }

        // 3. Power (Weight: 15)
        const powerPref = answers['power'];
        if (powerPref === '纯电') {
            if (car.power === PowerType.BEV) {
                score += 15;
                reasons.push("纯电动力");
            }
        } else if (powerPref === '混动') {
            if (car.power !== PowerType.BEV) {
                score += 15;
                reasons.push("无里程焦虑");
            }
        } else {
            score += 10; // Doesn't matter
        }

        // 4. Charging Condition (Weight: 10)
        const charging = answers['charging'];
        if (charging === '充电困难') {
            if (car.power !== PowerType.BEV) {
                score += 15; // Strongly prefer Hybrid if charging is hard
                reasons.push("加油即可");
            } else if (car.range > 700) {
                score += 5; // Long range BEV is acceptable
            } else {
                score -= 10; // Penalty for short range BEV
            }
        }

        // 5. Seats (Weight: 10)
        const seatPref = answers['seats'];
        const isSixSevenSeater = car.type === CarType.MPV || (car.features.some(f => f.includes('六座') || f.includes('七座') || f.includes('三排')));
        
        if (seatPref === '6/7座') {
            if (isSixSevenSeater) {
                score += 15;
                reasons.push("多座布局");
            } else {
                score -= 20; // Heavy penalty if asking for 6 seats and getting 5
            }
        } else if (seatPref === '大5座') {
            if (!isSixSevenSeater && (car.type === CarType.SUV || car.type === CarType.SEDAN)) {
                score += 10;
            }
        } else {
            // Regular 2-4 seats
            if (!isSixSevenSeater) score += 10;
        }

        // 6. Usage (Weight: 5)
        const usage = answers['usage'];
        if (usage === '操控' && car.acceleration < 5) {
            score += 5;
            reasons.push("性能强劲");
        }
        if (usage === '家用' && (car.type === CarType.SUV || car.type === CarType.MPV)) {
            score += 5;
            reasons.push("家用空间大");
        }

        // 7. Smart Driving (Weight: 10)
        const smart = answers['smart'];
        if (smart === '高阶智驾') {
            if (car.autonomousLevel === 'City NOA') {
                score += 15;
                reasons.push("高阶智驾");
            } else if (car.autonomousLevel === 'High-Speed NOA') {
                score += 5;
            } else {
                score -= 5;
            }
        }

        // 8. Brand Pref (Weight: 5)
        const brandPref = answers['brand_pref'];
        const isCarNewForce = isNewForce(car.brand);
        if (brandPref === '新势力' && isCarNewForce) score += 5;
        if (brandPref === '传统大厂' && !isCarNewForce) score += 5;

        return { score, reasons };
    };

    const updateDisplayBatch = (scoredList: ScoredCar[], batchIdx: number, currentAnswers: Record<string, string>) => {
        // Calculate pagination (3 items per page)
        const totalItems = scoredList.length;
        if (totalItems === 0) return;

        const startIndex = (batchIdx * 3) % totalItems;
        
        // Pick 3 items, looping if necessary (though for a list > 3 it's just circular)
        const currentBatch: ScoredCar[] = [];
        for (let i = 0; i < 3; i++) {
            const idx = (startIndex + i) % totalItems;
            currentBatch.push(scoredList[idx]);
        }

        // Construct Result Objects
        const finalRecs: Recommendation[] = currentBatch.map(item => {
            // Generate dynamic reason string
            let uniqueReason = item.reasons.slice(0, 2).join('，');
            if (!uniqueReason) uniqueReason = "综合性能优秀";
            
            // Add price context if it matches budget well
            const [minB, maxB] = parseBudget(currentAnswers['budget']);
            if (item.car.priceRange[0] <= maxB && item.car.priceRange[1] >= minB) {
                uniqueReason += "，符合预算";
            } else if (item.car.priceRange[0] > maxB) {
                uniqueReason += "，预算略超但值得";
            }

            return {
                id: item.car.id,
                score: item.score,
                reason: uniqueReason
            };
        });

        // Update Text
        const topCar = currentBatch[0]?.car;
        let analysis = "";
        if (batchIdx === 0) {
            analysis = "根据您的需求，我们为您筛选了匹配度最高的三款车型。";
        } else {
            analysis = "为您切换了一批备选车型，虽然匹配得分略低，但也许更合眼缘。";
        }
        
        if (topCar) {
            analysis += `重点推荐${topCar.name}。`;
            if (currentAnswers['power'] === '混动' || currentAnswers['charging'] === '充电困难') {
                analysis += "考虑到补能需求，该车型的动力形式非常适合您。";
            }
        }

        setAnalysisText(analysis);
        setRecommendations(finalRecs);
    };

    const submitQuiz = async (finalAnswers: Record<string, string>) => {
        setMode('analyzing');
        
        // Simulate thinking time for UX
        setTimeout(() => {
            // Run Algorithm
            const scoredCars = CAR_DATABASE.map(car => {
                const { score, reasons } = calculateScore(car, finalAnswers);
                return { car, score, reasons };
            });

            // Sort by score descending
            scoredCars.sort((a, b) => b.score - a.score);

            setAllScoredCars(scoredCars);
            setBatchIndex(0);
            updateDisplayBatch(scoredCars, 0, finalAnswers);
            setMode('result');

        }, 1500);
    };

    const handleNextBatch = () => {
        const nextBatchIdx = batchIndex + 1;
        setBatchIndex(nextBatchIdx);
        setMode('analyzing'); // Brief loading effect
        setTimeout(() => {
            updateDisplayBatch(allScoredCars, nextBatchIdx, answers);
            setMode('result');
        }, 500);
    };
    
    // --- ALGORITHM LOGIC END ---

    const getRecommendedCars = () => {
        return recommendations.map(rec => {
            const car = CAR_DATABASE.find(c => c.id === rec.id);
            return { car, reason: rec.reason };
        }).filter(item => item.car !== undefined);
    };

    const calculateLandingPrice = (priceWan: number) => {
        const price = priceWan * 10000;
        // Purchase Tax 2024-2025 rule
        const priceWithoutTax = price / 1.13;
        const potentialTax = priceWithoutTax * 0.1;
        const actualTax = potentialTax > 30000 ? potentialTax - 30000 : 0;
        const insurance = 4500 + (price * 0.012); 
        const registration = 500;
        const total = price + actualTax + insurance + registration;
        
        return {
            totalWan: (total / 10000).toFixed(2),
            tax: actualTax.toFixed(0),
            insurance: insurance.toFixed(0)
        };
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[650px] flex flex-col relative">
            
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -ml-10 -mb-10 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-slate-100 p-6 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-cyan-700">
                    <Sparkles size={24} />
                    <h2 className="font-bold text-xl tracking-tight">智能选车专家</h2>
                </div>
                {mode === 'quiz' && (
                    <div className="flex items-center space-x-4">
                         <div className="text-xs font-bold text-slate-400">
                             {currentQuestionIdx + 1}/{QUESTIONS.length}
                         </div>
                         <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-cyan-500 transition-all duration-500 ease-out"
                                style={{ width: `${((currentQuestionIdx + 1) / QUESTIONS.length) * 100}%` }}
                             ></div>
                         </div>
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 md:p-12 flex flex-col justify-center items-center relative z-10">
                
                {/* Intro */}
                {mode === 'intro' && (
                    <div className="text-center max-w-lg animate-fadeIn w-full">
                        
                        <h3 className="text-2xl font-bold text-slate-800 mb-4">找不到心仪的车？</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            面对市场上数百款新能源车感到眼花缭乱？<br/>
                            花1分钟回答9个问题，系统将智能分析您的需求，<br/>为您推荐最完美的3个选择。
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <Wallet className="text-cyan-600 mb-2" size={20}/>
                                <h4 className="font-bold text-sm">精准预算</h4>
                                <p className="text-xs text-slate-400">含税费保险估算</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <Users className="text-cyan-600 mb-2" size={20}/>
                                <h4 className="font-bold text-sm">场景匹配</h4>
                                <p className="text-xs text-slate-400">充电/二胎/商务</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={startQuiz}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all transform hover:scale-[1.02]"
                        >
                            开始测评
                        </button>
                    </div>
                )}

                {/* Quiz */}
                {mode === 'quiz' && (
                    <div className="w-full max-w-2xl animate-slideUp">
                        <div className="mb-8">
                             <button 
                                onClick={handlePrevious}
                                className="inline-flex items-center text-slate-400 hover:text-cyan-600 transition-colors text-sm font-medium mb-4"
                             >
                                <ChevronLeft size={16} className="mr-1" />
                                {currentQuestionIdx === 0 ? '返回介绍' : '上一题'}
                             </button>
                             
                            <h3 className="text-3xl font-bold text-slate-800 mb-2 text-center">
                                {QUESTIONS[currentQuestionIdx].text}
                            </h3>
                            <p className="text-slate-400 text-center mb-6 text-sm">
                                {QUESTIONS[currentQuestionIdx].description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {QUESTIONS[currentQuestionIdx].options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(opt.value)}
                                    className="relative p-6 rounded-2xl border-2 border-slate-100 hover:border-cyan-500 hover:bg-cyan-50/50 transition-all text-left group flex items-center bg-white"
                                >
                                    <span className="text-3xl mr-4 filter grayscale group-hover:grayscale-0 transition-all">{opt.icon}</span>
                                    <div>
                                        <span className="font-bold text-slate-700 group-hover:text-cyan-900 block">{opt.label}</span>
                                    </div>
                                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500">
                                        <Check size={20} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Analyzing */}
                {mode === 'analyzing' && (
                    <div className="text-center animate-fadeIn">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                             <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                             <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                             <Sparkles className="absolute inset-0 m-auto text-cyan-500" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">
                            {batchIndex === 0 ? '智能算法计算中...' : '正在筛选更多车型...'}
                        </h3>
                        <p className="text-slate-500">正在对比车型库参数与您的需求匹配度</p>
                    </div>
                )}

                {/* Result */}
                {mode === 'result' && (
                    <div className="w-full animate-fadeIn max-w-5xl">
                         <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl mb-10 text-white shadow-xl">
                            <div className="flex items-start">
                                <Sparkles className="text-yellow-400 mt-1 mr-3 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-lg mb-2">选车报告</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed opacity-90">{analysisText}</p>
                                </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {getRecommendedCars().map((item: any, idx) => {
                                const lp = calculateLandingPrice(item.car.priceRange[0]);
                                return (
                                    <div key={idx} className="relative flex flex-col h-full group animate-scaleIn">
                                        {/* Rank Badge */}
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold px-4 py-1 rounded-full shadow-lg text-sm border-2 border-white whitespace-nowrap">
                                            {batchIndex === 0 ? `No. ${idx + 1} 匹配` : `备选推荐 ${idx + 1}`}
                                        </div>
                                        
                                        <div className="transform group-hover:-translate-y-2 transition-transform duration-300 h-full">
                                            <CarCard car={item.car} />
                                        </div>
                                        
                                        <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                            <div className="mb-3">
                                                <span className="bg-cyan-50 text-cyan-700 text-xs font-bold px-2 py-1 rounded border border-cyan-100">推荐理由</span>
                                                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.reason}</p>
                                            </div>

                                            <div className="border-t border-slate-100 pt-3">
                                                <div className="flex items-center justify-between text-xs mb-2">
                                                    <span className="text-slate-400 flex items-center"><Calculator size={12} className="mr-1"/> 参考落地价</span>
                                                    <span className="font-bold text-slate-800">约 {lp.totalWan} 万</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden flex">
                                                    <div className="bg-slate-400 h-full w-[85%]"></div>
                                                    <div className="bg-orange-400 h-full w-[15%]"></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 bg-slate-50 p-1.5 rounded-lg">
                                                    <div className="flex flex-col items-center flex-1 border-r border-slate-200">
                                                        <span className="text-slate-400 scale-90">车价</span>
                                                        <span className="font-medium">{item.car.priceRange[0]}w</span>
                                                    </div>
                                                    <div className="flex flex-col items-center flex-1 border-r border-slate-200">
                                                        <span className="text-slate-400 scale-90">购置税</span>
                                                        <span className="font-medium">{(Number(lp.tax)/10000).toFixed(2)}w</span>
                                                    </div>
                                                    <div className="flex flex-col items-center flex-1">
                                                        <span className="text-slate-400 scale-90">保险</span>
                                                        <span className="font-medium">{(Number(lp.insurance)/10000).toFixed(2)}w</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                         </div>

                         <div className="text-center pb-8 flex flex-col md:flex-row justify-center items-center gap-4">
                            <button 
                                onClick={handleNextBatch}
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 hover:text-orange-500 transition-colors font-medium shadow-sm w-full md:w-auto justify-center"
                            >
                                <RefreshCw size={18} />
                                <span>换一批推荐</span>
                            </button>

                            <button 
                                onClick={startQuiz}
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 hover:text-cyan-600 transition-colors font-medium shadow-sm w-full md:w-auto justify-center"
                            >
                                <RotateCcw size={18} />
                                <span>重新测评</span>
                            </button>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartSelector;
