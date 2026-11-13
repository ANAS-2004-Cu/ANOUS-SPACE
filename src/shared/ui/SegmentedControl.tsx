import React from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  equalWidth?: boolean;
  accentActive?: boolean;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  equalWidth = false,
  accentActive = false,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={['ui-segmented', equalWidth ? 'ui-segmented--equal' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={[
              'ui-segmented__item',
              active ? 'ui-segmented__item--active' : '',
              accentActive ? 'ui-segmented__item--accent' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
