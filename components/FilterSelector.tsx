import React from 'react';

export interface Filter {
  name: string;
  prompt: string;
}

interface FilterSelectorProps {
  filters: Filter[];
  onApplyFilter: (prompt: string) => void;
  disabled: boolean;
}

const FilterSelector: React.FC<FilterSelectorProps> = ({ filters, onApplyFilter, disabled }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Or, try a filter:</label>
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => onApplyFilter(filter.prompt)}
            disabled={disabled}
            className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {filter.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterSelector;