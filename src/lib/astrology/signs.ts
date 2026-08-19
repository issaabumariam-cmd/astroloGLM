export type ZodiacSign = {
  id: string;
  name: string;
  symbol: string;
  glyph: string;
  dates: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  modality: "Cardinal" | "Fixed" | "Mutable";
  rulingPlanet: string;
  rulingPlanetGlyph: string;
  opposite: string;
  degrees: [number, number];
  traits: string[];
  keywords: string[];
  bodyParts: string;
  color: string;
  luckyDay: string;
  description: string;
  personality: string;
  strengths: string[];
  challenges: string[];
  loveStyle: string;
  careerStrengths: string[];
};

export const zodiacSigns: ZodiacSign[] = [
  {
    id: "aries",
    name: "Aries",
    symbol: "♈",
    glyph: "♈",
    dates: "Mar 21 – Apr 19",
    element: "Fire",
    modality: "Cardinal",
    rulingPlanet: "Mars",
    rulingPlanetGlyph: "♂",
    opposite: "libra",
    degrees: [0, 30],
    traits: ["bold", "pioneering", "energetic", "courageous", "direct"],
    keywords: ["initiation", "action", "courage", "leadership", "self"],
    bodyParts: "Head, face, brain",
    color: "Red",
    luckyDay: "Tuesday",
    description:
      "The first sign of the zodiac, Aries charges forward with fiery determination. Ruled by Mars, the warrior planet, Aries embodies the raw energy of spring's first surge — bold, pioneering, and unafraid to lead.",
    personality:
      "Aries is the spark that starts everything. Natural-born leaders, they thrive on challenge, competition, and the thrill of the new. Their courage is instinctive, their tempers short but quickly spent. They are honest to a fault, fiercely independent, and eternally youthful in spirit.",
    strengths: [
      "Natural leadership",
      "Courage and bravery",
      "Directness and honesty",
      "High energy and enthusiasm",
      "Initiative and pioneering spirit",
    ],
    challenges: [
      "Impatience and impulsiveness",
      "Tendency to start without finishing",
      "Quick temper",
      "Can be self-centered",
    ],
    loveStyle:
      "Aries loves the chase. Passionate and direct, they pursue with ardour and expect the same in return. They need a partner who can match their energy without being diminished by it.",
    careerStrengths: [
      "Entrepreneurship",
      "Competitive fields",
      "Crisis management",
      "Pioneering new ventures",
    ],
  },
  {
    id: "taurus",
    name: "Taurus",
    symbol: "♉",
    glyph: "♉",
    dates: "Apr 20 – May 20",
    element: "Earth",
    modality: "Fixed",
    rulingPlanet: "Venus",
    rulingPlanetGlyph: "♀",
    opposite: "scorpio",
    degrees: [30, 60],
    traits: ["steady", "sensual", "patient", "loyal", "determined"],
    keywords: ["stability", "values", "sensuality", "patience", "possession"],
    bodyParts: "Throat, neck, thyroid",
    color: "Green",
    luckyDay: "Friday",
    description:
      "Ruled by Venus, Taurus is the zodiac's garden — lush, patient, and abundantly alive. They cultivate beauty, security, and pleasure with unhurried devotion, building foundations that last.",
    personality:
      "Taurus is the rock. Steady, reliable, and deeply sensual, they move at their own deliberate pace and refuse to be rushed. They value quality over quantity, loyalty above all, and the simple pleasures of earth — good food, soft textures, beautiful objects, and the people they love.",
    strengths: [
      "Unwavering loyalty",
      "Patience and persistence",
      "Practical wisdom",
      "Appreciation of beauty",
      "Financial acumen",
    ],
    challenges: [
      "Stubbornness",
      "Resistance to change",
      "Possessiveness",
      "Can be materialistic",
    ],
    loveStyle:
      "Taurus loves deeply and slowly. They seek a partner who shares their values — comfort, beauty, loyalty. Once committed, they are devoted for life, offering warmth, stability, and the pleasures of a well-tended life.",
    careerStrengths: [
      "Finance and banking",
      "Art and design",
      "Agriculture and food",
      "Long-term project management",
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    symbol: "♊",
    glyph: "♊",
    dates: "May 21 – Jun 20",
    element: "Air",
    modality: "Mutable",
    rulingPlanet: "Mercury",
    rulingPlanetGlyph: "☿",
    opposite: "sagittarius",
    degrees: [60, 90],
    traits: ["curious", "quick-witted", "adaptable", "communicative", "versatile"],
    keywords: ["communication", "curiosity", "duality", "learning", "connection"],
    bodyParts: "Lungs, arms, hands, nervous system",
    color: "Yellow",
    luckyDay: "Wednesday",
    description:
      "Ruled by Mercury, Gemini is the messenger of the zodiac — quick, clever, and endlessly curious. They live in the realm of ideas, words, and connections, gathering information like a bee gathers pollen.",
    personality:
      "Gemini is the mind in motion. Quick-witted and endlessly curious, they flit between interests, conversations, and social circles with infectious energy. They are the zodiac's natural communicators — witty, versatile, and always fascinating company. Their duality is not contradiction but completeness.",
    strengths: [
      "Communication and writing",
      "Adaptability and versatility",
      "Quick learning",
      "Social intelligence",
      "Humour and wit",
    ],
    challenges: [
      "Restlessness and scattered focus",
      "Inconsistency",
      "Nervousness",
      "Can be superficial",
    ],
    loveStyle:
      "Gemini needs intellectual stimulation above all. They fall in love through conversation, shared ideas, and mental playfulness. A partner who keeps them curious keeps them committed.",
    careerStrengths: [
      "Journalism and media",
      "Marketing and communications",
      "Teaching and education",
      "Technology and social media",
    ],
  },
  {
    id: "cancer",
    name: "Cancer",
    symbol: "♋",
    glyph: "♋",
    dates: "Jun 21 – Jul 22",
    element: "Water",
    modality: "Cardinal",
    rulingPlanet: "Moon",
    rulingPlanetGlyph: "☽",
    opposite: "capricorn",
    degrees: [90, 120],
    traits: ["nurturing", "intuitive", "protective", "emotional", "tenacious"],
    keywords: ["home", "family", "emotion", "memory", "protection"],
    bodyParts: "Chest, breasts, stomach",
    color: "Silver",
    luckyDay: "Monday",
    description:
      "Ruled by the Moon, Cancer is the zodiac's hearth — warm, protective, and deeply feeling. They carry the emotional memory of all who came before, offering shelter and sustenance to those they love.",
    personality:
      "Cancer is the heart of the zodiac. Deeply intuitive and fiercely protective, they create sanctuaries wherever they go. Their emotional depth is their superpower — they feel what others feel before a word is spoken. Beneath their protective shell lies extraordinary tenderness and a memory that holds every moment, every feeling, every love.",
    strengths: [
      "Emotional intelligence",
      "Nurturing and protective nature",
      "Intuition and empathy",
      "Loyalty to family and friends",
      "Tenacity and resilience",
    ],
    challenges: [
      "Moodiness",
      "Tendency to retreat into shell",
      "Clinginess",
      "Difficulty letting go",
    ],
    loveStyle:
      "Cancer loves through care. They express devotion through acts of nurturing — cooking, listening, creating a home. They need emotional security above all, and give it in abundance in return.",
    careerStrengths: [
      "Healthcare and counselling",
      "Hospitality and food",
      "Childcare and education",
      "Human resources",
    ],
  },
  {
    id: "leo",
    name: "Leo",
    symbol: "♌",
    glyph: "♌",
    dates: "Jul 23 – Aug 22",
    element: "Fire",
    modality: "Fixed",
    rulingPlanet: "Sun",
    rulingPlanetGlyph: "☉",
    opposite: "aquarius",
    degrees: [120, 150],
    traits: ["radiant", "generous", "creative", "confident", "dramatic"],
    keywords: ["self-expression", "creativity", "pride", "generosity", "leadership"],
    bodyParts: "Heart, spine, upper back",
    color: "Gold",
    luckyDay: "Sunday",
    description:
      "Ruled by the Sun, Leo is the zodiac's light — radiant, generous, and unmistakably present. They give warmth simply by being, and their creative fire illuminates everyone around them.",
    personality:
      "Leo is the star of the zodiac, and they know it — not from arrogance but from the simple truth of their radiance. Generous, warm-hearted, and magnificently creative, they light up every room. Their pride is their dignity; their drama is their artistry. They love grandly, lead naturally, and give with open hands and an open heart.",
    strengths: [
      "Natural charisma and magnetism",
      "Generosity and warmth",
      "Creative talent",
      "Leadership and courage",
      "Loyalty and protectiveness",
    ],
    challenges: [
      "Need for admiration",
      "Pride and ego",
      "Dramatic tendencies",
      "Can be domineering",
    ],
    loveStyle:
      "Leo loves with grandeur. They express devotion through generosity, protection, and visible adoration. They need a partner who appreciates them openly and returns their warmth.",
    careerStrengths: [
      "Entertainment and performance",
      "Creative arts and design",
      "Leadership and management",
      "Public relations",
    ],
  },
  {
    id: "virgo",
    name: "Virgo",
    symbol: "♍",
    glyph: "♍",
    dates: "Aug 23 – Sep 22",
    element: "Earth",
    modality: "Mutable",
    rulingPlanet: "Mercury",
    rulingPlanetGlyph: "☿",
    opposite: "pisces",
    degrees: [150, 180],
    traits: ["analytical", "precise", "helpful", "modest", "refining"],
    keywords: ["service", "analysis", "health", "detail", "improvement"],
    bodyParts: "Intestines, digestive system",
    color: "Navy",
    luckyDay: "Wednesday",
    description:
      "Ruled by Mercury, Virgo is the zodiac's craftsman — meticulous, humble, and devoted to refinement. They see what needs fixing and set about fixing it with patient, exacting care.",
    personality:
      "Virgo is the zodiac's quiet perfectionist. Analytical, precise, and deeply helpful, they see the world in fine detail — every flaw, every possibility for improvement. Their gift is discernment: knowing what matters and what doesn't, what serves and what hinders. They express love through service, through the small acts of care that make life work.",
    strengths: [
      "Analytical intelligence",
      "Attention to detail",
      "Reliability and diligence",
      "Humble service",
      "Health and wellness wisdom",
    ],
    challenges: [
      "Perfectionism",
      "Critical tendencies",
      "Worry and anxiety",
      "Difficulty accepting imperfection",
    ],
    loveStyle:
      "Virgo loves through acts of service. They notice what you need before you ask and provide it quietly, consistently. They seek a partner who appreciates the small things and returns their devotion in kind.",
    careerStrengths: [
      "Healthcare and medicine",
      "Editing and writing",
      "Data analysis and research",
      "Quality assurance",
    ],
  },
  {
    id: "libra",
    name: "Libra",
    symbol: "♎",
    glyph: "♎",
    dates: "Sep 23 – Oct 22",
    element: "Air",
    modality: "Cardinal",
    rulingPlanet: "Venus",
    rulingPlanetGlyph: "♀",
    opposite: "aries",
    degrees: [180, 210],
    traits: ["diplomatic", "harmonious", "aesthetic", "fair-minded", "social"],
    keywords: ["balance", "relationship", "beauty", "justice", "harmony"],
    bodyParts: "Kidneys, lower back, skin",
    color: "Pink",
    luckyDay: "Friday",
    description:
      "Ruled by Venus, Libra is the zodiac's diplomat — graceful, fair, and devoted to beauty in all its forms. They seek balance, harmony, and the perfect partnership, weighing every decision with care.",
    personality:
      "Libra is the zodiac's peacemaker. Graceful, fair-minded, and aesthetically refined, they navigate social situations with natural diplomacy. They see every side of every question, which makes them excellent mediators and sometimes indecisive choosers. They seek beauty, harmony, and partnership above all.",
    strengths: [
      "Diplomacy and tact",
      "Aesthetic sensibility",
      "Fairness and justice",
      "Social grace",
      "Partnership orientation",
    ],
    challenges: [
      "Indecisiveness",
      "People-pleasing",
      "Avoidance of conflict",
      "Dependency on others",
    ],
    loveStyle:
      "Libra is the zodiac's romantic. They seek partnership as a fundamental need, not a luxury. They love through beauty, harmony, and shared aesthetic pleasure. A well-matched partner is their greatest joy.",
    careerStrengths: [
      "Law and mediation",
      "Art and design",
      "Diplomacy and international relations",
      "Event planning",
    ],
  },
  {
    id: "scorpio",
    name: "Scorpio",
    symbol: "♏",
    glyph: "♏",
    dates: "Oct 23 – Nov 21",
    element: "Water",
    modality: "Fixed",
    rulingPlanet: "Pluto",
    rulingPlanetGlyph: "♇",
    opposite: "taurus",
    degrees: [210, 240],
    traits: ["intense", "transformative", "magnetic", "private", "perceptive"],
    keywords: ["transformation", "intensity", "depth", "power", "rebirth"],
    bodyParts: "Reproductive organs, excretory system",
    color: "Maroon",
    luckyDay: "Tuesday",
    description:
      "Ruled by Pluto, Scorpio is the zodiac's depth — intense, magnetic, and unafraid of the darkness that transforms. They dive where others fear to look, emerging with truths that change everything.",
    personality:
      "Scorpio is the zodiac's transformer. Intense, magnetic, and fiercely private, they feel everything at a depth others rarely access. Their power lies in their willingness to face what is hidden — the shadow, the taboo, the truth beneath the surface. They love with total commitment, fight with total ferocity, and regenerate from any destruction.",
    strengths: [
      "Emotional depth and intensity",
      "Strategic intelligence",
      "Loyalty and protectiveness",
      "Perceptiveness and insight",
      "Resilience and regeneration",
    ],
    challenges: [
      "Jealousy and possessiveness",
      "Vengefulness",
      "Secretiveness",
      "Intensity that overwhelms",
    ],
    loveStyle:
      "Scorpio loves with total intensity. All or nothing — they seek a partner willing to go deep, face truth, and commit completely. Betrayal is unforgivable; loyalty is forever.",
    careerStrengths: [
      "Research and investigation",
      "Psychology and therapy",
      "Finance and investment",
      "Surgery and medicine",
    ],
  },
  {
    id: "sagittarius",
    name: "Sagittarius",
    symbol: "♐",
    glyph: "♐",
    dates: "Nov 22 – Dec 21",
    element: "Fire",
    modality: "Mutable",
    rulingPlanet: "Jupiter",
    rulingPlanetGlyph: "♃",
    opposite: "gemini",
    degrees: [240, 270],
    traits: ["adventurous", "philosophical", "optimistic", "honest", "free-spirited"],
    keywords: ["expansion", "truth", "freedom", "travel", "meaning"],
    bodyParts: "Hips, thighs, liver",
    color: "Purple",
    luckyDay: "Thursday",
    description:
      "Ruled by Jupiter, Sagittarius is the zodiac's explorer — eternally questing for truth, meaning, and the next horizon. They expand whatever they touch with boundless optimism and restless freedom.",
    personality:
      "Sagittarius is the zodiac's adventurer. Philosophical, honest, and eternally optimistic, they seek meaning through experience — travel, learning, and the pursuit of truth in all its forms. They are the archer, aiming arrows at distant horizons, always moving forward, always expanding.",
    strengths: [
      "Optimism and enthusiasm",
      "Philosophical wisdom",
      "Honesty and directness",
      "Adventurous spirit",
      "Generosity and humour",
    ],
    challenges: [
      "Restlessness",
      "Tactlessness",
      "Fear of commitment",
      "Over-promising",
    ],
    loveStyle:
      "Sagittarius loves freedom. They need a partner who gives them space to roam — physically, mentally, spiritually. Shared adventure is their love language; honesty is their bond.",
    careerStrengths: [
      "Travel and exploration",
      "Higher education and teaching",
      "Philosophy and religion",
      "International business",
    ],
  },
  {
    id: "capricorn",
    name: "Capricorn",
    symbol: "♑",
    glyph: "♑",
    dates: "Dec 22 – Jan 19",
    element: "Earth",
    modality: "Cardinal",
    rulingPlanet: "Saturn",
    rulingPlanetGlyph: "♄",
    opposite: "cancer",
    degrees: [270, 300],
    traits: ["ambitious", "disciplined", "responsible", "patient", "strategic"],
    keywords: ["structure", "ambition", "mastery", "discipline", "achievement"],
    bodyParts: "Bones, knees, teeth, skin",
    color: "Brown",
    luckyDay: "Saturday",
    description:
      "Ruled by Saturn, Capricorn is the zodiac's mountain climber — disciplined, patient, and relentlessly ascending. They build empires, institutions, and legacies with methodical determination.",
    personality:
      "Capricorn is the zodiac's achiever. Disciplined, responsible, and quietly ambitious, they climb toward their goals with patient, strategic determination. They understand structure, time, and the value of hard work. Beneath their serious exterior lies a dry wit and a deep appreciation for tradition, legacy, and things that endure.",
    strengths: [
      "Discipline and self-control",
      "Strategic thinking",
      "Responsibility and reliability",
      "Patience and perseverance",
      "Organisational skill",
    ],
    challenges: [
      "Pessimism",
      "Workaholism",
      "Rigidity",
      "Difficulty showing emotion",
    ],
    loveStyle:
      "Capricorn loves through commitment and provision. They take relationships as seriously as careers — seeking a partner who shares their values and their long-term vision. Trust is earned slowly and kept forever.",
    careerStrengths: [
      "Business and management",
      "Finance and accounting",
      "Architecture and construction",
      "Government and law",
    ],
  },
  {
    id: "aquarius",
    name: "Aquarius",
    symbol: "♒",
    glyph: "♒",
    dates: "Jan 20 – Feb 18",
    element: "Air",
    modality: "Fixed",
    rulingPlanet: "Uranus",
    rulingPlanetGlyph: "♅",
    opposite: "leo",
    degrees: [300, 330],
    traits: ["innovative", "independent", "humanitarian", "eccentric", "visionary"],
    keywords: ["innovation", "community", "freedom", "future", "ideals"],
    bodyParts: "Ankles, calves, circulatory system",
    color: "Electric Blue",
    luckyDay: "Saturday",
    description:
      "Ruled by Uranus, Aquarius is the zodiac's visionary — forward-looking, humanitarian, and gloriously unconventional. They see the future before others and work to bring it into being.",
    personality:
      "Aquarius is the zodiac's revolutionary. Innovative, independent, and deeply humanitarian, they see possibilities others miss and champion causes others ignore. They value community and individuality in equal measure — everyone matters, everyone is unique, and the future belongs to all. Their detachment is not coldness but objectivity; their eccentricity is not affectation but authenticity.",
    strengths: [
      "Innovative thinking",
      "Humanitarian values",
      "Independence and originality",
      "Intellectual depth",
      "Community orientation",
    ],
    challenges: [
      "Emotional detachment",
      "Stubbornness about ideas",
      "Unpredictability",
      "Can be aloof",
    ],
    loveStyle:
      "Aquarius loves through intellectual connection and shared ideals. They need a partner who respects their independence and shares their vision. Friendship is the foundation of their romance.",
    careerStrengths: [
      "Technology and innovation",
      "Social causes and activism",
      "Science and research",
      "Community organising",
    ],
  },
  {
    id: "pisces",
    name: "Pisces",
    symbol: "♓",
    glyph: "♓",
    dates: "Feb 19 – Mar 20",
    element: "Water",
    modality: "Mutable",
    rulingPlanet: "Neptune",
    rulingPlanetGlyph: "♆",
    opposite: "virgo",
    degrees: [330, 360],
    traits: ["compassionate", "dreamy", "artistic", "intuitive", "mystical"],
    keywords: ["transcendence", "compassion", "imagination", "spirit", "surrender"],
    bodyParts: "Feet, lymphatic system",
    color: "Sea Green",
    luckyDay: "Thursday",
    description:
      "Ruled by Neptune, Pisces is the zodiac's mystic — deeply compassionate, artistically gifted, and connected to realms beyond the visible. They dissolve boundaries between self and other, dream and reality.",
    personality:
      "Pisces is the zodiac's dreamer. Compassionate, imaginative, and spiritually attuned, they feel the world's sorrows and beauties with equal depth. Their gift is empathy without limit; their challenge is maintaining boundaries. They are artists, healers, and mystics — people who sense what cannot be seen and give without counting the cost.",
    strengths: [
      "Compassion and empathy",
      "Artistic and musical talent",
      "Intuition and spiritual depth",
      "Adaptability and gentleness",
      "Imagination and creativity",
    ],
    challenges: [
      "Escapism",
      "Over-sensitivity",
      "Difficulty with boundaries",
      "Tendency toward self-pity",
    ],
    loveStyle:
      "Pisces loves with total surrender. They seek a soulmate — someone who understands their depth and protects their tenderness. They give completely, love unconditionally, and need a partner who won't take advantage of their boundless heart.",
    careerStrengths: [
      "Art and music",
      "Healing and therapy",
      "Spiritual work",
      "Charity and social services",
    ],
  },
];

export const getSignById = (id: string): ZodiacSign | undefined =>
  zodiacSigns.find((s) => s.id === id);

export const getSignBySymbol = (symbol: string): ZodiacSign | undefined =>
  zodiacSigns.find((s) => s.symbol === symbol);

export const elements = ["Fire", "Earth", "Air", "Water"] as const;
export const modalities = ["Cardinal", "Fixed", "Mutable"] as const;

export const elementColors: Record<string, string> = {
  Fire: "#e07856",
  Earth: "#8b9a6b",
  Air: "#7ba0c4",
  Water: "#5b8fa8",
};

export const elementDescriptions: Record<string, string> = {
  Fire: "Energy, passion, initiative, and creativity. Fire signs inspire and lead.",
  Earth: "Stability, practicality, material reality, and patience. Earth signs build and sustain.",
  Air: "Intellect, communication, ideas, and social connection. Air signs think and connect.",
  Water: "Emotion, intuition, empathy, and depth. Water signs feel and heal.",
};