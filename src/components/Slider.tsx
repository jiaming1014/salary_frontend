interface SliderProps {
  label: string
  sublabel?: string
  value: number
  min: number
  max: number
  step: number
  color?: string
  unit?: string
  decimals?: number
  onChange: (value: number) => void
}

export default function Slider({
  label,
  sublabel,
  value,
  min,
  max,
  step,
  color = '#10b981',
  unit = '',
  decimals = 1,
  onChange,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
          {sublabel && (
            <span className="ml-1 text-xs font-normal text-slate-400">{sublabel}</span>
          )}
        </label>
        <span
          className="rounded-md px-2 py-0.5 font-mono text-sm font-bold tabular-nums"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={
          {
            '--thumb-color': color,
            background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgb(226 232 240) ${pct}%, rgb(226 232 240) 100%)`,
            borderRadius: '9999px',
          } as React.CSSProperties
        }
      />
    </div>
  )
}