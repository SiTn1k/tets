import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, userId } = await req.json();

    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN missing");
    }

    const tgResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Museum Donation",
          description: `Donation from user ${userId}`,
          payload: `donation_${userId}_${Date.now()}`,
          currency: "XTR",
          prices: [
            {
              label: "Donation",
              amount: amount,
            },
          ],
        }),
      }
    );

    const tgData = await tgResponse.json();

    if (!tgData.ok) {
      throw new Error(
        tgData.description || "Telegram createInvoiceLink failed"
      );
    }

    return new Response(
      JSON.stringify({
        invoice_link: tgData.result,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: String(err),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});