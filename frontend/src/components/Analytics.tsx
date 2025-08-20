import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeAnalysis } from '../types';

interface AnalyticsProps {
  analysis: TimeAnalysis;
}

export const Analytics: React.FC<AnalyticsProps> = ({ analysis }) => {
  // Prepare data for hour of day chart
  const hourData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    count: analysis.hourOfDay[hour] || 0
  }));

  // Prepare data for day of week chart
  const dayData = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ].map(day => ({
    day,
    count: analysis.dayOfWeek[day] || 0
  }));

  // Prepare data for month chart
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const monthData = monthNames.map((month, index) => ({
    month,
    count: analysis.monthOfYear[index + 1] || 0
  }));



  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics & Trends</h2>
      
      {/* Hour of Day Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cones by Hour of Day</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day of Week Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cones by Day of Week</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#059669" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cones by Month</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#047857" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Peak Hour</h4>
          <p className="text-2xl font-bold text-gray-900">
            {hourData.reduce((max, item) => item.count > max.count ? item : max).hour}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {hourData.reduce((max, item) => item.count > max.count ? item : max).count} cones
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Busiest Day</h4>
          <p className="text-2xl font-bold text-gray-900">
            {dayData.reduce((max, item) => item.count > max.count ? item : max).day}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {dayData.reduce((max, item) => item.count > max.count ? item : max).count} cones
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Peak Month</h4>
          <p className="text-2xl font-bold text-gray-900">
            {monthData.reduce((max, item) => item.count > max.count ? item : max).month}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {monthData.reduce((max, item) => item.count > max.count ? item : max).count} cones
          </p>
        </div>
      </div>
    </div>
  );
};
