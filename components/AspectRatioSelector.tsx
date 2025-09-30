import React from 'react';

interface AspectRatioSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange, options, label }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="flex gap-2 flex-wrap">
        {options.map((ratio) => (
          <button
            key={ratio}
            onClick={() => onChange(ratio)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${
              value === ratio
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;