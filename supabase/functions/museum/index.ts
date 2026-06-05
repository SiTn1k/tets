import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    const method = req.method;

    // POST /museum/auth - Create or get user
    if (path[1] === "auth" && method === "POST") {
      const { telegram_id, first_name, last_name, username, language_code, photo_url } = await req.json();

      if (!telegram_id || !first_name) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Try to get existing user
      let { data: user, error: getError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", telegram_id)
        .maybeSingle();

      if (!user) {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              telegram_id,
              first_name,
              last_name,
              username,
              language_code,
              photo_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        user = newUser;
      } else {
        // Update last_visit
        const { error: updateError } = await supabase
          .from("users")
          .update({ last_visit: new Date().toISOString() })
          .eq("id", user.id);
        if (updateError) throw updateError;
      }

      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /museum/profile/:telegram_id - Get user profile
    if (path[1] === "profile" && method === "GET") {
      const telegram_id = parseInt(path[2]);

      const { data: user, error } = await supabase
        .from("users")
        .select(
          `
          *,
          activity_sessions(session_start, session_end, minutes_spent),
          artifact_views(artifact_id),
          donations(amount, status),
          achievements(achievement_key)
        `
        )
        .eq("telegram_id", telegram_id)
        .single();

      if (error || !user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate stats
      const sessions = user.activity_sessions || [];
      const totalMinutes = sessions.reduce((sum: number, s: any) => sum + (s.minutes_spent || 0), 0);
      const visitCount = sessions.length;
      const artifactsViewed = new Set((user.artifact_views || []).map((av: any) => av.artifact_id)).size;
      const donations = (user.donations || []).filter((d: any) => d.status === "completed");
      const totalDonated = donations.reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);

      // Calculate XP
      let xp = user.total_xp;
      xp += totalMinutes * 1; // 1 XP per minute
      xp += artifactsViewed * 5; // 5 XP per artifact
      xp += Math.floor(totalDonated * 1); // 1 XP per 1 currency donated

      // Determine level
      let level = 1;
      if (xp >= 5000) level = 5; // Legend
      else if (xp >= 2000) level = 4; // Patron
      else if (xp >= 500) level = 3; // Historian
      else if (xp >= 100) level = 2; // Explorer
      else level = 1; // Novice

      const rankNames = {
        1: { ua: "Новачок", en: "Novice" },
        2: { ua: "Дослідник", en: "Explorer" },
        3: { ua: "Історик", en: "Historian" },
        4: { ua: "Патрон", en: "Patron" },
        5: { ua: "Легенда музею", en: "Museum Legend" },
      };

      return new Response(
        JSON.stringify({
          ...user,
          stats: {
            totalMinutes,
            visitCount,
            artifactsViewed,
            totalDonated,
            totalXP: xp,
            level,
            rankName: rankNames[level as keyof typeof rankNames],
            achievements: user.achievements || [],
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST /museum/session/start - Start activity session
    if (path[1] === "session" && path[2] === "start" && method === "POST") {
      const { telegram_id } = await req.json();

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegram_id)
        .single();

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: session, error } = await supabase
        .from("activity_sessions")
        .insert([
          {
            user_id: user.id,
            session_start: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(session), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /museum/session/end - End activity session
    if (path[1] === "session" && path[2] === "end" && method === "POST") {
      const { session_id, telegram_id } = await req.json();

      const { data: session, error: getError } = await supabase
        .from("activity_sessions")
        .select("*")
        .eq("id", session_id)
        .single();

      if (getError || !session) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const startTime = new Date(session.session_start).getTime();
      const endTime = new Date().getTime();
      const minutesSpent = Math.floor((endTime - startTime) / 60000);

      const { data: updatedSession, error: updateError } = await supabase
        .from("activity_sessions")
        .update({
          session_end: new Date().toISOString(),
          minutes_spent: minutesSpent,
        })
        .eq("id", session_id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update user's total XP
      const { data: user } = await supabase
        .from("users")
        .select("total_xp")
        .eq("telegram_id", telegram_id)
        .single();

      if (user) {
        const newXP = (user.total_xp || 0) + minutesSpent * 1;
        await supabase
          .from("users")
          .update({ total_xp: newXP })
          .eq("telegram_id", telegram_id);
      }

      return new Response(JSON.stringify(updatedSession), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /museum/artifact/view - Track artifact view
    if (path[1] === "artifact" && path[2] === "view" && method === "POST") {
      const { telegram_id, artifact_id } = await req.json();

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, total_xp")
        .eq("telegram_id", telegram_id)
        .single();

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if already viewed
      const { data: existing } = await supabase
        .from("artifact_views")
        .select("id")
        .eq("user_id", user.id)
        .eq("artifact_id", artifact_id)
        .maybeSingle();

      let view = existing;
      if (!existing) {
        const { data: newView, error: viewError } = await supabase
          .from("artifact_views")
          .insert([
            {
              user_id: user.id,
              artifact_id,
              viewed_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (viewError) throw viewError;
        view = newView;

        // Add XP for new artifact view
        const newXP = (user.total_xp || 0) + 5;
        await supabase
          .from("users")
          .update({ total_xp: newXP })
          .eq("id", user.id);
      }

      return new Response(JSON.stringify(view), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /museum/donation - Create donation record
    if (path[1] === "donation" && method === "POST") {
      const { telegram_id, amount, currency, payment_method, transaction_id } = await req.json();

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, total_xp")
        .eq("telegram_id", telegram_id)
        .single();

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: donation, error } = await supabase
        .from("donations")
        .insert([
          {
            user_id: user.id,
            amount,
            currency,
            payment_method,
            transaction_id,
            status: "completed",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add XP for donation
      const newXP = (user.total_xp || 0) + Math.floor(amount * 1);
      await supabase
        .from("users")
        .update({ total_xp: newXP })
        .eq("id", user.id);

      // Check for donations achievements
      const donationCount = await supabase
        .from("donations")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const totalDonated = donationCount.data?.reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0) || 0;

      // Award achievements
      if (totalDonated >= 100) {
        const { data: existing } = await supabase
          .from("achievements")
          .select("id")
          .eq("user_id", user.id)
          .eq("achievement_key", "DONATED_100")
          .maybeSingle();

        if (!existing) {
          await supabase
            .from("achievements")
            .insert([{ user_id: user.id, achievement_key: "DONATED_100" }]);
        }
      }

      if (totalDonated >= 1000) {
        const { data: existing } = await supabase
          .from("achievements")
          .select("id")
          .eq("user_id", user.id)
          .eq("achievement_key", "DONATED_1000")
          .maybeSingle();

        if (!existing) {
          await supabase
            .from("achievements")
            .insert([{ user_id: user.id, achievement_key: "DONATED_1000" }]);
        }
      }

      return new Response(JSON.stringify(donation), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
