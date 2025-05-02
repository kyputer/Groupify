import React from 'react';

interface BooleanDropdownProps {
  value: boolean;
  options: { label: string; value: boolean }[];
  onChange: (value: boolean) => void;
  label?: string;
  className?: string;
  labelPosition?: 'top' | 'left' | 'right' | 'bottom';
}

export const BooleanDropdown: React.FC<BooleanDropdownProps> = ({
  value,
  options,
  onChange,
  label,
  className = '',
  labelPosition = 'top'
}) => {
  const containerClasses = {
    top: 'flex flex-col gap-2',
    left: 'flex items-center gap-2',
    right: 'flex items-center gap-2 flex-row-reverse'
  };
  return (
    <div className={`${containerClasses[labelPosition as keyof typeof containerClasses]} ${className} pt-6 pb-6`}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <select
        value={value.toString()}
        onChange={(e) => onChange(e.target.value === 'true')}
        className="p-2 border rounded-md"
      >
        {options.map((option) => (
          <option key={option.value.toString()} value={option.value.toString()}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}; 