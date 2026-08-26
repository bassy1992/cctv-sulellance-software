import React from 'react';
import { Camera, RecordingFilterParams, TriggerType } from '../../types';
import { Search, Calendar, Clock, Filter, X, RefreshCw } from 'lucide-react';

interface RecordingFiltersProps {
  filters: RecordingFilterParams;
  cameras: Camera[];
  onFilterChange: (filters: Partial<RecordingFilterParams>) => void;
  onReset: () => void;
}

export const RecordingFilters: React.FC<RecordingFiltersProps> = ({
  filters,
  cameras,
  onFilterChange,
  onReset
}) => {
  return (
    <div
      id="recording-filters-bar"
      className="bg-[#11141B] border border-[#242933] rounded-xl p-4 space-y-3 shadow-xs text-gray-200"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Search & Filter Recordings
          </h3>
        </div>

        <button
          id="clear-filters-btn"
          type="button"
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:underline transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Search Query */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            Search Keywords
          </label>
          <div className="relative">
            <input
              id="search-recordings-input"
              type="text"
              value={filters.searchQuery || ''}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Search camera or file path..."
              className="w-full bg-[#161921] border border-[#242933] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Camera Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            Camera
          </label>
          <select
            id="camera-filter-select"
            value={filters.cameraId || 'ALL'}
            onChange={(e) => onFilterChange({ cameraId: e.target.value })}
            className="w-full bg-[#161921] border border-[#242933] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL" className="bg-[#161921] text-white">All Cameras</option>
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id} className="bg-[#161921] text-white">
                {cam.name}
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Type */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            Trigger Type
          </label>
          <select
            id="trigger-filter-select"
            value={filters.triggerType || 'ALL'}
            onChange={(e) => onFilterChange({ triggerType: e.target.value as TriggerType | 'ALL' })}
            className="w-full bg-[#161921] border border-[#242933] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL" className="bg-[#161921] text-white">All Events</option>
            <option value="MOTION" className="bg-[#161921] text-white">Motion Detected</option>
            <option value="CONTINUOUS" className="bg-[#161921] text-white">Continuous 24/7</option>
            <option value="MANUAL" className="bg-[#161921] text-white">Manual Record</option>
            <option value="SCHEDULED" className="bg-[#161921] text-white">Scheduled</option>
          </select>
        </div>

        {/* Date Selector From */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>Date From</span>
          </label>
          <input
            id="date-from-input"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
            className="w-full bg-[#161921] border border-[#242933] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Date Selector To */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>Date To</span>
          </label>
          <input
            id="date-to-input"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onFilterChange({ dateTo: e.target.value })}
            className="w-full bg-[#161921] border border-[#242933] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
