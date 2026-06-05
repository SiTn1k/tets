import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  language_code: string;
  total_xp: number;
  created_at: string;
  last_visit: string;
}

export interface UserStats {
  totalMinutes: number;
  visitCount: number;
  artifactsViewed: number;
  totalDonated: number;
  totalXP: number;
  level: number;
  rankKey: string;
  rankName: string;
  nextLevelXP: number;
  achievements: string[];
}

const RANK_THRESHOLDS = [
  { minXP: 0, key: "novice", ua: "Новачок", en: "Novice", nextXP: 100 },
  { minXP: 100, key: "explorer", ua: "Дослідник", en: "Explorer", nextXP: 500 },
  { minXP: 500, key: "historian", ua: "Історик", en: "Historian", nextXP: 2000 },
  { minXP: 2000, key: "patron", ua: "Патрон", en: "Patron", nextXP: 5000 },
  { minXP: 5000, key: "legend", ua: "Легенда музею", en: "Museum Legend", nextXP: 10000 },
];

function getRank(totalXP: number, lang: "ua" | "en") {
  let rank = RANK_THRESHOLDS[0];
  for (const r of RANK_THRESHOLDS) {
    if (totalXP >= r.minXP) rank = r;
  }
  return {
    key: rank.key,
    name: lang === "ua" ? rank.ua : rank.en,
    nextLevelXP: rank.nextXP,
  };
}

export class MuseumAPI {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async authUser(telegramUser: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
  }): Promise<UserProfile> {
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramUser.id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("users")
        .update({ last_visit: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) console.error("Update user error:", error);
      return data || existing;
    }

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name || null,
          username: telegramUser.username || null,
          language_code: telegramUser.language_code || "en",
          photo_url: telegramUser.photo_url || null,
          total_xp: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Create user error:", error);
      throw error;
    }

    // Award FIRST_VISIT achievement
    await this.awardAchievement(data.id, "FIRST_VISIT");

    return data;
  }

  // ── Profile & Stats ───────────────────────────────────────────────────────

  async getProfile(telegramId: number, lang: "ua" | "en"): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();
    if (error) console.error("Get profile error:", error);
    return data;
  }

  async getStats(userId: number, lang: "ua" | "en"): Promise<UserStats> {
    // Total minutes from sessions
    const { data: sessions } = await supabase
      .from("activity_sessions")
      .select("minutes_spent")
      .eq("user_id", userId);

    const totalMinutes = (sessions || []).reduce(
      (sum: number, s: { minutes_spent: number | null }) => sum + (s.minutes_spent || 0),
      0
    );
    const visitCount = (sessions || []).length;

    // Artifacts viewed (unique)
    const { data: views } = await supabase
      .from("artifact_views")
      .select("artifact_id")
      .eq("user_id", userId);

    const artifactsViewed = new Set((views || []).map((v: { artifact_id: string }) => v.artifact_id)).size;

    // Donations
    const { data: dons } = await supabase
      .from("donations")
      .select("amount")
      .eq("user_id", userId)
      .eq("status", "completed");

    const totalDonated = (dons || []).reduce(
      (sum: number, d: { amount: number }) => sum + Number(d.amount),
      0
    );

    // Achievements
    const { data: achs } = await supabase
      .from("achievements")
      .select("achievement_key")
      .eq("user_id", userId);

    const achievements = (achs || []).map((a: { achievement_key: string }) => a.achievement_key);

    // Get stored XP from user row
    const { data: user } = await supabase
      .from("users")
      .select("total_xp")
      .eq("id", userId)
      .maybeSingle();

    const storedXP = user?.total_xp || 0;

    // Calculate live XP (in case stored is stale)
    const liveXP = storedXP;
    // Recalculate: storedXP should already be correct, but let's verify
    // We keep storedXP as source of truth since we update it on every action

    const rank = getRank(liveXP, lang);

    return {
      totalMinutes,
      visitCount,
      artifactsViewed,
      totalDonated,
      totalXP: liveXP,
      level: RANK_THRESHOLDS.findIndex((r) => liveXP >= r.minXP) + 1,
      rankKey: rank.key,
      rankName: rank.name,
      nextLevelXP: rank.nextLevelXP,
      achievements,
    };
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  async startSession(userId: number): Promise<number | null> {
    const { data, error } = await supabase
      .from("activity_sessions")
      .insert([{ user_id: userId, session_start: new Date().toISOString() }])
      .select("id")
      .single();

    if (error) {
      console.error("Start session error:", error);
      return null;
    }
    return data.id;
  }

  async endSession(sessionId: number, userId: number): Promise<void> {
    // Get session start time
    const { data: session } = await supabase
      .from("activity_sessions")
      .select("session_start")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session) return;

    const minutesSpent = Math.max(
      1,
      Math.floor((Date.now() - new Date(session.session_start).getTime()) / 60000)
    );

    await supabase
      .from("activity_sessions")
      .update({
        session_end: new Date().toISOString(),
        minutes_spent: minutesSpent,
      })
      .eq("id", sessionId);

    // Add XP for time spent
    await this.addXP(userId, minutesSpent);

    // Check ONE_HOUR achievement
    if (minutesSpent >= 60) {
      await this.awardAchievement(userId, "ONE_HOUR");
    }
  }

  // ── Artifact Views ─────────────────────────────────────────────────────────

  async trackArtifactView(userId: number, artifactId: string): Promise<void> {
    // Check if already viewed
    const { data: existing } = await supabase
      .from("artifact_views")
      .select("id")
      .eq("user_id", userId)
      .eq("artifact_id", artifactId)
      .maybeSingle();

    if (existing) return; // Already viewed, no new XP

    await supabase.from("artifact_views").insert([
      { user_id: userId, artifact_id: artifactId, viewed_at: new Date().toISOString() },
    ]);

    // Add 5 XP for new artifact view
    await this.addXP(userId, 5);

    // Check TEN_ARTIFACTS achievement
    const { data: views } = await supabase
      .from("artifact_views")
      .select("artifact_id")
      .eq("user_id", userId);

    const uniqueArtifacts = new Set((views || []).map((v: { artifact_id: string }) => v.artifact_id));
    if (uniqueArtifacts.size >= 10) {
      await this.awardAchievement(userId, "TEN_ARTIFACTS");
    }
  }

  // ── Donations ──────────────────────────────────────────────────────────────

  async createDonation(
    userId: number,
    amount: number,
    currency: string = "XTR",
    paymentMethod: string = "telegram_stars",
    transactionId?: string
  ): Promise<void> {
    const { error } = await supabase.from("donations").insert([
      {
        user_id: userId,
        amount,
        currency,
        payment_method: paymentMethod,
        transaction_id: transactionId || `stars_${Date.now()}`,
        status: "completed",
      },
    ]);

    if (error) {
      console.error("Create donation error:", error);
      throw error;
    }

    // Add XP for donation (1 XP per 1 currency)
    await this.addXP(userId, Math.floor(amount));

    // Award FIRST_DONATION
    await this.awardAchievement(userId, "FIRST_DONATION");

    // Check DONATED_100
    const { data: dons } = await supabase
      .from("donations")
      .select("amount")
      .eq("user_id", userId)
      .eq("status", "completed");

    const total = (dons || []).reduce((s: number, d: { amount: number }) => s + Number(d.amount), 0);
    if (total >= 100) await this.awardAchievement(userId, "DONATED_100");
    if (total >= 1000) await this.awardAchievement(userId, "DONATED_1000");
  }

  // ── Global donation stats ────────────────────────────────────────────────

  async getGlobalDonationStats(): Promise<{ totalRaised: number; donorsCount: number }> {
    const { data, error } = await supabase
      .from("donations")
      .select("amount, user_id")
      .eq("status", "completed");

    if (error) {
      console.error("Get global donation stats error:", error);
      return { totalRaised: 0, donorsCount: 0 };
    }

    const totalRaised = (data || []).reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0);
    const donorsCount = new Set((data || []).map((d: { user_id: number }) => d.user_id)).size;

    return { totalRaised, donorsCount };
  }

  async getDonationHistory(userId: number) {
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) console.error("Get donations error:", error);
    return data || [];
  }

  // ── XP ─────────────────────────────────────────────────────────────────────

  private async addXP(userId: number, xpToAdd: number): Promise<void> {
    // Use atomic increment via RPC would be ideal, but we'll do read+write
    const { data: user } = await supabase
      .from("users")
      .select("total_xp")
      .eq("id", userId)
      .maybeSingle();

    const currentXP = user?.total_xp || 0;
    await supabase
      .from("users")
      .update({ total_xp: currentXP + xpToAdd })
      .eq("id", userId);
  }

  // ── Achievements ───────────────────────────────────────────────────────────

  private async awardAchievement(userId: number, key: string): Promise<void> {
    const { data: existing } = await supabase
      .from("achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_key", key)
      .maybeSingle();

    if (existing) return;

    const { error } = await supabase
      .from("achievements")
      .insert([{ user_id: userId, achievement_key: key }]);

    if (error) console.error("Award achievement error:", error);
  }
  private async awardAchievement(userId: number, key: string): Promise<void> {
  const { data: existing } = await supabase
    .from("achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_key", key)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase
    .from("achievements")
    .insert([{ user_id: userId, achievement_key: key }]);

  if (error) console.error("Award achievement error:", error);
}

async createStarsInvoice(
  userId: number,
  amount: number
) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stars`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        userId,
        amount,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create Stars invoice");
  }

  return data;
}
}

export const museumAPI = new MuseumAPI();
