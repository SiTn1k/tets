import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CRYPTOBOT_API = "https://pay.crypt.bot/api";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const cryptobotToken = Deno.env.get("CRYPTOBOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    const method = req.method;

    // POST /cryptobot/create-invoice
    if (path[1] === "create-invoice" && method === "POST") {
      if (!cryptobotToken) {
        return new Response(
          JSON.stringify({ error: "CRYPTOBOT_TOKEN not configured. Set it in Edge Function secrets." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { amount, currency, description, userId } = await req.json();

      if (!amount || !currency) {
        return new Response(
          JSON.stringify({ error: "Missing amount or currency" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(`${CRYPTOBOT_API}/createInvoice`, {
        method: "POST",
        headers: {
          "Crypto-Pay-API-Token": cryptobotToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: currency,
          amount: String(amount),
          description: description || "Museum Donation",
          payload: userId ? String(userId) : undefined,
          paid_btn_name: "callback",
          allow_comments: false,
          allow_anonymous: true,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        return new Response(
          JSON.stringify({ error: data.error || "CryptoBot API error" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const invoice = data.result;
      // Prefer mini_app_invoice_url for Telegram Mini Apps, then bot_invoice_url
      const payUrl = invoice.mini_app_invoice_url || invoice.bot_invoice_url || invoice.pay_url;

      return new Response(
        JSON.stringify({ invoice: { ...invoice, pay_url: payUrl } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /cryptobot/webhook — called by CryptoBot when invoice is paid
    if (path[1] === "webhook" && method === "POST") {
      const body = await req.json();

      // Current API format: { update_type, payload: Invoice, request_date }
      if (body.update_type === "invoice_paid" && body.payload) {
        const invoice = body.payload;

        if (invoice.status === "paid") {
          const userId = parseInt(invoice.payload || "0");
          const amount = parseFloat(invoice.amount || "0");
          const asset = invoice.asset;

          if (userId && amount > 0) {
            // Prevent duplicate recording
            const { data: existing } = await supabase
              .from("donations")
              .select("id")
              .eq("transaction_id", `cb_${invoice.invoice_id}`)
              .maybeSingle();

            if (!existing) {
              await supabase.from("donations").insert([{
                user_id: userId,
                amount,
                currency: asset,
                payment_method: "cryptobot",
                transaction_id: `cb_${invoice.invoice_id}`,
                status: "completed",
              }]);

              const { data: user } = await supabase
                .from("users")
                .select("total_xp")
                .eq("id", userId)
                .maybeSingle();

              if (user) {
                await supabase
                  .from("users")
                  .update({ total_xp: (user.total_xp || 0) + Math.floor(amount) })
                  .eq("id", userId);
              }

              // Award FIRST_DONATION
              const { data: existingFirst } = await supabase
                .from("achievements")
                .select("id")
                .eq("user_id", userId)
                .eq("achievement_key", "FIRST_DONATION")
                .maybeSingle();
              if (!existingFirst) {
                await supabase.from("achievements").insert([{ user_id: userId, achievement_key: "FIRST_DONATION" }]);
              }

              // Check DONATED_100 / DONATED_1000
              const { data: dons } = await supabase
                .from("donations")
                .select("amount")
                .eq("user_id", userId)
                .eq("status", "completed");
              const total = (dons || []).reduce((s: number, d: { amount: number }) => s + Number(d.amount), 0);
              if (total >= 100) {
                const { data: e } = await supabase.from("achievements").select("id").eq("user_id", userId).eq("achievement_key", "DONATED_100").maybeSingle();
                if (!e) await supabase.from("achievements").insert([{ user_id: userId, achievement_key: "DONATED_100" }]);
              }
              if (total >= 1000) {
                const { data: e } = await supabase.from("achievements").select("id").eq("user_id", userId).eq("achievement_key", "DONATED_1000").maybeSingle();
                if (!e) await supabase.from("achievements").insert([{ user_id: userId, achievement_key: "DONATED_1000" }]);
              }
            }
          }
        }
      }

      // Always return 200 to CryptoBot
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
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
