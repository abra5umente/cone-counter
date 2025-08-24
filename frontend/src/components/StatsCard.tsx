import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        </div>
      </div>
    </div>
  );
};
