import React from 'react';
import {
  ETHIOPIAN_MONTHS_EN,
  ETHIOPIAN_MONTHS_AM,
  toEthiopian,
  ethiopianToGregorianStr
} from '../utils/ethiopianCalendar';

interface EthiopianDatePickerProps {
  value: string; // Gregorian ISO string YYYY-MM-DD
  onChange: (gregorianStr: string) => void;
  accentColor?: 'emerald' | 'rose' | 'indigo' | 'slate';
}

export default function EthiopianDatePicker({
  value,
  onChange,
  accentColor = 'emerald'
}: EthiopianDatePickerProps) {
  // Parse current Gregorian value to Ethiopian
  let eYear = 2018;
  let eMonth = 9;
  let eDay = 27;

  if (value) {
    try {
      const parts = value.split('-');
      if (parts.length === 3) {
        const gYear = parseInt(parts[0], 10);
        const gMonth = parseInt(parts[1], 10);
        const gDay = parseInt(parts[2], 10);
        const [convertedYear, convertedMonth, convertedDay] = toEthiopian(gYear, gMonth, gDay);
        eYear = convertedYear;
        eMonth = convertedMonth;
        eDay = convertedDay;
      }
    } catch (e) {
      console.error('Failed to parse date in EthiopianDatePicker', e);
    }
  }

  // Determine key years list
  const years = [2015, 2016, 2017, 2018, 2019, 2020];

  // Determine dynamic max days for selection
  let maxDays = 30;
  if (eMonth === 13) {
    // Pagume leap year is eYear % 4 === 3
    maxDays = (eYear % 4 === 3) ? 6 : 5;
  }

  // Handle changes and notify parent with Gregorian string
  const handleDropdownChange = (updatedYear: number, updatedMonth: number, updatedDay: number) => {
    // Ensure day does not exceed max days of updatedMonth
    let finalDay = updatedDay;
    if (updatedMonth === 13) {
      const updatedMax = (updatedYear % 4 === 3) ? 6 : 5;
      if (finalDay > updatedMax) {
        finalDay = updatedMax;
      }
    } else {
      if (finalDay > 30) {
        finalDay = 30;
      }
    }

    const gStr = ethiopianToGregorianStr(updatedYear, updatedMonth, finalDay);
    onChange(gStr);
  };

  // Generate day options array
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Border ring focus styles
  const accentRing =
    accentColor === 'rose'
      ? 'focus:ring-rose-500/20 focus:border-rose-500'
      : accentColor === 'indigo'
      ? 'focus:ring-indigo-500/20 focus:border-indigo-500'
      : accentColor === 'slate'
      ? 'focus:ring-slate-500/20 focus:border-slate-500'
      : 'focus:ring-emerald-500/20 focus:border-emerald-500';

  return (
    <div id="ethiopian-date-picker-container" className="space-y-1.5">
      <div className="grid grid-cols-12 gap-2">
        {/* Month Selector (6 columns) */}
        <div className="col-span-6">
          <select
            id="ethiopian-month-select"
            value={eMonth}
            onChange={(e) => handleDropdownChange(eYear, parseInt(e.target.value, 10), eDay)}
            className={`w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 ${accentRing} font-medium text-slate-800`}
          >
            {ETHIOPIAN_MONTHS_EN.map((name, index) => {
              if (index === 0) return null;
              const amharicName = ETHIOPIAN_MONTHS_AM[index];
              return (
                <option key={index} value={index}>
                  {index} - {amharicName} ({name})
                </option>
              );
            })}
          </select>
        </div>

        {/* Day Selector (3 columns) */}
        <div className="col-span-3">
          <select
            id="ethiopian-day-select"
            value={eDay}
            onChange={(e) => handleDropdownChange(eYear, eMonth, parseInt(e.target.value, 10))}
            className={`w-full text-xs px-2 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 ${accentRing} font-mono font-bold text-center text-slate-800`}
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {String(d).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector (3 columns) */}
        <div className="col-span-3">
          <select
            id="ethiopian-year-select"
            value={eYear}
            onChange={(e) => handleDropdownChange(parseInt(e.target.value, 10), eMonth, eDay)}
            className={`w-full text-xs px-2 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 ${accentRing} font-mono font-bold text-center text-slate-800`}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y} EC
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Help subtitle representing the translated Gregorian date */}
      <div className="flex justify-between items-center px-1 text-[10px] text-slate-400">
        <span>Ethiopian Calendar Grid format</span>
        <span className="font-mono">{value} (Gregorian target)</span>
      </div>
    </div>
  );
}
