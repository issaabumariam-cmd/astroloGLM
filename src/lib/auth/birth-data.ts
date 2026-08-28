"use client";

import { supabase } from "@/lib/supabase/client";

export type BirthData = {
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  birthLat?: number;
  birthLng?: number;
  zodiacSign?: string;
};

export async function saveBirthData(data: BirthData): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Use SECURITY DEFINER function — prevents client from resetting
  // ai_questions_used or subscription_status via direct table update
  const { error } = await supabase.rpc("update_own_birth_data", {
    p_birth_date: data.birthDate,
    p_birth_time: data.birthTime || null,
    p_birth_place: data.birthPlace || null,
    p_birth_lat: data.birthLat || null,
    p_birth_lng: data.birthLng || null,
    p_zodiac_sign: data.zodiacSign || null,
  });

  return { error: error?.message || null };
}

export async function loadBirthData(): Promise<BirthData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("birth_date, birth_time, birth_place, birth_lat, birth_lng, zodiac_sign")
    .eq("id", user.id)
    .single();

  if (error || !data || !data.birth_date) return null;

  return {
    birthDate: data.birth_date,
    birthTime: data.birth_time || undefined,
    birthPlace: data.birth_place || undefined,
    birthLat: data.birth_lat || undefined,
    birthLng: data.birth_lng || undefined,
    zodiacSign: data.zodiac_sign || undefined,
  };
}

export async function getAiUsage(): Promise<{ used: number; limit: number; isPremium: boolean } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("ai_questions_used, ai_questions_limit, subscription_status")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    used: data.ai_questions_used || 0,
    limit: data.ai_questions_limit || 3,
    isPremium: data.subscription_status === "premium",
  };
}

export async function hasDeepEchoAccess(): Promise<boolean> {
  const usage = await getAiUsage();
  if (!usage) return false;
  if (usage.isPremium) return true;
  return usage.used < usage.limit;
}