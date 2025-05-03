import React from 'react';
import { twMerge } from 'tailwind-merge';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;
  changeLabel?: string;
}

interface StatsProps {
  items: StatItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const StatsCard: React.FC<{item: StatItem, className?: string}> = ({
  item,
  className
}) => {
  const { label, value, icon, change, changeLabel } = item;
  
  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-gray-500';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };
  
  return (
    <div className={twMerge('bg-white rounded-lg shadow p-5 flex flex-col overflow-hidden', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        {change !== undefined && (
          <div className="flex items-center mt-2">
            <div className={`flex items-center ${getChangeColor()}`}>
              {change > 0 ? <ArrowUp size={14} /> : change < 0 ? <ArrowDown size={14} /> : null}
              <span className="text-sm font-medium ml-1">
                {Math.abs(change)}%
              </span>
            </div>
            {changeLabel && (
              <span className="text-sm text-gray-500 ml-2">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Stats: React.FC<StatsProps> = ({
  items,
  columns = 4,
  className
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <div className={twMerge(`grid ${gridCols[columns]} gap-5`, className)}>
      {items.map((item) => (
        <StatsCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default Stats; 