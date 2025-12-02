import React from 'react';
import { CarModel, PowerType } from '../types';
import { BatteryCharging, Timer, CircleDollarSign } from 'lucide-react';

interface CarCardProps {
  car: CarModel;
}

const CarCard: React.FC<CarCardProps> = ({ car }) => {
  const getPowerColorClass = (power: PowerType) => {
      switch (power) {
          case PowerType.BEV: return 'bg-cyan-600';
          case PowerType.REEV: return 'bg-emerald-500'; // Matches Green in Chart
          case PowerType.PHEV: return 'bg-orange-500';  // Matches Orange in Chart
          default: return 'bg-slate-600';
      }
  };

  // Logic to determine if we are showing Pure Electric Range for a Hybrid
  // Usually PHEVs with range < 400km in the DB are showing Pure Electric Range
  const isPureRangeDisplay = (car.power === PowerType.PHEV || car.power === PowerType.REEV) && car.range < 400;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-slate-100 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden group">
        <img 
          src={car.imageUrl} 
          alt={car.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-slate-700 shadow-sm">
          {car.type}
        </div>
        <div className={`absolute top-3 left-3 text-white px-2 py-1 rounded-md text-xs font-bold shadow-sm ${getPowerColorClass(car.power)}`}>
          {car.power}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-xs text-slate-500 font-medium">{car.brand}</p>
                <h3 className="text-lg font-bold text-slate-800">{car.name}</h3>
            </div>
            <div className="text-right">
                <span className="block text-lg font-bold text-cyan-700">{car.priceRange[0]}-{car.priceRange[1]}万</span>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2 my-4">
            <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <BatteryCharging size={16} className="text-green-500 mb-1" />
                <span className="text-xs text-slate-500">{isPureRangeDisplay ? '纯电续航' : '续航'}</span>
                <span className="text-sm font-semibold text-slate-700">{car.range}km</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <Timer size={16} className="text-blue-500 mb-1" />
                <span className="text-xs text-slate-500">零百</span>
                <span className="text-sm font-semibold text-slate-700">{car.acceleration}s</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <CircleDollarSign size={16} className="text-orange-500 mb-1" />
                <span className="text-xs text-slate-500">起售价</span>
                <span className="text-sm font-semibold text-slate-700">{car.priceRange[0]}万</span>
            </div>
        </div>

        <div className="mt-auto">
            <div className="flex flex-wrap gap-2">
                {car.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                        {feature}
                    </span>
                ))}
                {car.features.length > 3 && (
                   <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                       +{car.features.length - 3}
                   </span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;