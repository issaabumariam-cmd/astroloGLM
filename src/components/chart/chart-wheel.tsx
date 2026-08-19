import type { ChartData } from "@/lib/astrology/chart";

export function ChartWheel({ chart, size = 400 }: { chart: ChartData; size?: number }) {
  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const innerRadius = outerRadius - 30;
  const signRadius = outerRadius - 15;
  const houseRadius = innerRadius - 10;
  const planetRadius = innerRadius - 35;

  const signs = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

  const planetColors: Record<string, string> = {
    sun: "#e8a838",
    moon: "#c4c4d4",
    mercury: "#a0a0a0",
    venus: "#d4a890",
    mars: "#c0563a",
    jupiter: "#b8986a",
    saturn: "#6b6157",
    uranus: "#6ba0c4",
    neptune: "#5b8fa8",
    pluto: "#4a3b4a",
  };

  function polarToCartesian(angleDeg: number, radius: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  }

  const ascendantAngle = chart.rising.longitude;
  const offset = ascendantAngle;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="var(--color-border-strong)" strokeWidth="1" />
      <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
      <circle cx={center} cy={center} r={houseRadius} fill="none" stroke="var(--color-border)" strokeWidth="0.5" />

      {signs.map((glyph, i) => {
        const angle = i * 30;
        const pos = polarToCartesian(angle - offset + 15, signRadius);
        return (
          <text
            key={glyph}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="14"
            fill="var(--color-primary)"
            opacity="0.7"
          >
            {glyph}
          </text>
        );
      })}

      {signs.map((_, i) => {
        const angle = i * 30 - offset;
        const outer = polarToCartesian(angle, outerRadius);
        const inner = polarToCartesian(angle, innerRadius);
        return (
          <line
            key={`sign-line-${i}`}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke="var(--color-border-strong)"
            strokeWidth="0.5"
          />
        );
      })}

      {chart.houses.map((house) => {
        const angle = house.cusp - offset;
        const outer = polarToCartesian(angle, innerRadius);
        const inner = polarToCartesian(angle, houseRadius);
        return (
          <line
            key={`house-${house.num}`}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke="var(--color-border-strong)"
            strokeWidth="0.5"
          />
        );
      })}

      {chart.houses.map((house) => {
        const midAngle = house.cusp + 15 - offset;
        const pos = polarToCartesian(midAngle, houseRadius - 15);
        return (
          <text
            key={`house-num-${house.num}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fill="var(--color-foreground-subtle)"
          >
            {house.num}
          </text>
        );
      })}

      {chart.planets.map((planet) => {
        const angle = planet.longitude - offset;
        const pos = polarToCartesian(angle, planetRadius);
        const color = planetColors[planet.id] || "var(--color-primary)";
        return (
          <g key={planet.id}>
            <circle cx={pos.x} cy={pos.y} r="11" fill="var(--color-surface)" stroke={color} strokeWidth="1" />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fill={color}
            >
              {planet.glyph}
            </text>
            {planet.retrograde && (
              <text
                x={pos.x}
                y={pos.y + 14}
                textAnchor="middle"
                fontSize="7"
                fill={color}
              >
                R
              </text>
            )}
          </g>
        );
      })}

      {chart.aspects.map((aspect, i) => {
        const p1 = chart.planets.find((p) => p.name === aspect.planet1);
        const p2 = chart.planets.find((p) => p.name === aspect.planet2);
        if (!p1 || !p2) return null;
        const pos1 = polarToCartesian(p1.longitude - offset, planetRadius);
        const pos2 = polarToCartesian(p2.longitude - offset, planetRadius);
        const color =
          aspect.type === "trine" || aspect.type === "sextile"
            ? "var(--color-success)"
            : aspect.type === "square" || aspect.type === "opposition"
            ? "var(--color-error)"
            : "var(--color-primary)";
        return (
          <line
            key={`aspect-${i}`}
            x1={pos1.x}
            y1={pos1.y}
            x2={pos2.x}
            y2={pos2.y}
            stroke={color}
            strokeWidth="0.5"
            opacity="0.3"
          />
        );
      })}

      <line
        x1={polarToCartesian(ascendantAngle - offset, outerRadius).x}
        y1={polarToCartesian(ascendantAngle - offset, outerRadius).y}
        x2={polarToCartesian(ascendantAngle - offset, innerRadius).x}
        y2={polarToCartesian(ascendantAngle - offset, innerRadius).y}
        stroke="var(--color-primary)"
        strokeWidth="1.5"
      />
      <line
        x1={center - 4}
        y1={center}
        x2={center + 4}
        y2={center}
        stroke="var(--color-foreground-subtle)"
        strokeWidth="0.5"
      />
      <line
        x1={center}
        y1={center - 4}
        x2={center}
        y2={center + 4}
        stroke="var(--color-foreground-subtle)"
        strokeWidth="0.5"
      />
    </svg>
  );
}