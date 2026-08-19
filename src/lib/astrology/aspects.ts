export type Aspect = {
  name: string;
  angle: number;
  orb: number;
  glyph: string;
  nature: "harmonious" | "dynamic" | "neutral";
  description: string;
  meaning: string;
};

export const aspects: Aspect[] = [
  {
    name: "Conjunction",
    angle: 0,
    orb: 8,
    glyph: "☌",
    nature: "neutral",
    description:
      "Planets in the same or adjacent degrees, blending their energies into a powerful fusion.",
    meaning:
      "Intensification and fusion of planetary energies. Can be harmonious or challenging depending on the planets involved. The conjunction marks a focal point of the chart.",
  },
  {
    name: "Sextile",
    angle: 60,
    orb: 4,
    glyph: "⚹",
    nature: "harmonious",
    description: "Planets approximately 60 degrees apart, in compatible elements.",
    meaning:
      "Opportunity and flow. Natural talents that can be developed with modest effort. A gentle, supportive energy that opens doors without forcing them.",
  },
  {
    name: "Square",
    angle: 90,
    orb: 8,
    glyph: "□",
    nature: "dynamic",
    description: "Planets approximately 90 degrees apart, in conflicting elements.",
    meaning:
      "Tension and challenge that drives growth. Internal conflict that demands resolution. The square creates friction that, when worked with consciously, produces character and achievement.",
  },
  {
    name: "Trine",
    angle: 120,
    orb: 8,
    glyph: "△",
    nature: "harmonious",
    description: "Planets approximately 120 degrees apart, in the same element.",
    meaning:
      "Natural ease and flow. Innate gifts and talents that come without effort. The trine represents harmony that should be appreciated and actively used, not taken for granted.",
  },
  {
    name: "Opposition",
    angle: 180,
    orb: 8,
    glyph: "☍",
    nature: "dynamic",
    description: "Planets approximately 180 degrees apart, in opposite signs.",
    meaning:
      "Polarity and awareness. The need to balance opposing forces. Oppositions create awareness through relationship and contrast — they teach us about ourselves through others.",
  },
];

export const getAspectByName = (name: string): Aspect | undefined =>
  aspects.find((a) => a.name.toLowerCase() === name.toLowerCase());