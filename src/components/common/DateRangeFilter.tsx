import React from 'react';
import { Calendar } from 'lucide-react';
import { getLocalYYYYMMDD, normalizeToYYYYMMDD } from '../../utils/dateUtils';

export type DatePresetType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export interface DateRangeFilterProps {
  preset: DatePresetType;
  startDate: string;
  endDate: string;
  onPresetChange: (preset: DatePresetType) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
  showCustomLabel?: boolean;
  variant?: 'select' | 'chips';
}

export function computePresetDates(preset: DatePresetType): { startDate: string; endDate: string } {
  const todayStr = getLocalYYYYMMDD();
  if (preset === 'TODAY') {
    return { startDate: todayStr, endDate: todayStr };
  } else if (preset === 'YESTERDAY') {
    const yDate = getLocalYYYYMMDD(new Date(Date.now() - 86400000));
    return { startDate: yDate, endDate: yDate };
  } else if (preset === 'THIS_WEEK') {
    const weekAgo = getLocalYYYYMMDD(new Date(Date.now() - 7 * 86400000));
    return { startDate: weekAgo, endDate: todayStr };
  } else if (preset === 'THIS_MONTH') {
    const now = new Date();
    const firstDay = getLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1));
    return { startDate: firstDay, endDate: todayStr };
  } else if (preset === 'CUSTOM') {
    return { startDate: todayStr, endDate: todayStr };
  }
  return { startDate: '', endDate: '' };
}

export function isDateInSelectedRange(
  dateInput: string | Date | undefined | null,
  preset: DatePresetType,
  startDate: string,
  endDate: string
): boolean {
  if (preset === 'ALL') return true;
  if (!dateInput) return false;

  const itemDateStr = normalizeToYYYYMMDD(dateInput);
  if (!itemDateStr) return false;

  const todayStr = getLocalYYYYMMDD();

  if (preset === 'TODAY') {
    return itemDateStr === todayStr;
  } else if (preset === 'YESTERDAY') {
    const yDate = getLocalYYYYMMDD(new Date(Date.now() - 86400000));
    return itemDateStr === yDate;
  } else if (preset === 'THIS_WEEK') {
    const weekAgo = getLocalYYYYMMDD(new Date(Date.now() - 7 * 86400000));
    return itemDateStr >= weekAgo && itemDateStr <= todayStr;
  } else if (preset === 'THIS_MONTH') {
    const now = new Date();
    const firstDay = getLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1));
    return itemDateStr >= firstDay && itemDateStr <= todayStr;
  } else if (preset === 'CUSTOM') {
    const normStart = normalizeToYYYYMMDD(startDate);
    const normEnd = normalizeToYYYYMMDD(endDate);
    if (normStart && itemDateStr < normStart) return false;
    if (normEnd && itemDateStr > normEnd) return false;
    return true;
  }

  return true;
}

const CHIP_OPTIONS: { id: DatePresetType; label: string }[] = [
  { id: 'ALL', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: 'THIS_WEEK', label: '7 Days' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'CUSTOM', label: 'Custom' }
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  className = '',
  selectClassName = '',
  inputClassName = '',
  showCustomLabel = false,
  variant = 'select'
}) => {
  const handlePresetSelect = (newPreset: DatePresetType) => {
    onPresetChange(newPreset);
    if (newPreset !== 'CUSTOM') {
      const dates = computePresetDates(newPreset);
      onStartDateChange(dates.startDate);
      onEndDateChange(dates.endDate);
    } else {
      const todayStr = getLocalYYYYMMDD();
      if (!startDate) onStartDateChange(todayStr);
      if (!endDate) onEndDateChange(todayStr);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {variant === 'chips' ? (
        /* Chip Pill Group */
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700/60 shadow-2xs">
          {CHIP_OPTIONS.map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handlePresetSelect(chip.id)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                preset === chip.id
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : (
        /* Preset Selector Dropdown */
        <div className="relative min-w-[140px]">
          <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <select
            value={preset}
            onChange={e => handlePresetSelect(e.target.value as DatePresetType)}
            className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer ${selectClassName}`}
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="THIS_WEEK">Last 7 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="CUSTOM">Custom Date Range...</option>
          </select>
        </div>
      )}

      {/* Start Date & End Date Pickers - Only shown when CUSTOM is selected */}
      {preset === 'CUSTOM' && (
        <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
          {showCustomLabel && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Range:</span>
          )}
          <div className="relative">
            <input
              type="date"
              value={normalizeToYYYYMMDD(startDate) || ''}
              onChange={e => {
                const val = e.target.value;
                const norm = normalizeToYYYYMMDD(val) || val;
                onStartDateChange(norm);
              }}
              title="From Date (Start Date)"
              className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${inputClassName}`}
            />
          </div>
          <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">to</span>
          <div className="relative">
            <input
              type="date"
              value={normalizeToYYYYMMDD(endDate) || ''}
              onChange={e => {
                const val = e.target.value;
                const norm = normalizeToYYYYMMDD(val) || val;
                onEndDateChange(norm);
              }}
              title="To Date (End Date)"
              className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${inputClassName}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
