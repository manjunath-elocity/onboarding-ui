import React from 'react';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center cursor-pointer mb-4">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-10 h-6 bg-gray-300 rounded-full shadow-inner transition-colors ${
          checked ? 'bg-green-500' : ''
        }`}>
          <div className={`absolute w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          } top-1`} />
        </div>
      </div>
      <div className="ml-3 text-sm font-medium text-gray-700">{label}</div>
    </label>
  );
};