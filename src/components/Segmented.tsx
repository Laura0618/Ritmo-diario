interface SegmentedProps<T extends number> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
  disabled?: boolean;
}

export function Segmented<T extends number>({
  label,
  options,
  value,
  onChange,
  format = String,
  disabled = false,
}: SegmentedProps<T>): JSX.Element {
  return (
    <div className="seg" role="group" aria-label={label} data-locked={disabled ? '1' : undefined}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          aria-pressed={opt === value}
          disabled={disabled}
          onClick={() => onChange(opt)}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  );
}
