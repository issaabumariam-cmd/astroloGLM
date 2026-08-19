import { zodiacSigns, type ZodiacSign } from "./signs";

export type CompatibilityResult = {
  sign1: ZodiacSign;
  sign2: ZodiacSign;
  loveScore: number;
  communicationScore: number;
  trustScore: number;
  emotionScore: number;
  overallScore: number;
  summary: string;
  strengths: string[];
  challenges: string[];
  elementMatch: string;
};

function elementCompatibility(e1: string, e2: string): number {
  const compatible: Record<string, string[]> = {
    Fire: ["Air"],
    Air: ["Fire"],
    Earth: ["Water"],
    Water: ["Earth"],
  };
  if (e1 === e2) return 75;
  if (compatible[e1]?.includes(e2)) return 85;
  const conflicting: Record<string, string[]> = {
    Fire: ["Water"],
    Water: ["Fire"],
    Earth: ["Air"],
    Air: ["Earth"],
  };
  if (conflicting[e1]?.includes(e2)) return 45;
  return 60;
}

function modalityCompatibility(m1: string, m2: string): number {
  if (m1 === m2) return 65;
  if (
    (m1 === "Cardinal" && m2 === "Fixed") ||
    (m1 === "Fixed" && m2 === "Cardinal")
  )
    return 70;
  if (
    (m1 === "Cardinal" && m2 === "Mutable") ||
    (m1 === "Mutable" && m2 === "Cardinal")
  )
    return 75;
  return 78;
}

export function calculateCompatibility(
  sign1Id: string,
  sign2Id: string
): CompatibilityResult | null {
  const sign1 = zodiacSigns.find((s) => s.id === sign1Id);
  const sign2 = zodiacSigns.find((s) => s.id === sign2Id);
  if (!sign1 || !sign2) return null;

  const baseScore = elementCompatibility(sign1.element, sign2.element);
  const modScore = modalityCompatibility(sign1.modality, sign2.modality);

  const loveScore = Math.round(baseScore * 0.6 + modScore * 0.3 + 15);
  const communicationScore = Math.round(
    (sign1.element === "Air" || sign2.element === "Air" ? 80 : 60) * 0.5 +
      modScore * 0.3 +
      10
  );
  const trustScore = Math.round(
    (sign1.element === "Earth" || sign2.element === "Earth" ? 80 : 60) * 0.5 +
      modScore * 0.3 +
      10
  );
  const emotionScore = Math.round(
    (sign1.element === "Water" || sign2.element === "Water" ? 80 : 55) * 0.5 +
      baseScore * 0.3 +
      10
  );
  const overallScore = Math.round(
    (loveScore + communicationScore + trustScore + emotionScore) / 4
  );

  const elementMatch =
    sign1.element === sign2.element
      ? `${sign1.element} with ${sign2.element} — same element, deep resonance`
      : (sign1.element === "Fire" && sign2.element === "Air") ||
        (sign1.element === "Air" && sign2.element === "Fire") ||
        (sign1.element === "Earth" && sign2.element === "Water") ||
        (sign1.element === "Water" && sign2.element === "Earth")
      ? `${sign1.element} with ${sign2.element} — complementary elements, natural harmony`
      : (sign1.element === "Fire" && sign2.element === "Water") ||
        (sign1.element === "Water" && sign2.element === "Fire") ||
        (sign1.element === "Earth" && sign2.element === "Air") ||
        (sign1.element === "Air" && sign2.element === "Earth")
        ? `${sign1.element} with ${sign2.element} — challenging elements, growth through tension`
        : `${sign1.element} with ${sign2.element} — neutral combination, effort required`;

  const isOpposite = sign1.opposite === sign2.id;
  const summary = isOpposite
    ? `${sign1.name} and ${sign2.name} are opposite signs — the classic "opposites attract" pairing. You see in each other what you lack in yourselves, creating a powerful magnetism that demands integration. This is a relationship of growth through contrast.`
    : sign1.element === sign2.element
      ? `${sign1.name} and ${sign2.name} share the ${sign1.element} element, creating a natural understanding and easy rapport. You speak the same elemental language — instinctively grasping each other's nature without explanation.`
      : overallScore >= 70
        ? `${sign1.name} and ${sign2.name} form a naturally harmonious pairing. Your energies complement each other, creating a relationship that feels both comfortable and stimulating.`
        : overallScore >= 55
          ? `${sign1.name} and ${sign2.name} can build a strong connection, but it requires awareness and effort. Your different natures offer complementary perspectives — if you're willing to learn from each other.`
          : `${sign1.name} and ${sign2.name} are an astrologically challenging combination. Your fundamental natures differ significantly, requiring conscious effort, mutual respect, and patience to bridge the gap. The reward is growth that neither could achieve alone.`;

  const strengths: string[] = [];
  if (sign1.element === sign2.element)
    strengths.push(`Shared ${sign1.element} element — instinctive understanding`);
  if (isOpposite)
    strengths.push("Opposite-sign magnetism — powerful attraction and growth");
  if (baseScore >= 75) strengths.push("Complementary elemental energies");
  if (sign1.modality !== sign2.modality)
    strengths.push("Different approaches create balanced perspective");
  strengths.push(
    `${sign1.name}'s ${sign1.traits[0]} nature meets ${sign2.name}'s ${sign2.traits[0]} essence`
  );

  const challenges: string[] = [];
  if (baseScore < 60) challenges.push("Elemental tension requires conscious adjustment");
  if (sign1.modality === sign2.modality && sign1.modality === "Fixed")
    challenges.push("Both Fixed — stubbornness can create standoffs");
  if (sign1.element === "Fire" && sign2.element === "Water")
    challenges.push("Fire's intensity can overwhelm Water's sensitivity");
  if (sign1.element === "Water" && sign2.element === "Fire")
    challenges.push("Water's depth can dampen Fire's enthusiasm");
  challenges.push(
    `Balancing ${sign1.name}'s need for ${sign1.keywords[0]} with ${sign2.name}'s need for ${sign2.keywords[0]}`
  );

  return {
    sign1,
    sign2,
    loveScore,
    communicationScore,
    trustScore,
    emotionScore,
    overallScore,
    summary,
    strengths,
    challenges,
    elementMatch,
  };
}