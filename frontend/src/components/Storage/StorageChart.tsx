import React from 'react';
import { StorageStatus } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

interface StorageChartProps {
  storage: StorageStatus;
}

export const StorageChart: React.FC<StorageChartProps> = ({ storage }) => {
  const barColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-gray-200">
      {/* Daily Usage Trend Chart */}
      <div className="bg-[#11141B] border border-[#242933] rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Daily Storage Accumulation (GB)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-gray-400">Past 7 Days</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={storage.dailyUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="storageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#242933" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#242933' }}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#242933' }}
                unit="GB"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#11141B',
                  borderColor: '#242933',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#FFFFFF'
                }}
                formatter={(val: any) => [`${val} GB`, 'Usage']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="usageGB"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#storageGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Camera-by-Camera Usage Breakdown */}
      <div className="bg-[#11141B] border border-[#242933] rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-green-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Storage Usage by Camera
            </h4>
          </div>
          <span className="text-[11px] font-mono text-gray-400">Total: {storage.usedSpaceGB.toFixed(0)} GB</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={storage.cameraBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242933" horizontal={false} />
              <XAxis type="number" stroke="#6B7280" fontSize={11} unit="GB" />
              <YAxis
                dataKey="cameraName"
                type="category"
                stroke="#6B7280"
                fontSize={11}
                width={120}
                tickLine={false}
                axisLine={{ stroke: '#242933' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#11141B',
                  borderColor: '#242933',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#FFFFFF'
                }}
                formatter={(val: any, name: any, item: any) => [
                  `${val} GB (${item.payload.percentage}%)`,
                  'Disk Used'
                ]}
              />
              <Bar dataKey="usageGB" radius={[0, 4, 4, 0]}>
                {storage.cameraBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
