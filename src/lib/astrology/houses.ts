export type House = {
  num: number;
  name: string;
  keywords: string[];
  description: string;
  associatedSign: string;
  associatedPlanet: string;
};

export const houses: House[] = [
  {
    num: 1,
    name: "Self & Identity",
    keywords: ["self", "appearance", "first impression", "vitality", "approach"],
    description:
      "How you present yourself to the world, your physical body, and your approach to new beginnings. The mask you wear and the energy you project.",
    associatedSign: "aries",
    associatedPlanet: "mars",
  },
  {
    num: 2,
    name: "Values & Resources",
    keywords: ["money", "possessions", "values", "self-worth", "resources"],
    description:
      "What you value, how you earn and spend, and your relationship to material resources. Your sense of self-worth and what you hold dear.",
    associatedSign: "taurus",
    associatedPlanet: "venus",
  },
  {
    num: 3,
    name: "Communication & Community",
    keywords: ["communication", "siblings", "short trips", "learning", "neighbours"],
    description:
      "How you communicate, think, and connect with your immediate environment. Siblings, neighbours, short journeys, and everyday exchanges.",
    associatedSign: "gemini",
    associatedPlanet: "mercury",
  },
  {
    num: 4,
    name: "Home & Foundations",
    keywords: ["home", "family", "roots", "mother", "foundation"],
    description:
      "Your home, family, emotional foundations, and sense of belonging. The roots that ground you and the private self behind closed doors.",
    associatedSign: "cancer",
    associatedPlanet: "moon",
  },
  {
    num: 5,
    name: "Creativity & Joy",
    keywords: ["creativity", "children", "romance", "play", "self-expression"],
    description:
      "Creative expression, romance, play, children, and the pursuit of pleasure. Where you take risks for joy and express your authentic self.",
    associatedSign: "leo",
    associatedPlanet: "sun",
  },
  {
    num: 6,
    name: "Work & Health",
    keywords: ["work", "health", "routines", "service", "habits"],
    description:
      "Your daily work, health routines, and service to others. The habits that maintain your wellbeing and the craft you bring to everyday tasks.",
    associatedSign: "virgo",
    associatedPlanet: "mercury",
  },
  {
    num: 7,
    name: "Partnership",
    keywords: ["partnership", "marriage", "contracts", "open enemies", "relationships"],
    description:
      "One-to-one partnerships — marriage, business, and committed relationships. How you relate to others and what you seek in a partner.",
    associatedSign: "libra",
    associatedPlanet: "venus",
  },
  {
    num: 8,
    name: "Transformation & Shared Resources",
    keywords: ["transformation", "intimacy", "shared resources", "death", "rebirth"],
    description:
      "Deep transformation, shared resources, intimacy, and psychological depth. The territory of bonds, debts, inheritances, and profound change.",
    associatedSign: "scorpio",
    associatedPlanet: "pluto",
  },
  {
    num: 9,
    name: "Wisdom & Exploration",
    keywords: ["higher education", "travel", "philosophy", "meaning", "publishing"],
    description:
      "Higher learning, long-distance travel, philosophy, and the search for meaning. Where you expand your horizons and seek truth beyond the familiar.",
    associatedSign: "sagittarius",
    associatedPlanet: "jupiter",
  },
  {
    num: 10,
    name: "Career & Public Standing",
    keywords: ["career", "public standing", "reputation", "father", "achievement"],
    description:
      "Your career, public reputation, and contribution to the world. Your vocation and how you are seen by the broader community.",
    associatedSign: "capricorn",
    associatedPlanet: "saturn",
  },
  {
    num: 11,
    name: "Community & Aspirations",
    keywords: ["community", "friends", "hopes", "groups", "ideals"],
    description:
      "Friendships, groups, communities, and long-term aspirations. Where you find belonging beyond personal relationships and work toward shared ideals.",
    associatedSign: "aquarius",
    associatedPlanet: "uranus",
  },
  {
    num: 12,
    name: "Solitude & the Unconscious",
    keywords: ["solitude", "unconscious", "spirituality", "retreat", "hidden"],
    description:
      "The unconscious, solitude, retreat, and spiritual depth. Where you withdraw from the world to heal, dream, and connect with the unseen.",
    associatedSign: "pisces",
    associatedPlanet: "neptune",
  },
];

export const getHouseByNum = (num: number): House | undefined =>
  houses.find((h) => h.num === num);