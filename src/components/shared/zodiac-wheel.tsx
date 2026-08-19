import { cn } from "@/lib/utils";

export function ZodiacWheel({
  className,
  size = 120,
  spinOnHover = false,
}: {
  className?: string;
  size?: number;
  spinOnHover?: boolean;
}) {
  const signs = [
    "♈", "♉", "♊", "♋", "♌", "♍",
    "♎", "♏", "♐", "♑", "♒", "♓",
  ];
  const radius = 42;
  const center = 50;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn(spinOnHover && "group cursor-pointer", className)}
      fill="none"
    >
      <circle
        cx={center}
        cy={center}
        r={radius + 6}
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.3"
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="currentColor"
        strokeWidth="0.3"
        opacity="0.2"
      />
      <circle
        cx={center}
        cy={center}
        r={radius - 8}
        stroke="currentColor"
        strokeWidth="0.3"
        opacity="0.15"
      />
      {signs.map((sign, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <text
            key={sign}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="6"
            fill="currentColor"
            opacity="0.7"
          >
            {sign}
          </text>
        );
      })}
      {spinOnHover && (
        <g className="group-hover:spin-slow origin-center" style={{ transformBox: "fill-box" }}>
          <line x1={center} y1={center} x2={center + 18} y2={center} stroke="currentColor" strokeWidth="0.4" opacity="0.4" strokeLinecap="round" />
        </g>
      )}
      <circle cx={center} cy={center} r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}