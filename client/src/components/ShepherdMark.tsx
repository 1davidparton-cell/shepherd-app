// ShepherdMark.tsx — the shepherd's crook (leaned 8 deg, centered in its box)
type ShepherdMarkProps = {
  size?: number;
  color?: string;
  stroke?: number;
  className?: string;
};

export function ShepherdMark({
  size = 84,
  color = '#c9a84c',
  stroke = 8,
  className,
}: ShepherdMarkProps) {
  return (
    <svg
      width={size}
      height={size * 1.286}
      viewBox="16 22 140 180"
      className={className}
      role="img"
      aria-label="Shepherd's crook"
    >
      <g transform="rotate(8 65 150)">
        <path
          d="M58 172 L58 76 C58 42 104 42 102 80 C101 94 94 96 90 88"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}