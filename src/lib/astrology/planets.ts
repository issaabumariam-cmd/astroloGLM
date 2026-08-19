export type Planet = {
  id: string;
  name: string;
  glyph: string;
  rules: string[];
  exalted: string;
  falls: string;
  detriment: string;
  keywords: string[];
  description: string;
  cycleDays?: number;
  color: string;
};

export const planets: Planet[] = [
  {
    id: "sun",
    name: "Sun",
    glyph: "☉",
    rules: ["leo"],
    exalted: "aries",
    falls: "libra",
    detriment: "aquarius",
    keywords: ["self", "vitality", "ego", "identity", "purpose"],
    description:
      "The core of your chart — your essential self, your vitality, and the light you shine into the world. The Sun represents your fundamental identity and life purpose.",
    color: "#e8a838",
  },
  {
    id: "moon",
    name: "Moon",
    glyph: "☽",
    rules: ["cancer"],
    exalted: "taurus",
    falls: "scorpio",
    detriment: "capricorn",
    keywords: ["emotion", "instincts", "needs", "memory", "mother"],
    description:
      "Your emotional nature — how you feel, what you need for security, and your instinctive responses. The Moon reveals your inner world and emotional landscape.",
    color: "#c4c4d4",
    cycleDays: 27.3,
  },
  {
    id: "mercury",
    name: "Mercury",
    glyph: "☿",
    rules: ["gemini", "virgo"],
    exalted: "virgo",
    falls: "pisces",
    detriment: "sagittarius",
    keywords: ["communication", "thinking", "learning", "reason", "movement"],
    description:
      "Your mind — how you think, communicate, learn, and process information. Mercury governs all forms of exchange: words, ideas, data, and movement.",
    color: "#a0a0a0",
    cycleDays: 88,
  },
  {
    id: "venus",
    name: "Venus",
    glyph: "♀",
    rules: ["taurus", "libra"],
    exalted: "pisces",
    falls: "virgo",
    detriment: "scorpio",
    keywords: ["love", "beauty", "values", "harmony", "attraction"],
    description:
      "What you love and value — your aesthetic sense, romantic nature, and capacity for pleasure. Venus reveals what brings you joy and how you relate to others.",
    color: "#d4a890",
    cycleDays: 225,
  },
  {
    id: "mars",
    name: "Mars",
    glyph: "♂",
    rules: ["aries"],
    exalted: "capricorn",
    falls: "cancer",
    detriment: "libra",
    keywords: ["action", "desire", "energy", "courage", "drive"],
    description:
      "Your drive and desire — how you take action, assert yourself, and pursue what you want. Mars is your passion, your energy, and your fighting spirit.",
    color: "#c0563a",
    cycleDays: 687,
  },
  {
    id: "jupiter",
    name: "Jupiter",
    glyph: "♃",
    rules: ["sagittarius"],
    exalted: "cancer",
    falls: "capricorn",
    detriment: "gemini",
    keywords: ["expansion", "growth", "wisdom", "faith", "opportunity"],
    description:
      "Your growth and wisdom — where you find meaning, opportunity, and abundance. Jupiter expands whatever it touches, bringing faith, learning, and generosity.",
    color: "#b8986a",
    cycleDays: 4333,
  },
  {
    id: "saturn",
    name: "Saturn",
    glyph: "♄",
    rules: ["capricorn"],
    exalted: "libra",
    falls: "aries",
    detriment: "cancer",
    keywords: ["structure", "discipline", "responsibility", "time", "mastery"],
    description:
      "Your structure and lessons — where you must work hard, take responsibility, and build mastery. Saturn brings challenges that forge strength and wisdom over time.",
    color: "#6b6157",
    cycleDays: 10759,
  },
  {
    id: "uranus",
    name: "Uranus",
    glyph: "♅",
    rules: ["aquarius"],
    exalted: "scorpio",
    falls: "taurus",
    detriment: "leo",
    keywords: ["innovation", "freedom", "rebellion", "awakening", "change"],
    description:
      "Your innovation and liberation — where you break free from convention and embrace the new. Uranus brings sudden change, awakening, and the future.",
    color: "#6ba0c4",
    cycleDays: 30687,
  },
  {
    id: "neptune",
    name: "Neptune",
    glyph: "♆",
    rules: ["pisces"],
    exalted: "leo",
    falls: "aquarius",
    detriment: "virgo",
    keywords: ["dreams", "imagination", "spirit", "illusion", "transcendence"],
    description:
      "Your dreams and spirituality — where you seek transcendence, connection, and meaning beyond the material. Neptune rules imagination, art, and the dissolution of boundaries.",
    color: "#5b8fa8",
    cycleDays: 60190,
  },
  {
    id: "pluto",
    name: "Pluto",
    glyph: "♇",
    rules: ["scorpio"],
    exalted: "aries",
    falls: "libra",
    detriment: "taurus",
    keywords: ["transformation", "power", "depth", "death", "rebirth"],
    description:
      "Your transformation — where you must face darkness to emerge renewed. Pluto rules power, intensity, death, and rebirth. It reveals your deepest transformations.",
    color: "#4a3b4a",
    cycleDays: 90560,
  },
];

export const getPlanetById = (id: string): Planet | undefined =>
  planets.find((p) => p.id === id);