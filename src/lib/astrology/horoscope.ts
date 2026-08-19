import { type ZodiacSign } from "./signs";

export type HoroscopeReading = {
  sign: ZodiacSign;
  date: string;
  content: string;
  mood: number;
  luckyNumber: number;
  luckyColor: string;
  focus: string;
  love: string;
  career: string;
  health: string;
};

const moodWords = [
  "reflective",
  "energised",
  "contemplative",
  "dynamic",
  "grounded",
  "inspired",
  "focused",
  "open-hearted",
  "ambitious",
  "restless",
  "serene",
  "curious",
];

const focusAreas = [
  "self-expression and creativity",
  "relationships and connection",
  "career and ambitions",
  "home and inner life",
  "health and daily routines",
  "friendships and community",
  "spiritual practice and reflection",
  "finances and resources",
  "learning and communication",
  "transformation and growth",
  "adventure and expansion",
  "rest and restoration",
];

const loveGuidance = [
  "Listen more than you speak today — understanding deepens connection.",
  "Express your feelings directly. Vulnerability is your strength now.",
  "A small gesture of appreciation goes a long way. Show someone they matter.",
  "Give space where it's needed. Trust doesn't require constant proximity.",
  "An honest conversation opens a door that has been closed for too long.",
  "Let someone support you. Receiving is an act of love too.",
  "Reconnect with someone you've been thinking about. Reach out.",
  "Set a boundary with kindness. Clarity is an act of care.",
  "Share your dreams with someone you trust. Vision is magnetic.",
  "A moment of playfulness rekindles warmth. Don't take everything seriously.",
  "Notice what you appreciate about your loved ones. Tell them.",
  "A new connection sparks something. Stay open to the unexpected.",
];

const careerGuidance = [
  "Focus on one priority. Clarity cuts through overwhelm.",
  "A conversation today could open an unexpected door. Stay receptive.",
  "Your instincts are sharp. Trust what you sense before the data confirms it.",
  "Small consistent steps compound. Don't underestimate the ordinary.",
  "Collaboration brings momentum. You don't have to do this alone.",
  "Refine before you expand. Quality is your competitive advantage.",
  "A challenge is actually an opportunity wearing a disguise. Look again.",
  "Your expertise is needed. Don't be modest about what you know.",
  "Plan the next phase, but act on what's in front of you now.",
  "Listen to feedback without defending. There's gold in the discomfort.",
  "Your persistence is about to pay off. Keep going a little longer.",
  "Reimagine the approach. What worked before may not work now.",
];

const healthGuidance = [
  "Move your body in a way that feels like play, not obligation.",
  "Hydrate and rest. Your body is processing more than you realise.",
  "A few minutes of stillness recalibrates everything. Breathe.",
  "Nourish yourself simply. Good food is foundational medicine.",
  "Sleep is not a luxury tonight — it's a necessity. Honour it.",
  "Stretch. Tension you've been carrying is ready to release.",
  "Step outside. Natural light resets your internal rhythm.",
  "Notice where you're holding tension. Soften it consciously.",
  "Your body knows what it needs. Slow down enough to hear it.",
  "Gentle movement supports emotional release. Walk, swim, dance.",
  "Rest is productive. Recovery is part of the work.",
  "Tend to a small health habit. Consistency outperforms intensity.",
];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function dateSeed(date: Date, signId: string): number {
  const dateStr = date.toISOString().slice(0, 10);
  let hash = 0;
  const combined = dateStr + signId;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function generateDailyHoroscope(sign: ZodiacSign, date: Date = new Date()): HoroscopeReading {
  const seed = dateSeed(date, sign.id);
  const rand = seededRandom(seed);

  const moodIdx = Math.floor(rand() * moodWords.length);
  const focusIdx = Math.floor(rand() * focusAreas.length);
  const loveIdx = Math.floor(rand() * loveGuidance.length);
  const careerIdx = Math.floor(rand() * careerGuidance.length);
  const healthIdx = Math.floor(rand() * healthGuidance.length);

  const mood = Math.floor(rand() * 3) + 3;
  const luckyNumber = Math.floor(rand() * 99) + 1;
  const luckyColor = sign.color;
  const focus = focusAreas[focusIdx];

  const content = `The Moon's influence brings a ${moodWords[moodIdx]} energy to your ${sign.element.toLowerCase()} nature today, dear ${sign.name}. With ${sign.rulingPlanet} as your guiding planet, the cosmic weather favours ${focus}. Your natural ${sign.traits[0]} quality is your greatest asset right now — trust it. The stars encourage you to lean into your ${sign.keywords[0]} without forcing outcomes. What is meant for you will come; your role is to remain open and authentic. ${sign.element} energy flows best when you honour its rhythm rather than fighting it.`;

  return {
    sign,
    date: date.toISOString().slice(0, 10),
    content,
    mood,
    luckyNumber,
    luckyColor,
    focus,
    love: loveGuidance[loveIdx],
    career: careerGuidance[careerIdx],
    health: healthGuidance[healthIdx],
  };
}

export function generateWeeklyHoroscope(sign: ZodiacSign, date: Date = new Date()): {
  sign: ZodiacSign;
  weekOf: string;
  content: string;
  theme: string;
  highlights: string[];
} {
  const seed = dateSeed(date, sign.id) + 1000;
  const rand = seededRandom(seed);

  const themes = [
    "integration and balance",
    "breakthrough and clarity",
    "restoration and renewal",
    "expansion and opportunity",
    "reflection and recalibration",
    "connection and collaboration",
    "release and letting go",
    "courage and initiation",
  ];

  const themeIdx = Math.floor(rand() * themes.length);
  const theme = themes[themeIdx];

  const highlights = [
    `Your ${sign.traits[0]} nature serves you well this week`,
    `${sign.rulingPlanet} supports ${sign.keywords[0]} in new forms`,
    `A ${sign.element.toLowerCase()} approach to challenges brings ease`,
    `Pay attention to dreams and intuition`,
    `An old pattern is ready to transform`,
  ];

  const content = `This week invites ${theme} for you, ${sign.name}. As planetary energies shift, your ${sign.element.toLowerCase()} nature finds its natural rhythm. The cosmos supports your ${sign.keywords[0]} this week — trust where it leads. Mid-week brings a moment of clarity around ${focusAreas[Math.floor(rand() * focusAreas.length)]}. By week's end, you'll understand why certain experiences have been unfolding as they have. Stay true to your ${sign.modality.toLowerCase()} nature; it is exactly right for what this week demands.`;

  return {
    sign,
    weekOf: date.toISOString().slice(0, 10),
    content,
    theme,
    highlights: highlights.slice(0, 3),
  };
}