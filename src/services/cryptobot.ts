export type CryptoCurrency = "TON" | "USDT" | "BTC" | "ETH" | "USDC" | "LTC";

export interface CryptoInvoice {
  invoice_id: number;
  hash: string;
  bot_id: number;
  asset: CryptoCurrency;
  amount: string;
  pay_url: string;
  mini_app_invoice_url?: string;
  bot_invoice_url?: string;
  status: "active" | "paid" | "expired";
  created_at: string;
  paid_at: string | null;
  expiration_date: string;
  description: string;
}

export interface CryptoBotConfig {
  currencies: { key: CryptoCurrency; name: string; icon: string; color: string }[];
}

export const CRYPTOBOT_CONFIG: CryptoBotConfig = {
  currencies: [
    { key: "TON", name: "Toncoin", icon: "T", color: "#0098EA" },
    { key: "USDT", name: "Tether USD", icon: "$", color: "#26A17B" },
    { key: "BTC",  name: "Bitcoin",  icon: "B", color: "#F7931A" },
  ],
};

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cryptobot`;

class CryptoBotService {
  async createInvoice(
    amount: number,
    currency: CryptoCurrency,
    description: string = "Museum Donation",
    userId?: number
  ): Promise<CryptoInvoice | null> {
    try {
      const res = await fetch(`${API_BASE}/create-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ amount, currency, description, userId }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("CryptoBot createInvoice error:", err);
        return null;
      }

      const data = await res.json();
      return data.invoice || null;
    } catch (err) {
      console.error("CryptoBot createInvoice network error:", err);
      return null;
    }
  }

  openPaymentUrl(payUrl: string): void {
    // CryptoBot invoice URLs are NOT Telegram Stars invoice links,
    // so openInvoice won't work. Use openLink instead.
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(payUrl);
    } else {
      window.open(payUrl, "_blank");
    }
  }
}

export const cryptobotService = new CryptoBotService();
