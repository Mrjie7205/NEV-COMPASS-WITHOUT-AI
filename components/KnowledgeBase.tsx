

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Battery, Zap, Plug, Cpu, Layers, Disc, Coins, ScrollText, 
  ShieldCheck, Search, Banknote, Wrench, AlertTriangle, 
  Smartphone, Snowflake, Radio, ChevronDown, ChevronUp, Info,
  Compass, FileCheck, Car, CheckCircle, Fuel, Settings, RotateCw, Calculator,
  FlaskConical, Shield, Activity, Lock, Footprints, Calendar, X, Book, Scan
} from 'lucide-react';

// --- Types ---
interface ArticleSection {
  subtitle: string;
  text: string;
}

interface Article {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: ArticleSection[];
}

interface Stage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  articles: Article[];
}

// --- CONSTANTS: Term Definitions (Smart Glossary) ---
const TERM_DEFINITIONS: Record<string, string> = {
    'CLTC': 'China Light-Duty Vehicle Test Cycle (中国轻型汽车行驶工况)。目前的国标续航测试标准，工况偏低速和城市拥堵，普遍被认为比实际续航虚高。',
    'WLTP': 'Worldwide Harmonized Light Vehicles Test Procedure (全球统一轻型车辆测试程序)。测试工况更复杂，包含高速行驶，比 CLTC 更接近真实续航。',
    '800V': '高压快充平台标准。相比传统的400V平台，800V平台能显著降低热损耗，提升充电速度（配合超充桩）和整车效率。',
    'AEB': 'Automatic Emergency Braking (自动紧急制动)。当系统检测到即将发生碰撞且驾驶员未反应时，自动触发刹车。',
    'NOA': 'Navigate on Autopilot (领航辅助驾驶)。车辆可以根据导航路径，在高速或城市道路上自动完成变道、超车、进出匝道等操作。',
    'kW': '千瓦，功率单位。决定了电机输出动力（加速快慢）和充电速度（补能快慢）。',
    'kWh': '千瓦时，俗称“度”，容量单位。电池有多少kWh决定了“油箱”有多大，直接影响续航里程。',
    '5C': '充电倍率。5C意味着充电功率是电池容量的5倍，理论上1/5小时（12分钟）即可充满。',
    'BEV': 'Battery Electric Vehicle (纯电动汽车)。只靠电池驱动，没有发动机。',
    'REEV': 'Range-Extended Electric Vehicle (增程式电动车)。有电池也有发动机（增程器），但发动机只发电不驱动车轮。',
    'PHEV': 'Plug-in Hybrid Electric Vehicle (插电式混合动力)。有电池也有发动机，发动机可以直接驱动车轮。',
    'LFP': 'Lithium Iron Phosphate (磷酸铁锂电池)。安全性高、寿命长、成本低，但能量密度较低，且低温性能差。',
    'NCM': 'Nickel Cobalt Manganese (三元锂电池)。能量密度高、低温性能好，但成本高，热稳定性不如磷酸铁锂。',
    'L2': 'Level 2 辅助驾驶。车辆可控制方向和加减速（如ACC+LCC），但驾驶员需时刻监管车辆。',
    'ACC': 'Adaptive Cruise Control (自适应巡航)。车辆自动控制车速，保持与前车的安全距离。',
    'LCC': 'Lane Centering Control (车道居中辅助)。车辆自动控制方向盘，保持在车道中间行驶。',
    'DOW': 'Door Open Warning (开门预警)。停车开门时，监测后方是否有来车或行人，避免开门杀。',
    'BSD': 'Blind Spot Detection (盲区监测)。监测后视镜盲区内的车辆，变道时发出警报。',
    'CIASI': '中国保险汽车安全指数（中保研）。以碰撞测试严格著称，尤其是25%偏置碰撞项目。',
    'VIN': 'Vehicle Identification Number (车辆识别代号)，独一无二的17位车架号，相当于汽车的身份证。',
    'SOC': 'State of Charge (剩余电量)。通常用百分比表示，类似于手机电量。',
    'OTA': 'Over-the-Air (空中下载技术)。车辆可以通过网络自动下载升级包，更新系统、优化功能甚至提升性能，就像手机更新系统一样。',
};

// --- Sub-Components ---

/**
 * Helper: RichText
 * Parses text and wraps known terms with a clickable span.
 */
const RichText: React.FC<{ text: string; onTermClick: (term: string, def: string) => void }> = ({ text, onTermClick }) => {
    const terms = useMemo(() => Object.keys(TERM_DEFINITIONS).sort((a, b) => b.length - a.length), []);
    const regex = useMemo(() => new RegExp(`(${terms.join('|')})`, 'g'), [terms]);

    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, index) => {
                const def = TERM_DEFINITIONS[part];
                if (def) {
                    return (
                        <span
                            key={index}
                            onClick={(e) => { e.stopPropagation(); onTermClick(part, def); }}
                            className="text-cyan-600 font-semibold cursor-pointer border-b border-dashed border-cyan-400 hover:bg-cyan-50 transition-colors mx-0.5 relative group select-none"
                            title="点击查看释义"
                        >
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
};

/**
 * 1. PowerFlowDiagram: Visualizes energy flow for BEV, REEV, PHEV
 */
const PowerFlowDiagram: React.FC<{ onTermClick: (t: string, d: string) => void }> = ({ onTermClick }) => {
    const [activeType, setActiveType] = useState<'BEV' | 'REEV' | 'PHEV'>('BEV');

    const FlowLine = ({ path, color = "stroke-cyan-500" }: { path: string, color?: string }) => (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet">
            <path 
                d={path} 
                fill="none" 
                strokeWidth="3" 
                className={`${color} opacity-30`} 
            />
            <path 
                d={path} 
                fill="none" 
                strokeWidth="3" 
                strokeDasharray="6 6"
                className={`${color} animate-flow`} 
            />
            <style>{`
                .animate-flow {
                    animation: dash 1s linear infinite;
                }
                @keyframes dash {
                    to { stroke-dashoffset: -12; }
                }
            `}</style>
        </svg>
    );

    const Node = ({ icon: Icon, label, color, x, y }: any) => (
        <div 
            className={`absolute w-12 h-12 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-lg z-10 bg-white transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2`}
            style={{ left: x, top: y, borderColor: color }}
        >
            <Icon className="w-5 h-5 md:w-7 md:h-7" style={{ color }} />
            <span className="text-[8px] md:text-[10px] font-bold mt-0.5 md:mt-1 text-slate-600 whitespace-nowrap">{label}</span>
        </div>
    );

    return (
        <div className="bg-slate-50 rounded-xl p-4 md:p-6 border border-slate-200 mb-6">
            <div className="flex justify-center space-x-4 mb-6">
                {(['BEV', 'REEV', 'PHEV'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveType(t)}
                        className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-bold transition-all ${
                            activeType === t 
                            ? 'bg-cyan-600 text-white shadow-md' 
                            : 'bg-white text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        {t === 'BEV' ? '纯电' : t === 'REEV' ? '增程' : '插混'}
                    </button>
                ))}
            </div>

            {/* Container with fixed aspect ratio 400:240 (5:3) to match SVG viewBox */}
            <div className="relative w-full max-w-md mx-auto bg-white rounded-xl shadow-inner border border-slate-100 aspect-[5/3]">
                <Node icon={Battery} label="电池" color="#10b981" x="35%" y="80%" />
                <Node icon={Zap} label="电机" color="#3b82f6" x="60%" y="80%" />
                <Node icon={RotateCw} label="车轮" color="#64748b" x="85%" y="50%" />

                {(activeType === 'REEV' || activeType === 'PHEV') && (
                    <>
                        <Node icon={Fuel} label="油箱" color="#f59e0b" x="10%" y="20%" />
                        <Node icon={Settings} label="发动机" color="#ef4444" x="35%" y="20%" />
                    </>
                )}
                {activeType === 'REEV' && (
                     <Node icon={Cpu} label="发电机" color="#8b5cf6" x="60%" y="20%" />
                )}

                <FlowLine path="M 140 192 L 240 192" color="stroke-emerald-500" />
                <FlowLine path="M 240 192 Q 290 192 340 120" color="stroke-blue-500" />

                {(activeType === 'REEV' || activeType === 'PHEV') && (
                     <FlowLine path="M 40 48 L 140 48" color="stroke-orange-400" />
                )}

                {activeType === 'REEV' && (
                    <>
                        <FlowLine path="M 140 48 L 240 48" color="stroke-red-400" />
                        <FlowLine path="M 240 48 L 240 192" color="stroke-purple-400" />
                    </>
                )}

                {activeType === 'PHEV' && (
                     <FlowLine path="M 140 48 Q 240 48 340 120" color="stroke-red-500" /> 
                )}
            </div>

            <div className="mt-4 text-xs md:text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <span className="font-bold text-blue-700">原理核心：</span>
                {activeType === 'BEV' && <RichText text=" 结构最简单，电池直接给电机供电驱动车轮。效率最高，但在充电不便时有焦虑。" onTermClick={onTermClick} />}
                {activeType === 'REEV' && <RichText text=" 发动机(增程器)只发电，不直接驱动车轮。拥有纯电的驾驶质感，且没有里程焦虑。高速油耗略高。" onTermClick={onTermClick} />}
                {activeType === 'PHEV' && <RichText text=" 发动机既可以发电，也可以在高速时直驱车轮。结构最复杂，但综合能耗和动力表现最全面。" onTermClick={onTermClick} />}
            </div>

            {/* Scenarios Comparison */}
            <h4 className="font-bold text-slate-700 mt-8 mb-4 border-l-4 border-cyan-500 pl-2">哪种适合我？场景对号入座</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* BEV */}
                <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-cyan-800 mb-3 flex items-center text-sm">
                        <Battery className="mr-2 text-cyan-600" size={18}/> 纯电 (BEV)
                    </h4>
                    <div className="text-xs space-y-3 text-slate-700">
                        <div>
                            <span className="font-bold bg-cyan-200 text-cyan-800 px-1.5 py-0.5 rounded">👑 最佳场景</span>
                            <p className="mt-1">市区代步为主、家里有充电桩、或作为家庭第二辆车。</p>
                        </div>
                        <div>
                            <span className="font-bold text-emerald-600">✅ 优点</span>
                            <p className="mt-0.5">用车成本极低(几分钱/公里)、静谧性最好、免维护。</p>
                        </div>
                        <div>
                            <span className="font-bold text-red-500">❌ 痛点</span>
                            <p className="mt-0.5">长途节假日充电难、冬季续航衰减。</p>
                        </div>
                    </div>
                </div>
                
                {/* REEV */}
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-emerald-800 mb-3 flex items-center text-sm">
                        <Zap className="mr-2 text-emerald-600" size={18}/> 增程 (REEV)
                    </h4>
                    <div className="text-xs space-y-3 text-slate-700">
                        <div>
                            <span className="font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">👑 最佳场景</span>
                            <p className="mt-1">市区用电+长途用油、家庭唯一用车、追求纯电驾驶感受。</p>
                        </div>
                        <div>
                            <span className="font-bold text-emerald-600">✅ 优点</span>
                            <p className="mt-0.5">完全无里程焦虑、起步快平顺、结构比插混简单。</p>
                        </div>
                        <div>
                            <span className="font-bold text-red-500">❌ 痛点</span>
                            <p className="mt-0.5">高速馈电油耗略高、急加速时发动机噪音。</p>
                        </div>
                    </div>
                </div>

                {/* PHEV */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-orange-800 mb-3 flex items-center text-sm">
                        <Plug className="mr-2 text-orange-600" size={18}/> 插混 (PHEV)
                    </h4>
                    <div className="text-xs space-y-3 text-slate-700">
                        <div>
                            <span className="font-bold bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded">👑 最佳场景</span>
                            <p className="mt-1">经常跑高速、看重综合能耗、希望兼顾动力与油耗。</p>
                        </div>
                        <div>
                            <span className="font-bold text-emerald-600">✅ 优点</span>
                            <p className="mt-0.5">高速直驱更省油、极速更高、全工况适应性强。</p>
                        </div>
                        <div>
                            <span className="font-bold text-red-500">❌ 痛点</span>
                            <p className="mt-0.5">结构最复杂(维护成本潜在高)、纯电续航普遍较短。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * 2. BatteryComparison: Side-by-side comparison card + Solid State Info
 */
const BatteryComparison: React.FC<{ onTermClick: (t: string, d: string) => void }> = ({ onTermClick }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                    <div className="flex items-center mb-3 text-emerald-800">
                        <Battery size={24} className="mr-2" />
                        <h4 className="font-bold text-lg"><RichText text="磷酸铁锂 (LFP)" onTermClick={onTermClick} /></h4>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                            <span className="bg-emerald-200 text-emerald-800 text-xs px-1.5 py-0.5 rounded mr-2 mt-0.5 flex-shrink-0">优点</span>
                            <span className="text-emerald-900">安全性极高（耐高温不起火）、寿命长、成本低（车价便宜）。</span>
                        </div>
                        <div className="flex items-start">
                            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded mr-2 mt-0.5 flex-shrink-0">缺点</span>
                            <span className="text-emerald-900">能量密度低（车重）、怕冷（冬季续航打折多）。</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-emerald-200">
                            适用：南方地区、入门代步车、对安全性极度敏感人群。
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                    <div className="flex items-center mb-3 text-blue-800">
                        <Battery size={24} className="mr-2" />
                        <h4 className="font-bold text-lg"><RichText text="三元锂 (NCM)" onTermClick={onTermClick} /></h4>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                            <span className="bg-blue-200 text-blue-800 text-xs px-1.5 py-0.5 rounded mr-2 mt-0.5 flex-shrink-0">优点</span>
                            <span className="text-blue-900">能量密度高（续航长）、抗低温（冬季表现好）、充放电功率大。</span>
                        </div>
                        <div className="flex items-start">
                            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded mr-2 mt-0.5 flex-shrink-0">缺点</span>
                            <span className="text-blue-900">成本贵、耐高温性略差（需配合好的热管理）、寿命理论略短。</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-blue-200">
                            适用：北方地区、高端长续航车型、性能车。
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                <div className="flex items-center mb-4 text-indigo-900">
                    <FlaskConical size={20} className="mr-2" />
                    <h4 className="font-bold text-lg">未来技术前瞻：固态电池</h4>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-white/60 p-3 rounded-lg">
                        <h5 className="font-bold text-sm text-indigo-800 flex items-center mb-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                            半固态电池 (Semi-Solid)
                        </h5>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            <strong>现状：</strong> 少量量产（如蔚来150度电池包）。<br/>
                            <strong>特点：</strong> 减少了液体电解液含量，能量密度显著提升（可达360Wh/kg），轻松实现1000km续航。<br/>
                            <strong>缺点：</strong> 成本极高（目前只租不卖或天价选装），主要作为品牌展示技术的手段。
                        </p>
                    </div>

                    <div className="bg-white/60 p-3 rounded-lg">
                        <h5 className="font-bold text-sm text-indigo-800 flex items-center mb-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                            全固态电池 (Solid-State)
                        </h5>
                        <div className="text-sm text-slate-700 leading-relaxed">
                            <strong>现状：</strong> 实验室/试制阶段，预计2027-2030年规模化。<br/>
                            <strong>革命性优势：</strong> 彻底取消易燃电解液（本质安全）、能量密度翻倍、充电极快。<br/>
                            <div className="mt-2 pt-2 border-t border-indigo-100">
                                <strong>为什么现在还不成熟？</strong>
                                <ul className="list-disc list-outside ml-4 mt-1 text-xs text-slate-600 space-y-1">
                                    <li><strong>界面阻抗大：</strong> 固体与固体接触不如液体接触紧密，导致离子传输困难（就像在石头里游泳），内阻极大。</li>
                                    <li><strong>制造工艺难：</strong> 需要全新的生产线和设备，良品率极低。</li>
                                    <li><strong>成本天价：</strong> 关键材料（如锂金属负极、硫化物电解质）价格昂贵，目前成本是液态电池的数倍甚至数十倍。</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * 3. InspectionChecklist: Interactive tool with localStorage
 */
const InspectionChecklist: React.FC = () => {
    const defaultItems = [
        { id: 1, text: "检查合格证、发票、车辆一致性证书是否齐全", category: "手续" },
        { id: 2, text: "核对车架号 (VIN) 与证件是否一致", category: "手续" },
        { id: 3, text: "检查车身漆面有无划痕、色差 (特别是保险杠角落)", category: "外观" },
        { id: 4, text: "检查所有玻璃生产日期 (数字代表年份，点代表月份)", category: "外观" },
        { id: 5, text: "检查轮胎生产日期 (四位数字，如3523代表23年第35周)", category: "外观" },
        { id: 6, text: "测试所有车窗升降、天窗开合是否顺畅无异响", category: "功能" },
        { id: 7, text: "测试空调制冷、制热效果", category: "功能" },
        { id: 8, text: "检查内饰座椅是否有污渍、破损", category: "内饰" },
        { id: 9, text: "点火/启动车辆，检查仪表盘有无故障灯", category: "功能" },
        { id: 10, text: "确认随车工具 (充电桩、放电枪、补胎液/备胎) 齐全", category: "附件" },
    ];

    const [checkedItems, setCheckedItems] = useState<number[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('ev_compass_inspection');
        if (saved) {
            setCheckedItems(JSON.parse(saved));
        }
    }, []);

    const toggleItem = (id: number) => {
        const newChecked = checkedItems.includes(id) 
            ? checkedItems.filter(i => i !== id)
            : [...checkedItems, id];
        
        setCheckedItems(newChecked);
        localStorage.setItem('ev_compass_inspection', JSON.stringify(newChecked));
    };

    const progress = Math.round((checkedItems.length / defaultItems.length) * 100);

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-slate-700 flex items-center">
                    <FileCheck size={18} className="mr-2 text-cyan-600" />
                    提车验车清单
                </h4>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">{progress}% 完成</span>
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto">
                {defaultItems.map(item => (
                    <div 
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`p-3 rounded-lg flex items-start cursor-pointer transition-colors ${
                            checkedItems.includes(item.id) ? 'bg-green-50' : 'hover:bg-slate-50'
                        }`}
                    >
                        <div className={`mt-0.5 mr-3 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            checkedItems.includes(item.id) ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'
                        }`}>
                            {checkedItems.includes(item.id) && <CheckCircle size={14} className="text-white" />}
                        </div>
                        <div>
                            <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                                item.category === '手续' ? 'bg-purple-100 text-purple-700' :
                                item.category === '外观' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'
                            }`}>
                                {item.category}
                            </span>
                            <span className={`text-sm ${checkedItems.includes(item.id) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {item.text}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {checkedItems.length === defaultItems.length && (
                <div className="p-3 bg-green-100 text-green-800 text-center text-sm font-bold animate-pulse">
                    🎉 验车完成，恭喜提车！
                </div>
            )}
        </div>
    );
};

/**
 * 4. LoanCalculator: Simple Car Loan Estimator with Subsidy Factor
 */
const LoanCalculator: React.FC = () => {
    const [price, setPrice] = useState(20); // in Wan
    const [downPaymentPercent, setDownPaymentPercent] = useState(15);
    const [term, setTerm] = useState(36);
    const [rate, setRate] = useState(3.0); // Annual Rate
    const [subsidy, setSubsidy] = useState(0); // Subsidy in Yuan

    const loanAmount = price * 10000 * (1 - downPaymentPercent / 100);
    const monthlyRate = rate / 100 / 12;
    // Standard Annuity Monthly Payment: M = P[r(1+r)^n]/[(1+r)^n-1]
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    const totalPayment = monthlyPayment * term;
    const totalInterest = totalPayment - loanAmount;

    // Effective Calculations with Subsidy
    const actualTotalInterest = Math.max(0, totalInterest - subsidy); // Assuming subsidy offsets interest first
    // Net total cost for user (Loan Principal + Net Interest)
    const userTotalPayment = loanAmount + (totalInterest - subsidy); 
    const effectiveMonthlyPayment = userTotalPayment / term;

    return (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
            <div className="flex items-center mb-4 text-slate-700">
                <Calculator size={20} className="mr-2 text-cyan-600" />
                <h4 className="font-bold">车贷计算器 (含贴息)</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="text-xs text-slate-500 block mb-1">车价 (万元)</label>
                    <input 
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full p-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-cyan-500"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1">首付比例 (%)</label>
                    <select 
                        value={downPaymentPercent} 
                        onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                        className="w-full p-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-cyan-500"
                    >
                        <option value={0}>0% (零首付)</option>
                        <option value={15}>15%</option>
                        <option value={20}>20%</option>
                        <option value={30}>30%</option>
                        <option value={50}>50%</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1">贷款期限 (月)</label>
                    <select 
                        value={term} 
                        onChange={(e) => setTerm(Number(e.target.value))}
                        className="w-full p-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-cyan-500"
                    >
                        <option value={12}>12个月 (1年)</option>
                        <option value={24}>24个月 (2年)</option>
                        <option value={36}>36个月 (3年)</option>
                        <option value={48}>48个月 (4年)</option>
                        <option value={60}>60个月 (5年)</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1">银行年化利率 (%)</label>
                    <input 
                        type="number" 
                        value={rate} 
                        step="0.1"
                        onChange={(e) => setRate(Number(e.target.value))}
                        className="w-full p-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-cyan-500"
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs text-slate-500 block mb-1 text-emerald-600 font-bold">商家贴息/优惠 (元)</label>
                    <input 
                        type="number" 
                        value={subsidy} 
                        step="1000"
                        onChange={(e) => setSubsidy(Number(e.target.value))}
                        placeholder="例如: 5000"
                        className="w-full p-2 rounded border border-emerald-200 text-sm focus:outline-none focus:border-emerald-500 bg-emerald-50 text-emerald-700"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                     <span className="text-xs text-slate-500">首付金额</span>
                     <span className="font-bold text-slate-700">{(price * 10000 * downPaymentPercent / 100).toLocaleString('zh-CN')} 元</span>
                </div>
                
                {/* Monthly Payment Row */}
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                     <span className="text-xs text-slate-500">预计月供</span>
                     <div className="text-right">
                        {subsidy > 0 ? (
                             <div className="flex flex-col items-end">
                                 <span className="font-bold text-cyan-600 text-lg">{Math.round(effectiveMonthlyPayment).toLocaleString('zh-CN')} 元</span>
                                 <span className="text-xs text-slate-400 line-through">原: {Math.round(monthlyPayment).toLocaleString('zh-CN')} 元</span>
                             </div>
                        ) : (
                             <span className="font-bold text-cyan-600 text-lg">{Math.round(monthlyPayment).toLocaleString('zh-CN')} 元</span>
                        )}
                     </div>
                </div>

                {/* Total Interest Row */}
                <div className="flex justify-between items-center">
                     <span className="text-xs text-slate-500">总利息支出</span>
                     <div className="text-right">
                        {subsidy > 0 ? (
                            <div className="flex flex-col items-end">
                                <span className={`font-bold ${actualTotalInterest <= 0 ? 'text-green-600' : 'text-orange-500'}`}>
                                    {actualTotalInterest <= 0 ? "已免息" : `${Math.round(actualTotalInterest).toLocaleString('zh-CN')} 元`}
                                </span>
                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded">
                                    省 {(totalInterest - actualTotalInterest).toLocaleString('zh-CN')} 元
                                </span>
                            </div>
                        ) : (
                            <span className="font-bold text-orange-500">{Math.round(totalInterest).toLocaleString('zh-CN')} 元</span>
                        )}
                     </div>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">*此计算结果仅供参考，贴息方案请以实际金融合同为准。</p>
        </div>
    );
};

/**
 * 5. SafetyPyramid: Interactive visualization of safety layers
 */
const SafetyPyramid: React.FC<{ onTermClick: (t: string, d: string) => void }> = ({ onTermClick }) => {
    const [activeLayer, setActiveLayer] = useState<'active' | 'battery' | 'passive'>('passive');

    const layers = {
        active: {
            title: "主动安全 (智慧避险)",
            icon: <Activity size={20} className="text-blue-500" />,
            color: "bg-blue-500",
            lightColor: "bg-blue-50",
            content: [
                { label: "AEB 自动紧急制动", desc: "保命神技。不仅要有，还要看生效速度（例如4-130km/h）。目前第一梯队已能识别鬼探头、夜间行人。" },
                { label: "DOW 开门预警", desc: "针对中国路况神器。停车开门时检测后方来车/骑手，发出警告，防止“开门杀”。" },
                { label: "BSD 盲区监测", desc: "变道时后视镜盲区有车会闪灯报警。新手必备。" }
            ]
        },
        battery: {
            title: "电池安全 (能源核心)",
            icon: <Zap size={20} className="text-emerald-500" />,
            color: "bg-emerald-500",
            lightColor: "bg-emerald-50",
            content: [
                { label: "热失控管理", desc: "核心指标：‘只冒烟不起火’。看厂家宣传是否支持“电芯热失控后24小时无明火”，给足逃生时间。" },
                { label: "底盘防护", desc: "电池在车底最怕磕碰。选车要看底盘平整度，最好有高强度护板（部分车企标配钛合金/锰钢护板）。" },
                { label: "针刺测试", desc: "刀片电池（磷酸铁锂）的强项。模拟电芯内部短路，看是否会剧烈燃烧。" }
            ]
        },
        passive: {
            title: "被动安全 (硬核防守)",
            icon: <Shield size={20} className="text-slate-600" />,
            color: "bg-slate-600",
            lightColor: "bg-slate-50",
            content: [
                { label: "扭转刚度", desc: "衡量车身有多‘硬’的指标。优秀标准：>30,000 Nm/deg。越高越抗撞，且长期开无异响。" },
                { label: "热成型钢占比", desc: "关键部位（A柱、B柱、门槛）必须用热成型钢（强度>1500Mpa）。不要只看铝合金，铝主要为了轻量化，钢才抗撞。" },
                { label: "CIASI 碰撞成绩", desc: "认准‘中保研’（CIASI）。重点看‘驾驶员侧25%偏置碰撞’，必须得G（优秀）。C-NCAP参考价值较低。" }
            ]
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Pyramid Visual */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-4">
                {/* Active Layer (Top) */}
                <button 
                    onClick={() => setActiveLayer('active')}
                    className={`w-40 h-16 rounded-t-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${activeLayer === 'active' ? 'bg-blue-500 text-white scale-105 shadow-lg z-10' : 'bg-blue-100 text-blue-400 hover:bg-blue-200'}`}
                >
                    <span className="font-bold flex items-center"><Activity size={16} className="mr-1"/> 主动安全</span>
                </button>
                
                {/* Battery Layer (Middle) */}
                <button 
                    onClick={() => setActiveLayer('battery')}
                    className={`w-56 h-20 flex items-center justify-center transition-all duration-300 shadow-sm ${activeLayer === 'battery' ? 'bg-emerald-500 text-white scale-105 shadow-lg z-10' : 'bg-emerald-100 text-emerald-400 hover:bg-emerald-200'}`}
                    style={{clipPath: "polygon(10% 0, 90% 0, 100% 100%, 0% 100%)"}}
                >
                     <span className="font-bold flex items-center"><Zap size={16} className="mr-1"/> 电池安全</span>
                </button>

                {/* Passive Layer (Bottom) */}
                <button 
                    onClick={() => setActiveLayer('passive')}
                    className={`w-72 h-24 rounded-b-xl flex items-center justify-center transition-all duration-300 shadow-sm ${activeLayer === 'passive' ? 'bg-slate-600 text-white scale-105 shadow-lg z-10' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                >
                     <span className="font-bold flex items-center"><Shield size={16} className="mr-1"/> 被动安全</span>
                </button>
                <p className="text-xs text-slate-400 mt-2">点击层级查看详情</p>
            </div>

            {/* Details Panel */}
            <div className={`flex-1 rounded-xl p-5 border transition-colors duration-300 ${layers[activeLayer].lightColor} border-opacity-50 border-slate-200`}>
                <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-lg ${activeLayer === 'passive' ? 'bg-slate-200' : activeLayer === 'battery' ? 'bg-emerald-200' : 'bg-blue-200'} mr-3`}>
                        {layers[activeLayer].icon}
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">{layers[activeLayer].title}</h4>
                </div>
                
                <div className="space-y-4">
                    {layers[activeLayer].content.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                            <h5 className="font-bold text-sm text-slate-700 mb-1"><RichText text={item.label} onTermClick={onTermClick} /></h5>
                            <p className="text-sm text-slate-500 leading-relaxed"><RichText text={item.desc} onTermClick={onTermClick} /></p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const KnowledgeBase: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<string>('basics');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTerm, setActiveTerm] = useState<{term: string, def: string} | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleTermClick = (term: string, def: string) => {
      setActiveTerm({ term, def });
  };

  const stages: Stage[] = [
    {
      id: 'basics',
      title: '第一阶段：新能源入门课',
      description: '买车前必须搞懂的基础概念',
      icon: <Compass className="text-cyan-600" />,
      articles: [
        {
          id: 'power_types',
          title: "动力形式大比拼：BEV vs REEV vs PHEV",
          icon: <Disc className="text-purple-500" />,
          content: [
            // Content is now handled by PowerFlowDiagram for this ID
            { subtitle: "文本概览", text: "上方图解展示了三者核心区别。BEV纯电驱动；REEV增程器只发电；PHEV发动机可直驱。" }
          ]
        },
        {
          id: 'battery_types',
          title: "动力电池详解：磷酸铁锂 vs 三元锂 vs 固态",
          icon: <Battery className="text-green-600" />,
          content: [
             // Content handled by BatteryComparison
             { subtitle: "选择建议", text: "根据用车地域和预算选择。北方用户优先三元锂，追求性价比选磷酸铁锂。" }
          ]
        },
        {
            id: 'range_std',
            title: "续航标准详解：CLTC vs WLTP",
            icon: <Layers className="text-cyan-500" />,
            content: [
              { subtitle: "CLTC (中国标准)", text: "目前国内主流标准。测试工况偏向城市低速拥堵路况，因为没有超高速工况，且空调负荷计算较轻，所以标称里程偏高，实际驾驶大约要打 7-8 折（高速可能 6 折）。" },
              { subtitle: "WLTP (全球统一)", text: "更加严苛，包含高速工况。其数据比 CLTC 更接近真实用车情况，通常 WLTP 里程是 CLTC 的 80-85% 左右。" }
            ]
        },
        {
          id: 'electrical_basics',
          title: "电学基础：kW、kWh 与 5C",
          icon: <Zap className="text-yellow-500" />,
          content: [
            { 
              subtitle: "水桶理论：秒懂 kW 和 kWh", 
              text: "• kWh (度) = 水桶大小 -> 决定续航里程。电池越大，装的电越多。\n• kW (千瓦) = 水管粗细 -> 决定速度。电机功率大(kW高)跑得快，充电功率大(kW高)充得快。" 
            },
            { 
              subtitle: "5C 超充是什么概念？", 
              text: "C 代表充电倍率 (Rate)。公式：C = 充电功率 / 电池容量。\n• 1C = 1小时充满\n• 4C = 15分钟充满\n• 5C = 12分钟充满 (目前量产最快水平，需配合800V高压平台)" 
            }
          ]
        }
      ]
    },
    {
      id: 'selection',
      title: '第二阶段：如何选对车',
      description: '智驾、安全与核心配置分析',
      icon: <Search className="text-blue-600" />,
      articles: [
        {
            id: 'safety_indicators',
            title: "安全硬核指标：除了气囊还能看什么？",
            icon: <ShieldCheck className="text-emerald-500" />,
            content: [
              // Handled by SafetyPyramid
              { subtitle: "概览", text: "安全是一票否决项。点击下方金字塔了解主动安全、电池安全与被动安全的硬核指标。" }
            ]
        },
        {
          id: 'smart_driving',
          title: "智能驾驶分级：从 L2 到 NOA",
          icon: <Cpu className="text-blue-500" />,
          content: [
            { 
              subtitle: "SAE 驾驶自动化分级标准 (L0-L5)", 
              text: `L0: 无自动化 (纯手动)
L1: 辅助驾驶 (如定速巡航，脚可脱离)
L2: 部分自动驾驶 (车道保持+ACC，手和眼不可脱离)
L3: 有条件自动驾驶 (在特定条件下允许脱手脱眼，但需随时接管)
L4: 高度自动驾驶 (Robotaxi，特定区域内无需驾驶员)
L5: 完全自动驾驶 (任何路况都无需驾驶员)` 
            },
            { 
              subtitle: "残酷的真相：现在卖的都是 L2", 
              text: "无论车企宣传是 L2+、L2.5 还是 L2.9，从法规责任界定上，目前市售量产车统统属于 L2 级辅助驾驶。这意味着：驾驶员永远是第一责任人，车只是在帮你省力，出了事故（在绝大多数情况下）是你负责，而不是车企。千万不要睡觉或看手机！" 
            },
            { subtitle: "L2 基础辅助", text: "基础能力。包含 ACC（自适应巡航）和 LCC（车道居中保持）。车能自己跟着前车跑，并在车道内画龙，但需要人时刻盯着。" },
            { subtitle: "高速 NOA / NGP", text: "导航辅助驾驶。在高速公路上，车可以根据导航自己变道超车、进出匝道。目前主流新势力（蔚小理、华为）都做得很好。" },
            { subtitle: "城市 NOA / ADS", text: "进阶能力。在复杂的城市街道也能自动驾驶，识别红绿灯、避让行人外卖车。是目前技术竞争的高地，华为 ADS 和小鹏 XNGP 处于第一梯队。" }
          ]
        },
        {
          id: 'vision_vs_lidar',
          title: "技术路线：纯视觉 vs 激光雷达",
          icon: <Scan className="text-indigo-500" />,
          content: [
            {
              subtitle: "纯视觉方案 (代表：Tesla)",
              text: "• 原理：像人眼一样，完全依靠摄像头拍摄画面，配合强大的AI算法来“看懂”路况。\n• 优点：成本低，更接近人类驾驶逻辑。\n• 缺点：极度依赖算法，在恶劣天气（大雨大雪）或光线不足/过曝（进出隧道）时容易失效，对白色物体（如侧翻的白色货车）识别有物理局限。"
            },
            {
              subtitle: "融合感知方案 (代表：国产新势力)",
              text: "• 原理：摄像头 + 激光雷达 (LiDAR)。激光雷达自带光源，主动发射激光扫描周围，构建3D世界。\n• 优点：不受光线影响，黑夜也能看清；对异形障碍物（如路中间的石头）识别极其精准。\n• 缺点：成本昂贵，车顶通常有“犄角”。"
            },
            {
              subtitle: "总结",
              text: "在中国这种复杂的路况下（电动车逆行、鬼探头），激光雷达方案通常被认为具有更高的安全冗余。"
            }
          ]
        },
        {
            id: '800v',
            title: "800V 高压平台：为什么它很重要？",
            icon: <Zap className="text-yellow-500" />,
            content: [
              { subtitle: "充电快", text: "相比传统的 400V 平台，800V 平台配合超充桩，可以实现 '充电10分钟，续航300公里'，大大缓解补能焦虑。" },
              { subtitle: "能耗低", text: "电压升高，电流减小，线路发热损耗降低。这意味着同样的电池度数，800V 平台的车能跑得更远，续航达成率更高。" }
            ]
        },
        {
          id: 'smart_cabin',
          title: "智能座舱深度解析：不只是大彩电",
          icon: <Smartphone className="text-indigo-500" />,
          content: [
            { 
              subtitle: "1. 芯片算力：流畅度的基石", 
              text: "就像买手机看处理器一样，车机流畅度取决于芯片。目前 高通骁龙 8155 是主流“及格线”，而 8295 则是旗舰标配（AI算力是8155的8倍）。强大的算力支撑了毫秒级触控响应、3D桌面渲染和多任务处理不卡顿。" 
            },
            { 
              subtitle: "2. 操作系统 (OS) 与互联生态", 
              text: "现在的车机越来越像手机。华为鸿蒙 (HarmonyOS)、小米澎湃 (HyperOS)、魅族 (Flyme Auto) 代表了第一梯队。它们的核心优势是 “手车互联”：手机导航自动流转到车机、手机APP直接在车机上用、剪贴板共享。车机不再是信息孤岛，而是手机的“大号外设”。" 
            },
            { 
              subtitle: "3. 语音交互：可见即可说", 
              text: "现在的语音助手已经进化了。核心能力包括：\n• 可见即可说：屏幕上能看到的文字按钮，都能直接语音点击，无需动手。\n• 四音区识别：后排乘客说“打开窗户”，系统能识别声音位置，只打开对应车窗。\n• 免唤醒连续对话：唤醒一次后，可以连续下达十条指令，无需反复喊“你好xx”。" 
            },
            { 
              subtitle: "4. 3D 沉浸式车控", 
              text: "利用虚幻引擎 (Unreal) 或 Unity 渲染，车机屏幕上就是一辆逼真的3D车模。你想控制车窗、尾门、充电口、后视镜，直接在屏幕模型的对应位置拖拽即可，所见即所得。这也延伸出了“小憩模式”、“露营模式”等场景化功能，一键联动座椅、空调、灯光和音响。" 
            }
          ]
        }
      ]
    },
    {
      id: 'purchasing',
      title: '第三阶段：购车实战',
      description: '政策、定金与金融避坑',
      icon: <Banknote className="text-emerald-600" />,
      articles: [
        {
            id: 'tax_policy',
            title: "购置税政策深度解读 (2024-2027)",
            icon: <Coins className="text-red-500" />,
            content: [
              { subtitle: "2024-2025年：三万元免税额度", text: "在2024年1月1日至2025年12月31日期间，购买新能源乘用车免征车辆购置税，但每辆车免税额不超过3万元。这意味着开票价在33.9万元（含税）以下的车完全免税，超过部分需按10%补缴。" },
              { subtitle: "2026-2027年：优惠减半", text: "政策预告：从2026年1月1日开始，新能源车购置税将改为“减半征收”，且每辆车减税额不超过1.5万元。" },
              { subtitle: "2025年底锁单兜底", text: "部分新势力品牌（如小米、蔚来、小鹏、鸿蒙智行等）在面临购置税退坡或排产延期时，往往会推出‘兜底政策’：即只要在2025年12月31日前完成锁单，即使因厂家原因导致2026年提车，多出的购置税差额由厂家补贴。建议年底购车时重点关注官方公告。" },
            ]
        },
        {
          id: 'best_timing',
          title: "最佳购车时机：一年中哪天最便宜？",
          icon: <Calendar className="text-purple-500" />,
          content: [
            { 
                subtitle: "日历维度：年底冲量最疯狂", 
                text: "• 6月/12月 (冲量期)：经销商为了拿厂家半年/全年的返点奖励，必须完成销量任务。这时候为了走量，甚至可能亏本卖车，是砍价的黄金期。\n• 车展期间 (4月/8月/11月)：厂家直接出政策，虽然优惠大，但不如年底经销商急眼的时候。\n• 避坑：春节前（需求大、库存少，回收优惠）、金九银十（传统旺季，价格坚挺）。" 
            },
            { 
                subtitle: "生命周期维度：早买早享受，晚买享折扣", 
                text: "• 上市初期 (首发权益期)：厂家为了打响第一炮，通常会附赠大量限时权益（如免费升级轮毂/真皮座椅、终身质保、大额积分）。虽然车价本身优惠少，但折算权益后性价比极高。对于追求最新体验的用户，这是“早买早享受”的最佳时机。\n• 上市6-12个月 (市场冷静期)：首发热度过后，销量趋于平稳。早期的小Bug通常已被修复，产品更成熟。此时可能会有少量隐性优惠或保险补贴。\n• 改款换代前夕 (清库抄底期)：比如老款清库存给新款让路。适合对智能化/最新外观要求不高，但追求极致性价比的务实派用户。" 
            }
          ]
        },
        {
          id: 'deposit',
          title: "购车黑话：大定、小定与权益",
          icon: <ScrollText className="text-blue-500" />,
          content: [
            { subtitle: "小定 (意向金)", text: "通常为几百至一两千元，支付后可随时退款。主要用于抢占排队名额或锁定部分早鸟权益。" },
            { subtitle: "大定 (定金)", text: "通常为5000元，支付后不可退款，车辆进入排产锁定状态。此时配置无法更改，后悔只能损失定金。" },
            { subtitle: "权益 (购车福利)", text: "包含终身质保、免费充电额度、积分赠送、家用充电桩安装服务等。通常下大定锁单时会锁定这些权益，部分品牌（如蔚来）的权益还会区分首任车主和二手车主。" }
          ]
        },
        {
            id: 'finance',
            title: "金融贷款套路：免息 vs 返点",
            icon: <Banknote className="text-emerald-500" />,
            content: [
              { subtitle: "厂家免息", text: "真正的福利。厂家为了促销贴息，消费者只需要还本金。这种方案通常没有坑，是最划算的贷款方式。" },
              { subtitle: "高息返点", text: "4S店或销售会推荐你做高息贷款（年化费率看着低，但实际年化利率可能高达8-10%），然后承诺给你车价优惠。要注意计算总利息支出是否超过了优惠金额。" },
              { subtitle: "计算器", text: "使用上方计算器估算您的月供成本。" }
            ]
        }
      ]
    },
    {
        id: 'delivery',
        title: '第四阶段：提车与上牌',
        description: '验车细节与充电桩安装',
        icon: <FileCheck className="text-orange-600" />,
        articles: [
            {
                id: 'inspection',
                title: "提车验车宝典",
                icon: <Search className="text-orange-500" />,
                content: [
                  // Checklist Component handles this
                  { subtitle: "提示", text: "请使用上方的交互式清单逐项检查。" }
                ]
            },
            {
                id: 'home_charger',
                title: "家用充电桩安装攻略",
                icon: <Wrench className="text-gray-500" />,
                content: [
                  { subtitle: "申请电表", text: "买车后凭购车合同、车位产权/租赁证明，在国家电网/南方电网APP申请专用电表。这一步是免费的，且能享受峰谷电价。" },
                  { subtitle: "功率选择", text: "能装380V（11kW/21kW）尽量装380V，充电速度快且兼容性好。如果小区只能装220V，则只能选7kW。" }
                ]
            },
            {
                id: 'insurance_buy',
                title: "新能源车险购买指南",
                icon: <ShieldCheck className="text-emerald-600" />,
                content: [
                  { subtitle: "为什么贵？", text: "新能源车维修成本高、智能化部件昂贵（如激光雷达在保险杠），导致保费普遍比同价位油车贵20%。" },
                  { subtitle: "怎么买？", text: "首年通常需要在店内购买。建议包含：车损险（覆盖电池自燃）、第三者责任险（建议300万起）、医保外用药责任险。" }
                ]
            }
        ]
    },
    {
      id: 'ownership',
      title: '第五阶段：用车全攻略',
      description: '养护、安全与驾驶习惯',
      icon: <Car className="text-purple-600" />,
      articles: [
        {
            id: 'charging_tips',
            title: "充电养护：如何延长电池寿命？",
            icon: <Plug className="text-orange-500" />,
            content: [
              { subtitle: "20-80% 法则", text: "对于三元锂电池，尽量避免充满至100%或用到0%。保持电量在20%-80%区间最利于寿命。磷酸铁锂电池建议每周至少充满一次以校准电量。" },
              { subtitle: "避免过充过放", text: "长期停放不开时，电量保持在50%左右。切勿亏电存放，否则会导致电池不可逆损伤。" }
            ]
        },
        {
            id: 'winter_usage',
            title: "冬季用车：续航打折怎么办？",
            icon: <Snowflake className="text-sky-400" />,
            content: [
              { subtitle: "电池预热", text: "出门前，连着充电桩开启“电池预热”或“开启空调”。这样使用的是电网的电来热车，出发时电池温度适宜，续航不缩水。" },
              { subtitle: "胎压监测", text: "气温降低会导致胎压下降，增加滚动阻力。冬季适当将胎压打高0.1-0.2bar，可以提升续航。" }
            ]
        },
        {
          id: 'single_pedal',
          title: "单踏板模式与动能回收",
          icon: <Footprints className="text-emerald-500" />,
          content: [
            { 
              subtitle: "原理：并不是刹车失灵", 
              text: "松开油门时，电机反转变成发电机，利用车辆惯性发电反充给电池。这会产生阻力（拖拽感），让车减速。熟练后可以仅靠控制油门深浅来控制车速，减少踩刹车的次数。" 
            },
            { 
              subtitle: "法规调整：拒绝'强制'单踏板", 
              text: "2024年工信部征求意见稿指出，对于具有再生制动功能的车辆，其制动效果不能使车辆完全停止（除非驾驶员主动制动），且车企不得强制用户使用单踏板模式。这意味着用户必须拥有选择权：你可以选择像油车一样松油门滑行（低动能回收），也可以选择强动能回收。" 
            }
          ]
        },
        {
            id: 'smart_driving_safety',
            title: "智驾安全：这只是辅助，不是自动！",
            icon: <Radio className="text-red-500" />,
            content: [
              { subtitle: "手扶方向盘", text: "无论宣传多么智能，目前的L2+或NOA系统都要求驾驶员手扶方向盘，时刻准备接管。千万不要睡觉或看手机！" },
              { subtitle: "ODD (运行设计域)", text: "智驾系统有它的局限性。在大雨、大雪、浓雾、路面标线不清、修路改道等场景下，系统极其容易失效。这时候必须人工驾驶。" }
            ]
        },
        {
            id: 'warranty',
            title: "电池终身质保的那些“坑”",
            icon: <AlertTriangle className="text-red-500" />,
            content: [
              { subtitle: "首任车主限制", text: "绝大多数终身质保只针对第一任车主。卖车后，二手车主通常只享受8年12-16万公里的国家强制质保。" },
              { subtitle: "严苛条款", text: "通常要求：1. 全程在4S店保养；2. 车辆未发生过重大事故伤及底盘；3. 年行驶里程不超过3万公里（防止跑网约车）。" }
            ]
        }
      ]
    }
  ];

  const activeStage = stages.find(s => s.id === activeStageId) || stages[0];

  const renderArticleContent = (article: Article) => {
      // Inject interactive components based on Article ID
      if (article.id === 'power_types') {
          return <PowerFlowDiagram onTermClick={handleTermClick} />;
      }
      if (article.id === 'battery_types') {
          return <BatteryComparison onTermClick={handleTermClick} />;
      }
      if (article.id === 'inspection') {
          return <InspectionChecklist />;
      }
      if (article.id === 'safety_indicators') {
          return <SafetyPyramid onTermClick={handleTermClick} />;
      }

      // Default Text Content, with LoanCalculator injection for finance
      return (
        <div>
            {article.id === 'finance' && <LoanCalculator />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {article.content.map((section, sIdx) => (
                    <div key={sIdx} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <h5 className="font-bold text-cyan-700 text-sm mb-2 flex items-center">
                            <Info size={14} className="mr-2" />
                            <RichText text={section.subtitle} onTermClick={handleTermClick} />
                        </h5>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                            <RichText text={section.text} onTermClick={handleTermClick} />
                        </p>
                    </div>
                ))}
            </div>
        </div>
      );
  };

  return (
    <div className="max-w-6xl mx-auto">
        {/* Term Definition Modal */}
        {activeTerm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setActiveTerm(null)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-scaleIn" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setActiveTerm(null)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                            <Book size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{activeTerm.term}</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                        {activeTerm.def}
                    </p>
                </div>
            </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-10 animate-fadeIn">
             <h2 className="text-3xl font-bold text-slate-800">新能源汽车知识百科</h2>
             <p className="text-slate-500 mt-3 max-w-2xl mx-auto">汇集全网最硬核的购车干货，将复杂的汽车知识拆解为五个简单的阶段，助你从小白变身老司机。</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
            {/* Navigation Sidebar */}
            <div className="lg:w-72 flex-shrink-0">
                <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Mobile: Horizontal scrollable / Desktop: Vertical list */}
                    <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible scrollbar-hide divide-x lg:divide-x-0 lg:divide-y divide-slate-50">
                        {stages.map((stage) => {
                            const isActive = activeStageId === stage.id;
                            const shortTitle = stage.title.split('：')[1] || stage.title;
                            
                            return (
                                <button
                                    key={stage.id}
                                    onClick={() => {
                                        setActiveStageId(stage.id);
                                        setExpandedId(null);
                                    }}
                                    className={`
                                        flex-shrink-0 flex items-center p-4 lg:p-5 text-left transition-all relative min-w-[200px] lg:min-w-0
                                        ${isActive ? 'bg-cyan-50/50' : 'hover:bg-slate-50'}
                                    `}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 hidden lg:block rounded-r-full"></div>
                                    )}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 lg:hidden rounded-t-full"></div>
                                    )}
                                    
                                    <div className={`mr-4 p-2 rounded-lg ${isActive ? 'bg-white text-cyan-600 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                                        {React.cloneElement(stage.icon as React.ReactElement<any>, { size: 20 })}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${isActive ? 'text-cyan-900' : 'text-slate-700'}`}>{shortTitle}</h4>
                                        <p className={`text-xs mt-0.5 ${isActive ? 'text-cyan-600' : 'text-slate-400'} line-clamp-1 lg:line-clamp-2`}>{stage.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-[600px]">
                 <div key={activeStage.id} className="animate-fadeIn">
                      {/* Stage Banner */}
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
                          <div className="relative z-10">
                              <div className="flex items-center space-x-2 mb-4 text-cyan-300 text-xs font-bold tracking-wider uppercase">
                                  <span className="bg-white/10 px-2 py-1 rounded">当前阶段</span>
                                  <span>Step {stages.findIndex(s => s.id === activeStageId) + 1}/5</span>
                              </div>
                              <h3 className="text-2xl lg:text-3xl font-bold mb-3">{activeStage.title}</h3>
                              <p className="text-slate-300 leading-relaxed max-w-2xl">{activeStage.description}。本章节包含 {activeStage.articles.length} 个核心知识点，建议详细阅读。</p>
                          </div>
                      </div>
                      
                      {/* Articles List */}
                      <div className="space-y-4">
                          {activeStage.articles.map((article) => {
                              const isExpanded = expandedId === article.id;
                              return (
                                  <div 
                                      key={article.id} 
                                      className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-cyan-200 shadow-md ring-1 ring-cyan-100' : 'border-slate-100 hover:border-cyan-200'}`}
                                  >
                                      <button 
                                          onClick={() => toggleExpand(article.id)}
                                          className="w-full p-5 flex items-center justify-between text-left focus:outline-none"
                                      >
                                          <div className="flex items-center space-x-4">
                                              <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-cyan-50' : 'bg-slate-50'}`}>
                                                  {article.icon}
                                              </div>
                                              <div>
                                                  <h4 className={`font-bold text-lg ${isExpanded ? 'text-cyan-800' : 'text-slate-800'}`}>{article.title}</h4>
                                                  {!isExpanded && (
                                                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 hidden sm:block">点击查看详情...</p>
                                                  )}
                                              </div>
                                          </div>
                                          <div className={`transform transition-transform duration-300 text-slate-400 ${isExpanded ? 'rotate-180 text-cyan-600' : ''}`}>
                                              {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                          </div>
                                      </button>
                                      
                                      {/* Expandable Content */}
                                      <div 
                                          className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                      >
                                          <div className="p-5 pt-0 border-t border-slate-50 bg-slate-50/30">
                                              {renderArticleContent(article)}
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default KnowledgeBase;