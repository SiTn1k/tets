import { useState, useEffect, useCallback, useRef } from "react";
import { initTelegram, getTelegramUser } from "./lib/telegram";
import { museumAPI } from "./lib/api";
import type { UserStats } from "./lib/api";
import { cryptobotService, CRYPTOBOT_CONFIG, type CryptoCurrency } from "./services/cryptobot";
import { motion, AnimatePresence } from "motion/react";
import {
  Home as HomeIcon,
  Landmark,
  Clock,
  User,
  Heart,
  ChevronRight,
  X,
  Image as ImageIcon,
  Share2,
  Bookmark,
  Play,
  ChevronLeft,
  Shield,
  Crown,
  Sword,
  Building2,
  Sparkles,
  Star,
  Trophy,
  Zap,
  Globe,
  Palette,
  TrendingUp,
  Coins,
  CheckCircle2,
  Award,
  Loader2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Screen = "home" | "museum" | "timeline" | "profile" | "support";
type Lang = "ua" | "en";

interface Artifact {
  id: string;
  title: { ua: string; en: string };
  era: string;
  year: string;
  description: { ua: string; en: string };
  image: string;
  category: string;
}

interface TimelineEvent {
  id: string;
  year: string;
  title: { ua: string; en: string };
  description: { ua: string; en: string };
  era: string;
  icon: any;
}

interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface DbUser {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  total_xp: number;
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const ARTIFACTS: Artifact[] = [
  {
    id: "sophia",
    title: { ua: "Собор Святої Софії", en: "Saint Sophia Cathedral" },
    era: "Київська Русь",
    year: "1037",
    description: {
      ua: "Архітектурний шедевр Київської Русі, збудований за часів Ярослава Мудрого. Собор є одним із найважливіших символів української культури та історії.",
      en: "Architectural masterpiece of Kyivan Rus, built during the reign of Yaroslav the Wise. The cathedral is one of the most important symbols of Ukrainian culture and history.",
    },
    image: "https://images.unsplash.com/photo-1770112095032-693a32cace1d?w=800&h=600&fit=crop",
    category: "Архітектура",
  },
  {
    id: "vyshyvanka",
    title: { ua: "Вишиванка", en: "Vyshyvanka" },
    era: "Традиції",
    year: "XVII ст.",
    description: {
      ua: "Національний символ України - вишита сорочка з унікальними орнаментами. Кожен регіон має власні візерунки та символіку.",
      en: "National symbol of Ukraine - embroidered shirt with unique ornaments. Each region has its own patterns and symbolism.",
    },
    image: "https://images.unsplash.com/photo-1655678204995-0e1eb3d2fdbc?w=800&h=600&fit=crop",
    category: "Культура",
  },
  {
    id: "pysanka",
    title: { ua: "Писанка", en: "Pysanka" },
    era: "Народне мистецтво",
    year: "X ст.",
    description: {
      ua: "Давнє українське мистецтво розпису великодніх яєць символічними орнаментами. Кожен символ несе глибоке духовне значення.",
      en: "Ancient Ukrainian art of painting Easter eggs with symbolic ornaments. Each symbol carries deep spiritual meaning.",
    },
    image: "https://images.unsplash.com/photo-1617191574040-c57e8af59ddb?w=800&h=600&fit=crop",
    category: "Мистецтво",
  },
  {
    id: "cossack",
    title: { ua: "Запорозька Січ", en: "Zaporizhian Sich" },
    era: "Козацька доба",
    year: "1552",
    description: {
      ua: "Фортеця козацької демократії та символ української свободи. Тут народжувалася перша демократична республіка в Європі.",
      en: "Fortress of Cossack democracy and symbol of Ukrainian freedom. The first democratic republic in Europe was born here.",
    },
    image: "https://images.unsplash.com/photo-1766081816102-e8d70da3a2b1?w=800&h=600&fit=crop",
    category: "Історія",
  },
  {
    id: "bandura",
    title: { ua: "Бандура", en: "Bandura" },
    era: "Музична спадщина",
    year: "XVI ст.",
    description: {
      ua: "Національний український музичний інструмент з 60+ струнами. Кобзарі співали епічні думи про героїв та історію народу.",
      en: "National Ukrainian musical instrument with 60+ strings. Kobzars sang epic ballads about heroes and the history of the people.",
    },
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop",
    category: "Музика",
  },
  {
    id: "kyiv",
    title: { ua: "Київ", en: "Kyiv" },
    era: "Сучасність",
    year: "2024",
    description: {
      ua: "Столиця України - місто з тисячолітньою історією та сучасною культурою. Центр технологій, мистецтва та інновацій.",
      en: "Capital of Ukraine - city with thousand-year history and modern culture. Center of technology, art and innovation.",
    },
    image: "https://images.unsplash.com/photo-1605991362090-47188b84d40a?w=800&h=600&fit=crop",
    category: "Місто",
  },
  {
    id: "lavra",
    title: { ua: "Києво-Печерська Лавра", en: "Kyiv Pechersk Lavra" },
    era: "Київська Русь",
    year: "1051",
    description: {
      ua: "Монастир у печерах, заснований у 1051 р. Одне з найсвятіших місць Східного Православ'я з унікальними підземними лабіринтами.",
      en: "Cave monastery founded in 1051. One of the holiest sites of Eastern Orthodoxy with unique underground labyrinths.",
    },
    image: "https://images.unsplash.com/photo-1561542320-ec5c88087ab4?w=800&h=600&fit=crop",
    category: "Архітектура",
  },
  {
    id: "petrykivka",
    title: { ua: "Петриківський Розпис", en: "Petrykivka Painting" },
    era: "Народне мистецтво",
    year: "XVIII ст.",
    description: {
      ua: "Традиція квіткового народного розпису, внесена ЮНЕСКО до списку нематеріальної спадщини. Яскраві квіти та птахи символізують життя.",
      en: "Floral folk painting tradition inscribed on UNESCO's intangible heritage list. Vivid flowers and birds symbolize life.",
    },
    image: "https://images.unsplash.com/photo-1705769945723-10ecbe1f7df8?w=800&h=600&fit=crop",
    category: "Мистецтво",
  },
];

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "1",
    year: "882",
    title: { ua: "Заснування Київської Русі", en: "Foundation of Kyivan Rus" },
    description: { ua: "Князь Олег об'єднує слов'янські племена", en: "Prince Oleg unites Slavic tribes" },
    era: "Київська Русь",
    icon: Crown,
  },
  {
    id: "2",
    year: "988",
    title: { ua: "Хрещення Русі", en: "Baptism of Rus" },
    description: { ua: "Князь Володимир хрестить Київську Русь", en: "Prince Volodymyr baptizes Kyivan Rus" },
    era: "Київська Русь",
    icon: Star,
  },
  {
    id: "3",
    year: "1648",
    title: { ua: "Козацький Гетьманат", en: "Cossack Hetmanate" },
    description: { ua: "Богдан Хмельницький очолює повстання", en: "Bohdan Khmelnytsky leads uprising" },
    era: "Козацька доба",
    icon: Sword,
  },
  {
    id: "4",
    year: "1991",
    title: { ua: "Відновлення Незалежності", en: "Independence Restored" },
    description: { ua: "Україна оголошує незалежність", en: "Ukraine declares independence" },
    era: "Сучасність",
    icon: Building2,
  },
  {
    id: "5",
    year: "2050",
    title: { ua: "Зелена Енергія", en: "Green Energy" },
    description: { ua: "Україна досягає 100% відновлюваної енергії", en: "Ukraine achieves 100% renewable energy" },
    era: "Майбутнє",
    icon: Sparkles,
  },
];

const ALL_ACHIEVEMENTS = [
  { key: "FIRST_VISIT", icon: Award, ua: "Перший візит", en: "First Visit", color: "#ffd700" },
  { key: "ONE_HOUR", icon: Clock, ua: "Година в музеї", en: "One Hour", color: "#0057b7" },
  { key: "TEN_ARTIFACTS", icon: Landmark, ua: "Десять артефактів", en: "Ten Artifacts", color: "#ffd700" },
  { key: "FIRST_DONATION", icon: Heart, ua: "Перший донат", en: "First Donation", color: "#e85d04" },
  { key: "DONATED_100", icon: Coins, ua: "Меценат 100", en: "Patron 100", color: "#0057b7" },
  { key: "DONATED_1000", icon: Crown, ua: "Меценат 1000", en: "Patron 1000", color: "#ffd700" },
];

const TEXT: Record<Lang, any> = {
  ua: {
    home: { title: "Віртуальний Музей України", subtitle: "Подорож крізь тисячоліття історії", featured: "Рекомендовані", explore: "Досліджуйте", artifacts: "артефактів", viewAll: "Дивитись всі" },
    museum: { title: "Колекція", search: "Пошук артефактів...", all: "Всі" },
    timeline: { title: "Хронологія", subtitle: "Ключові події української історії" },
    profile: { title: "Профіль", rank: "Ранг", timeSpent: "Час у музеї", totalVisits: "Візитів", viewedArtifacts: "Переглянуто", achievements: "Досягнення", donations: "Донати", nextRank: "Наступний ранг" },
    support: { title: "Підтримка", selectAmount: "Оберіть суму", customAmount: "Інша сума", payStars: "Оплатити Stars", payCrypto: "Криптогаманець", thankYou: "Дякуємо за підтримку!", supportMessage: "Ваш внесок допомагає зберігати історію України.", totalRaised: "Зібрано разом", donorsCount: "Доброчинців", version: "Версія 1.0.0" },
    nav: { home: "Головна", museum: "Музей", timeline: "Час", profile: "Профіль", support: "Підтримка" },
  },
  en: {
    home: { title: "Virtual Museum of Ukraine", subtitle: "Journey through millennia of history", featured: "Featured", explore: "Explore", artifacts: "artifacts", viewAll: "View all" },
    museum: { title: "Collection", search: "Search artifacts...", all: "All" },
    timeline: { title: "Timeline", subtitle: "Key events in Ukrainian history" },
    profile: { title: "Profile", rank: "Rank", timeSpent: "Time in Museum", totalVisits: "Visits", viewedArtifacts: "Artifacts Viewed", achievements: "Achievements", donations: "Donations", nextRank: "Next Rank" },
    support: { title: "Support", selectAmount: "Select Amount", customAmount: "Custom Amount", payStars: "Pay with Stars", payCrypto: "Crypto Wallet", thankYou: "Thank you for support!", supportMessage: "Your contribution helps preserve Ukraine's history.", totalRaised: "Total Raised", donorsCount: "Donors", version: "Version 1.0.0" },
    nav: { home: "Home", museum: "Museum", timeline: "Timeline", profile: "Profile", support: "Support" },
  },
};

// ─── Components ────────────────────────────────────────────────────────────────

function GlassCard({ children, className = "", onClick, hover = true }: any) {
  return (
    <motion.div
      whileHover={onClick && hover ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`relative overflow-hidden bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-2xl ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}

function ArtifactCard({ artifact, lang, onClick }: { artifact: Artifact; lang: Lang; onClick: () => void }) {
  return (
    <GlassCard onClick={onClick} className="h-full group">
      <div className="relative aspect-[4/5] overflow-hidden">
        <motion.img initial={{ scale: 1 }} whileHover={{ scale: 1.1 }} transition={{ duration: 0.6 }} src={artifact.image} alt={artifact.title[lang]} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent opacity-90" />
        <div className="absolute top-3 right-3">
          <div className="px-2.5 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-white/90 tracking-wider">{artifact.year}</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
              <span className="text-[10px] text-[#ffd700] font-bold uppercase tracking-widest opacity-80">{artifact.category}</span>
            </div>
            <h3 className="text-white font-bold text-base leading-tight group-hover:text-[#ffd700] transition-colors">{artifact.title[lang]}</h3>
            <p className="text-white/40 text-[10px] font-medium tracking-wide truncate">{artifact.era}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Screens ───────────────────────────────────────────────────────────────────

function HomeScreen({ lang, setSelectedArtifact, setScreen }: any) {
  const t = TEXT[lang].home;

  const historicalEras = [
    { id: "kyivan-rus", title: { ua: "Київська Русь", en: "Kyivan Rus" }, period: "882-1240", icon: Crown, image: "https://images.unsplash.com/photo-1770112095032-693a32cace1d?w=600&h=400&fit=crop" },
    { id: "cossack", title: { ua: "Козацька Доба", en: "Cossack Era" }, period: "1648-1775", icon: Sword, image: "https://images.unsplash.com/photo-1766081816102-e8d70da3a2b1?w=600&h=400&fit=crop" },
    { id: "modern", title: { ua: "Сучасна Україна", en: "Modern Ukraine" }, period: "1991-Present", icon: Building2, image: "https://images.unsplash.com/photo-1605991362090-47188b84d40a?w=600&h=400&fit=crop" },
    { id: "future", title: { ua: "Майбутнє", en: "Future Vision" }, period: "2050+", icon: Sparkles, image: "https://images.unsplash.com/photo-1762341154386-fa765c9f2aa5?w=600&h=400&fit=crop" },
  ];

  const featuredCollections = [
    { title: { ua: "Мистецтво", en: "Art" }, count: "45", icon: Palette, color: "#ffd700" },
    { title: { ua: "Архітектура", en: "Architecture" }, count: "32", icon: Building2, color: "#0057b7" },
    { title: { ua: "Культура", en: "Culture" }, count: "58", icon: Star, color: "#ffd700" },
    { title: { ua: "Історія", en: "History" }, count: "67", icon: Shield, color: "#0057b7" },
  ];

  return (
    <div className="space-y-10 pb-32">
      {/* Cinematic Hero */}
      <div className="relative h-[520px] -mx-4 -mt-4 overflow-hidden">
        <motion.img initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }} src="https://images.unsplash.com/photo-1770112095032-693a32cace1d?w=1200&h=800&fit=crop" alt="Museum hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 to-transparent" />

        <div className="absolute top-10 left-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2.5 px-4 py-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
            <div className="w-6 h-4 rounded-[3px] overflow-hidden flex flex-col border border-white/20">
              <div className="flex-1 bg-[#0057b7]" />
              <div className="flex-1 bg-[#ffd700]" />
            </div>
            <span className="text-[10px] text-white/80 font-black uppercase tracking-[0.25em]">Ukraine Museum</span>
          </motion.div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-8 pb-12">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }} className="space-y-5">
            <h1 className="text-6xl font-black text-white leading-[0.85] tracking-tighter">
              {lang === "ua" ? "УКРАЇНА" : "UKRAINE"}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-white to-[#0057b7]">{lang === "ua" ? "КРІЗЬ ЧАС" : "THROUGH TIME"}</span>
            </h1>
            <p className="text-lg text-white/70 max-w-[320px] leading-relaxed font-medium tracking-tight">{t.subtitle}</p>
            <div className="flex items-center gap-4 pt-6">
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255, 215, 0, 0.3)" }} whileTap={{ scale: 0.95 }} onClick={() => setScreen("museum")} className="px-10 py-5 bg-gradient-to-r from-[#ffd700] to-[#ffd700]/80 text-[#0a0a0f] rounded-full font-black text-sm uppercase tracking-widest shadow-2xl">
                {t.explore}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-2">
        <div className="grid grid-cols-4 gap-3">
          {[{ value: "3K+", label: lang === "ua" ? "Років" : "Years" }, { value: "150+", label: lang === "ua" ? "Предметів" : "Items" }, { value: "12", label: lang === "ua" ? "Епох" : "Eras" }, { value: "50K", label: lang === "ua" ? "Візитів" : "Views" }].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
              <GlassCard className="py-5 text-center group" hover={false}>
                <div className="text-xl font-black text-white mb-1 tracking-tighter group-hover:text-[#ffd700] transition-colors">{stat.value}</div>
                <div className="text-[9px] text-white/40 font-black uppercase tracking-widest">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Eras */}
      <div className="space-y-8">
        <div className="flex items-end justify-between px-3">
          <div className="space-y-1">
            <h2 className="text-[10px] font-black text-[#ffd700] uppercase tracking-[0.4em]">The Journey</h2>
            <h3 className="text-3xl font-black text-white tracking-tighter">Timeline Eras</h3>
          </div>
          <motion.button whileHover={{ x: 5 }} onClick={() => setScreen("timeline")} className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            VIEW ALL <ChevronRight className="w-3 h-3" />
          </motion.button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-8 no-scrollbar -mx-4 px-6">
          {historicalEras.map((era, i) => (
            <motion.div key={era.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex-shrink-0 w-[280px]">
              <GlassCard onClick={() => setScreen("timeline")} className="group cursor-pointer overflow-hidden p-0 border-white/5 h-[400px]">
                <div className="relative h-full">
                  <img src={era.image} alt={era.title[lang]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
                  <div className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur-2xl rounded-[20px] border border-white/20 shadow-2xl"><era.icon className="w-6 h-6 text-white" /></div>
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="text-[10px] font-black text-[#ffd700] uppercase tracking-[0.3em] mb-2">{era.period}</div>
                    <h4 className="text-2xl font-black text-white mb-3 tracking-tight leading-none group-hover:translate-x-2 transition-transform duration-500">{era.title[lang]}</h4>
                    <div className="h-1 w-12 bg-white/20 rounded-full group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-[#ffd700] group-hover:to-transparent transition-all duration-700" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Collections */}
      <div className="space-y-8 px-2">
        <h3 className="text-3xl font-black text-white tracking-tighter px-1">Collections</h3>
        <div className="grid grid-cols-2 gap-5">
          {featuredCollections.map((col, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
              <GlassCard onClick={() => setScreen("museum")} className="p-6 group">
                <div className="flex flex-col gap-5">
                  <div className="w-14 h-14 rounded-[22px] flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 shadow-2xl" style={{ backgroundColor: `${col.color}15`, border: `1px solid ${col.color}30` }}>
                    <col.icon className="w-7 h-7" style={{ color: col.color }} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white mb-1 tracking-tight">{col.title[lang]}</h4>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{col.count} {t.artifacts}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Artifacts */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-3">
          <h3 className="text-3xl font-black text-white tracking-tighter">{t.featured}</h3>
          <motion.button whileHover={{ x: 5 }} onClick={() => setScreen("museum")} className="text-[10px] font-black text-[#ffd700] uppercase tracking-[0.2em] flex items-center gap-2">
            EXPLORE ALL <ChevronRight className="w-3 h-3" />
          </motion.button>
        </div>
        <div className="grid grid-cols-2 gap-5 px-2">
          {ARTIFACTS.slice(0, 4).map((art, i) => (
            <motion.div key={art.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.1 }}>
              <ArtifactCard artifact={art} lang={lang} onClick={() => setSelectedArtifact(art)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MuseumScreen({ lang, setSelectedArtifact, onArtifactView }: any) {
  const t = TEXT[lang].museum;
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", label: t.all, icon: Globe },
    { id: "Архітектура", label: lang === "ua" ? "Архітектура" : "Architecture", icon: Building2 },
    { id: "Мистецтво", label: lang === "ua" ? "Мистецтво" : "Art", icon: Palette },
    { id: "Культура", label: lang === "ua" ? "Культура" : "Culture", icon: Star },
    { id: "Історія", label: lang === "ua" ? "Історія" : "History", icon: Shield },
    { id: "Музика", label: lang === "ua" ? "Музика" : "Music", icon: Play },
  ];

  const filteredArtifacts = ARTIFACTS.filter((a) => {
    const matchesFilter = filter === "all" || a.category === filter;
    const matchesSearch = a.title[lang].toLowerCase().includes(searchQuery.toLowerCase()) || a.description[lang].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleArtifactClick = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    onArtifactView(artifact.id);
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-4xl font-black text-white tracking-tighter">{t.title}</h1>
          <div className="flex p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30"}`}><Landmark className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/30"}`}><Clock className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><X className="w-5 h-5 text-white/20 group-focus-within:text-[#ffd700] transition-colors" /></div>
          <input type="text" placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-5 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[22px] text-white text-sm font-medium focus:outline-none focus:border-[#ffd700]/50 transition-all placeholder:text-white/20 shadow-2xl" />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = filter === cat.id;
          return (
            <motion.button key={cat.id} whileTap={{ scale: 0.95 }} onClick={() => setFilter(cat.id)} className={`flex items-center gap-2 px-6 py-3.5 rounded-full border whitespace-nowrap transition-all font-black text-[10px] uppercase tracking-widest ${isActive ? "bg-[#ffd700] border-[#ffd700] text-[#0a0a0f] shadow-[0_0_20px_rgba(255,215,0,0.3)]" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}>
              <Icon className="w-3.5 h-3.5" />{cat.label}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="popLayout">
        {viewMode === "grid" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-5 px-1">
            {filteredArtifacts.map((artifact, i) => (
              <motion.div key={artifact.id} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ArtifactCard artifact={artifact} lang={lang} onClick={() => handleArtifactClick(artifact)} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 px-1">
            {filteredArtifacts.map((artifact, i) => (
              <motion.div key={artifact.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleArtifactClick(artifact)}>
                <GlassCard className="p-0 overflow-hidden cursor-pointer hover:border-white/20 transition-all">
                  <div className="flex gap-5">
                    <div className="relative w-32 h-32 flex-shrink-0"><img src={artifact.image} alt={artifact.title[lang]} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0f]/40" /></div>
                    <div className="flex-1 py-4 pr-5 flex flex-col justify-center space-y-2">
                      <div className="flex items-start justify-between"><h3 className="text-white font-black text-base tracking-tight leading-tight">{artifact.title[lang]}</h3><ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0 ml-2" /></div>
                      <p className="text-white/40 text-[10px] font-medium leading-relaxed line-clamp-2">{artifact.description[lang]}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-[#ffd700]/10 text-[#ffd700] uppercase tracking-widest border border-[#ffd700]/20">{artifact.year}</span>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{artifact.era}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimelineScreen({ lang }: any) {
  const t = TEXT[lang].timeline;
  return (
    <div className="space-y-8 pb-32 pt-4 px-1">
      <div className="space-y-1">
        <h2 className="text-[10px] font-black text-[#ffd700] uppercase tracking-[0.4em]">Chronicle</h2>
        <h1 className="text-4xl font-black text-white tracking-tighter">{t.title}</h1>
        <p className="text-sm text-white/40 font-medium tracking-tight leading-relaxed">{t.subtitle}</p>
      </div>
      <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#ffd700] before:via-[#0057b7] before:to-transparent before:opacity-20">
        {TIMELINE_EVENTS.map((event, i) => {
          const Icon = event.icon;
          return (
            <motion.div key={event.id} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.8 }} className="relative flex items-start gap-8 group">
              <div className="flex-shrink-0 z-10">
                <div className="w-10 h-10 rounded-2xl bg-[#0a0a0f] border-2 border-[#ffd700]/30 flex items-center justify-center group-hover:border-[#ffd700] group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(255,215,0,0.1)]"><Icon className="w-5 h-5 text-[#ffd700]" /></div>
              </div>
              <div className="flex-1">
                <GlassCard className="p-6 group-hover:bg-white/[0.05] transition-colors duration-500">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-[#ffd700] uppercase tracking-widest">{event.year}</span>
                    <div className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black text-white/20 uppercase tracking-widest">{event.era}</div>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 tracking-tight group-hover:text-[#ffd700] transition-colors">{event.title[lang]}</h3>
                  <p className="text-xs text-white/40 leading-relaxed font-medium tracking-tight">{event.description[lang]}</p>
                </GlassCard>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileScreen({ lang, setLang, telegramUser, dbUser, stats, onRefresh }: any) {
  const t = TEXT[lang].profile;
  const avatarUrl = telegramUser?.photo_url || "https://images.unsplash.com/photo-1587397845856-e6cf49176c70";

  const xpPercent = stats ? Math.min((stats.totalXP / stats.nextLevelXP) * 100, 100) : 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="relative pt-8 pb-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-br from-[#0057b7]/20 to-[#ffd700]/20 blur-3xl -z-10" />
        <div className="flex flex-col items-center">
          <div className="relative">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#0057b7] via-[#a855f7] to-[#ffd700]">
              <div className="w-full h-full rounded-full border-4 border-[#0a0a0f] overflow-hidden">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#0057b7] to-[#ffd700] p-2 rounded-full shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mt-4">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h1 className="text-2xl font-bold text-white">{telegramUser?.first_name || "Guest"}</h1>
              <Star className="w-5 h-5 text-[#ffd700] fill-[#ffd700]" />
            </div>
            <p className="text-sm text-white/50 tracking-wide">@{telegramUser?.username || "guest"}</p>
          </motion.div>
        </div>
      </div>

      {/* Rank */}
      <GlassCard className="p-5 overflow-hidden relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{t.rank}</div>
            <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0057b7] to-[#ffd700]">
              {stats?.rankName || t.rank} &bull; LVL {stats?.level || 1}
            </div>
          </div>
          <div className="p-2 bg-white/5 rounded-xl"><Trophy className="w-5 h-5 text-[#ffd700]" /></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60">{stats?.totalXP || 0} XP</span>
            <span className="text-white/60">{stats?.nextLevelXP || 100} XP</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-[#0057b7] to-[#ffd700]" />
          </div>
          <div className="text-[10px] text-center text-white/30 pt-1 italic">{t.nextRank}</div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: t.timeSpent, value: stats ? `${stats.totalMinutes}m` : "0m" },
          { icon: Landmark, label: t.totalVisits, value: stats?.visitCount || 0 },
          { icon: ImageIcon, label: t.viewedArtifacts, value: stats?.artifactsViewed || 0 },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
            <GlassCard className="p-3 text-center flex flex-col items-center gap-1.5 h-full">
              <stat.icon className="w-4 h-4 text-[#ffd700]/60" />
              <div className="text-sm font-bold text-white">{stat.value}</div>
              <div className="text-[9px] text-white/40 leading-tight">{stat.label}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Total Donated */}
      <GlassCard className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ffd700]/10 rounded-lg"><Heart className="w-4 h-4 text-[#ffd700]" /></div>
          <div>
            <div className="text-[10px] text-white/40">{lang === "ua" ? "Загальний донат" : "Total Donated"}</div>
            <div className="text-lg font-bold text-white">{stats?.totalDonated || 0} {lang === "ua" ? "Stars" : "Stars"}</div>
          </div>
        </div>
        <TrendingUp className="w-4 h-4 text-[#ffd700]/40" />
      </GlassCard>

      {/* Achievements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.achievements}</h3>
          <span className="text-[10px] text-[#ffd700] font-bold">{stats?.achievements?.length || 0}/{ALL_ACHIEVEMENTS.length}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {ALL_ACHIEVEMENTS.map((ach) => {
            const unlocked = stats?.achievements?.includes(ach.key);
            return (
              <motion.div key={ach.key} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                <GlassCard className={`p-3 flex flex-col items-center gap-2 w-28 ${unlocked ? "" : "opacity-40"}`}>
                  <div className="p-2.5 rounded-2xl bg-white/5" style={{ color: unlocked ? ach.color : "#555" }}>
                    <ach.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/80 text-center">{ach[lang]}</span>
                  {unlocked && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 pt-4">
        <button onClick={() => setLang(lang === "ua" ? "en" : "ua")} className="text-xs text-white/40 hover:text-white transition-colors">
          {lang === "ua" ? "English" : "Українська"}
        </button>
        <p className="text-[10px] text-white/20">ID: {telegramUser?.id || "guest"}</p>
      </div>
    </div>
  );
}

function SupportScreen({ lang, telegramUser, dbUser, onDonated }: any) {
  const t = TEXT[lang].support;
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalStats, setGlobalStats] = useState<{ totalRaised: number; donorsCount: number }>({ totalRaised: 0, donorsCount: 0 });
  const [showCryptoPicker, setShowCryptoPicker] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState<CryptoCurrency | null>(null);
  const successAmountRef = useRef<number>(0);

  const amounts = [10, 25, 50, 100];

  // Load global donation stats from DB on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await museumAPI.getGlobalDonationStats();
        setGlobalStats(stats);
      } catch (err) {
        console.error("Load donation stats error:", err);
      }
    };
    loadStats();
  }, []);

  const refreshGlobalStats = async () => {
    const stats = await museumAPI.getGlobalDonationStats();
    setGlobalStats(stats);
  };

  const getAmount = () => {
    const amt = customAmount ? parseFloat(customAmount) : selectedAmount;
    return amt && amt > 0 ? amt : 0;
  };

  
  // ── CryptoBot payment ───────────────────────────────────────────────────

  const handleCryptoPayment = async (currency: CryptoCurrency) => {
    if (!dbUser) return;
    const amount = getAmount();
    if (amount <= 0) return;

    setCryptoLoading(currency);
    successAmountRef.current = amount;

    try {
      const invoice = await cryptobotService.createInvoice(
        amount,
        currency,
        lang === "ua" ? "Підтримка музею" : "Museum Donation",
        dbUser.id
      );

      if (invoice && invoice.pay_url) {
        cryptobotService.openPaymentUrl(invoice.pay_url);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 4000);
      } else {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert(
            lang === "ua"
              ? "Помилка створення інвойсу. Перевірте налаштування CryptoBot."
              : "Failed to create invoice. Check CryptoBot configuration."
          );
        } else {
          alert(lang === "ua"
            ? "Помилка створення інвойсу. Перевірте налаштування CryptoBot."
            : "Failed to create invoice. Check CryptoBot configuration.");
        }
      }
    } catch (err) {
      console.error("Crypto payment failed:", err);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(
          lang === "ua" ? "Помилка крипто-платежу." : "Crypto payment error."
        );
      }
    } finally {
      setCryptoLoading(null);
      setShowCryptoPicker(false);
    }
  };


  // ── Telegram Stars payment ──────────────────────────────────────────────

  const handleStarsPayment = async () => {
    if (!dbUser) return;
    const amount = getAmount();
    if (amount <= 0) return;

    setIsProcessing(true);
    successAmountRef.current = amount;

    try {
      if (window.Telegram?.WebApp) {
        const WebApp = window.Telegram.WebApp;

        const invoiceData = await museumAPI.createStarsInvoice(dbUser.id, amount);

        if (invoiceData && invoiceData.invoice_link) {
          WebApp.openInvoice(invoiceData.invoice_link, async (status) => {
            if (status === 'paid') {
              try {
                await museumAPI.createDonation(
                  dbUser.id,
                  amount,
                  'XTR',
                  'telegram_stars',
                  `stars_${dbUser.id}_${Date.now()}`
                );
              } catch (e) {
                console.error("Failed to record Stars donation:", e);
              }

              await refreshGlobalStats();
              onDonated();
              setIsSuccess(true);
              setTimeout(() => setIsSuccess(false), 4000);

              if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred("success");
              }
            } else {
              WebApp.showAlert(lang === "ua" ? "Оплату скасовано." : "Payment canceled.");
            }
          });
        } else {
          WebApp.showAlert(lang === "ua" ? "Не вдалося створити інвойс." : "Invoice creation failed.");
        }
      } else {
        alert("Для оплати Stars відкрийте міні-апп у Telegram");
      }
    } catch (err) {
      console.error("Stars payment failed:", err);
      if (window.Telegram?.WebApp) {
         window.Telegram.WebApp.showAlert(lang === "ua" ? "Помилка платежу." : "Payment error.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="w-24 h-24 bg-gradient-to-br from-[#0057b7] to-[#ffd700] rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-white mb-2">{t.thankYou}</motion.h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center">
          <p className="text-[#ffd700] font-bold text-lg mb-1">{successAmountRef.current} Stars</p>
          <p className="text-white/60 leading-relaxed max-w-xs">{t.supportMessage}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Real Stats from DB */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp className="w-12 h-12 text-[#ffd700]" /></div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{t.totalRaised}</div>
          <div className="text-xl font-bold text-white">{globalStats.totalRaised.toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10"><User className="w-12 h-12 text-[#0057b7]" /></div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{t.donorsCount}</div>
          <div className="text-xl font-bold text-white">{globalStats.donorsCount.toLocaleString()}</div>
        </GlassCard>
      </div>

      {/* Amount Selector */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider px-1">{t.selectAmount}</h3>
        <div className="grid grid-cols-4 gap-2">
          {amounts.map((amt) => (
            <button key={amt} onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }} className={`py-3 rounded-xl border transition-all ${selectedAmount === amt ? "bg-[#0057b7]/20 border-[#0057b7] text-white shadow-lg shadow-blue-500/10" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}>
              <div className="text-lg font-bold">{amt}</div>
              <div className="text-[9px] font-medium opacity-50">Stars</div>
            </button>
          ))}
        </div>
        <input type="number" placeholder={t.customAmount} value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }} className={`w-full py-3 px-4 rounded-xl border transition-all text-sm font-bold outline-none ${customAmount !== "" ? "bg-[#0057b7]/20 border-[#0057b7] text-white" : "bg-white/5 border-white/10 text-white/60"}`} />
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider px-1">
          {lang === "ua" ? "Спосіб оплати" : "Payment Method"}
        </h3>
        <div className="space-y-3">
          {/* Telegram Stars */}
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleStarsPayment} disabled={isProcessing || getAmount() <= 0} className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#0088cc] to-[#00aaff] flex items-center justify-between group shadow-lg shadow-blue-500/20 disabled:opacity-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl"><Star className="w-6 h-6 text-white fill-white" /></div>
              <div className="text-left">
                <div className="text-white font-bold">{t.payStars}</div>
                <div className="text-white/70 text-[10px]">
                  {isProcessing
                    ? (lang === "ua" ? "Обробка..." : "Processing...")
                    : `${getAmount() || 0} Stars ≈ $${((getAmount() || 0) * 0.013).toFixed(2)}`}
                </div>
              </div>
            </div>
            {isProcessing ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <ChevronRight className="w-5 h-5 text-white/60" />}
          </motion.button>

          {/* CryptoBot */}
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowCryptoPicker(!showCryptoPicker)} disabled={getAmount() <= 0} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors disabled:opacity-30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ffd700]/10 rounded-xl"><Coins className="w-6 h-6 text-[#ffd700]" /></div>
              <div className="text-left">
                <div className="text-white font-bold">{t.payCrypto}</div>
                <div className="text-white/40 text-[10px]">TON, USDT, BTC</div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${showCryptoPicker ? "rotate-90" : ""}`} />
          </motion.button>
        </div>

        {/* Crypto Currency Picker */}
        <AnimatePresence>
          {showCryptoPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="space-y-2 pt-1">
                {CRYPTOBOT_CONFIG.currencies.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => handleCryptoPayment(c.key)}
                    disabled={cryptoLoading !== null}
                    className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                        {c.icon}
                      </div>
                      <div className="text-left">
                        <div className="text-white font-bold text-sm">{c.name}</div>
                        <div className="text-white/30 text-[10px]">{c.key}</div>
                      </div>
                    </div>
                    {cryptoLoading === c.key ? (
                      <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <GlassCard className="p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#ffd700]/10 rounded-lg"><Shield className="w-4 h-4 text-[#ffd700]" /></div>
          <p className="text-xs text-white/60 leading-relaxed">{t.supportMessage}</p>
        </div>
      </GlassCard>

      <div className="pt-4 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">{t.version}</p>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [lang, setLang] = useState<Lang>("ua");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramUserData | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<number | null>(null);

  // ── Init Telegram + Auth + Session ────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        initTelegram();

        const user = getTelegramUser();

        if (user) {
          setTelegramUser(user);
          // Set language from Telegram
          if (user.language_code === "uk" || user.language_code === "ua") setLang("ua");

          // Auth user in DB
          const profile = await museumAPI.authUser(user);
          setDbUser(profile);

          // Start session
          const sid = await museumAPI.startSession(profile.id);
          sessionIdRef.current = sid;

          // Load stats
          const s = await museumAPI.getStats(profile.id, lang);
          setStats(s);
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      // End session on unmount
      if (sessionIdRef.current && dbUser) {
        museumAPI.endSession(sessionIdRef.current, dbUser.id).catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Refresh stats when screen changes to profile ─────────────────────────

  const refreshStats = useCallback(async () => {
    if (!dbUser) return;
    try {
      const s = await museumAPI.getStats(dbUser.id, lang);
      setStats(s);
    } catch (err) {
      console.error("Refresh stats error:", err);
    }
  }, [dbUser, lang]);

  useEffect(() => {
    if (screen === "profile") refreshStats();
  }, [screen, refreshStats]);

  // ── Artifact view tracking ───────────────────────────────────────────────

  const handleArtifactView = useCallback(
    (artifactId: string) => {
      if (!dbUser) return;
      museumAPI.trackArtifactView(dbUser.id, artifactId).catch(console.error);
    },
    [dbUser]
  );

  // ── Donation callback ────────────────────────────────────────────────────

  const handleDonated = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  // ── Loading screen ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-[3px] border-[#ffd700]/30 border-t-[#ffd700] rounded-full" />
      </div>
    );
  }

  const navItems = [
    { id: "home" as Screen, icon: HomeIcon, label: TEXT[lang].nav.home },
    { id: "museum" as Screen, icon: Landmark, label: TEXT[lang].nav.museum },
    { id: "timeline" as Screen, icon: Clock, label: TEXT[lang].nav.timeline },
    { id: "profile" as Screen, icon: User, label: TEXT[lang].nav.profile },
    { id: "support" as Screen, icon: Heart, label: TEXT[lang].nav.support },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0057b7]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ffd700]/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[#0a0a0f]/20 backdrop-blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col">
        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={screen} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {screen === "home" && <HomeScreen lang={lang} setSelectedArtifact={setSelectedArtifact} setScreen={setScreen} />}
              {screen === "museum" && <MuseumScreen lang={lang} setSelectedArtifact={setSelectedArtifact} onArtifactView={handleArtifactView} />}
              {screen === "timeline" && <TimelineScreen lang={lang} />}
              {screen === "profile" && <ProfileScreen lang={lang} setLang={setLang} telegramUser={telegramUser} dbUser={dbUser} stats={stats} onRefresh={refreshStats} />}
              {screen === "support" && <SupportScreen lang={lang} telegramUser={telegramUser} dbUser={dbUser} onDonated={handleDonated} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8">
          <div className="max-w-md mx-auto relative">
            <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-[32px] shadow-2xl" />
            <div className="relative flex items-center justify-around px-4 py-4">
              {navItems.map((item) => {
                const isActive = screen === item.id;
                return (
                  <button key={item.id} onClick={() => setScreen(item.id)} className="relative flex flex-col items-center gap-1.5 px-4 group">
                    <motion.div animate={isActive ? { y: -8, scale: 1.1 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={`relative z-10 transition-colors duration-300 ${isActive ? "text-[#ffd700]" : "text-white/30 group-hover:text-white/60"}`}>
                      <item.icon className="w-6 h-6" />
                      {isActive && <motion.div layoutId="nav-glow" className="absolute -inset-4 bg-[#ffd700]/10 blur-xl rounded-full" />}
                    </motion.div>
                    {isActive && <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-[10px] font-black text-[#ffd700] uppercase tracking-widest leading-none">{item.label}</motion.span>}
                    {isActive && <motion.div layoutId="nav-indicator" className="absolute -bottom-1 w-1 h-1 bg-[#ffd700] rounded-full shadow-[0_0_10px_#ffd700]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Artifact Detail Modal */}
      <AnimatePresence>
        {selectedArtifact && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#0a0a0f]">
            <div className="h-full overflow-y-auto">
              <div className="max-w-md mx-auto">
                <div className="relative h-96">
                  <img src={selectedArtifact.image} alt={selectedArtifact.title[lang]} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
                  <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    <button onClick={() => setSelectedArtifact(null)} className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="flex items-center gap-2">
                      <button className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white"><Share2 className="w-4 h-4" /></button>
                      <button className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white"><Bookmark className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <GlassCard className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-1 rounded-full bg-[#ffd700]/20 text-[#ffd700] text-xs font-medium">{selectedArtifact.year}</div>
                        <div className="px-2 py-1 rounded-full bg-[#0057b7]/20 text-[#0057b7] text-xs font-medium">{selectedArtifact.category}</div>
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-1">{selectedArtifact.title[lang]}</h1>
                      <p className="text-sm text-white/60">{selectedArtifact.era}</p>
                    </GlassCard>
                  </div>
                </div>
                <div className="p-4 space-y-5 pb-8">
                  <div>
                    <h2 className="text-xs uppercase tracking-wider text-white/50 mb-3 font-semibold">{lang === "ua" ? "Опис" : "Description"}</h2>
                    <p className="text-sm text-white/80 leading-relaxed">{selectedArtifact.description[lang]}</p>
                  </div>
                  {/* Related Artifacts */}
                  <div>
                    <h2 className="text-xs uppercase tracking-wider text-white/50 mb-3 font-semibold">{lang === "ua" ? "Схожі артефакти" : "Related Artifacts"}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {ARTIFACTS.filter((a) => a.id !== selectedArtifact.id && (a.era === selectedArtifact.era || a.category === selectedArtifact.category))
                        .slice(0, 4)
                        .map((artifact) => (
                          <div key={artifact.id} onClick={() => { setSelectedArtifact(artifact); handleArtifactView(artifact.id); }} className="cursor-pointer">
                            <GlassCard className="overflow-hidden hover:border-white/20 transition-all">
                              <div className="relative h-28 overflow-hidden">
                                <img src={artifact.image} alt={artifact.title[lang]} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2">
                                  <h3 className="text-white font-semibold text-xs mb-0.5 line-clamp-1">{artifact.title[lang]}</h3>
                                  <p className="text-white/60 text-[10px]">{artifact.year}</p>
                                </div>
                              </div>
                            </GlassCard>
                          </div>
                        ))}
                    </div>
                  </div>
                  <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0057b7] to-[#ffd700] text-white font-semibold text-sm shadow-lg active:scale-95 flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    {lang === "ua" ? "Віртуальний 3D перегляд" : "Virtual 3D View"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
