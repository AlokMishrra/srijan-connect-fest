import { supabase } from "@/integrations/supabase/client";

export interface Speaker {
  id: string;
  name: string;
  company: string;
  image: string;
  linkedin: string;
}

export interface ScheduleEvent {
  time: string;
  title: string;
  description: string;
  note?: string;
  image?: string;
  formLink?: string; // links to specific event form (event_name in form builder)
}

export interface PreEvent {
  title: string;
  date: string;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  image: string;
}

export interface FeaturedEvent {
  name: string;
  description: string;
  day: string;
  formLink?: string; // links to specific event form (event_name in form builder)
}

export interface SiteData {
  heroImage: string;
  speakers: Speaker[];
  schedule: {
    day1: ScheduleEvent[];
    day2: ScheduleEvent[];
    day3: ScheduleEvent[];
  };
  preEvents: PreEvent[];
  eventImages: Record<string, string>;
  partners: Partner[];
  partnerCategories: string[];
  countdownDate: string;
  events: string[];
  featuredEvents: FeaturedEvent[];
}

export const DEFAULT_DATA: SiteData = {
  heroImage: "",
  countdownDate: "2026-04-23T09:00:00",
  events: [
    "ACE the Case",
    "Corporate Deal",
    "USPL (Uttrakhand Startup Premier League)",
    "GVFP Demo Day",
    "Partner Unity Fest",
    "Bid and Build",
    "Startup Expo",
    "Project Exhibition",
    "Main Stage Panel Discussions - Fireside Chat",
    "Speed Mentoring",
  ],
  featuredEvents: [
    { name: "ACE the Case", description: "Case study competition for aspiring strategists and problem solvers.", day: "Day 1" },
    { name: "Corporate Deal", description: "Simulate real-world corporate deals and negotiations.", day: "Day 1" },
    { name: "GVFP Demo Day", description: "Pitch your product to investors. Get feedback, funding leads, and visibility.", day: "Day 2" },
    { name: "Partner Unity Fest", description: "Collaboration & engagement activities with ecosystem partners.", day: "Day 2" },
    { name: "Bid and Build", description: "Competitive bidding and team-building startup challenge.", day: "Day 2" },
    { name: "Startup Expo", description: "North India's premier startup showcase. Booths, demos, and investor meetings.", day: "Day 3" },
    { name: "Project Exhibition", description: "Exhibit your prototypes and innovative projects to a live audience.", day: "Day 3" },
    { name: "Speed Mentoring", description: "Rapid mentoring sessions with industry experts and investors.", day: "Day 3" },
  ],
  speakers: [
    { id: "1", name: "Rajesh Kumar", company: "TechVentures India", image: "", linkedin: "https://linkedin.com" },
    { id: "2", name: "Amit Sharma", company: "InnovateTech Labs", image: "", linkedin: "https://linkedin.com" },
    { id: "3", name: "Priya Patel", company: "StartupGrid", image: "", linkedin: "https://linkedin.com" },
    { id: "4", name: "Vikram Singh", company: "GreenFund Capital", image: "", linkedin: "https://linkedin.com" },
  ],
  schedule: {
    day1: [
      { time: "9:00 AM", title: "ACE the Case", description: "Case study competition for aspiring strategists.", image: "" },
      { time: "11:00 AM", title: "Corporate Deal", description: "Simulate real-world corporate deals and negotiations.", image: "" },
      { time: "2:00 PM", title: "USPL (Uttrakhand Startup Premier League)", description: "Regional startup league — pitch, compete, win.", image: "" },
    ],
    day2: [
      { time: "9:00 AM", title: "GVFP Demo Day", description: "Showcase your product to investors and industry experts.", image: "" },
      { time: "11:00 AM", title: "Partner Unity Fest", description: "Collaboration & engagement with partners.", image: "" },
      { time: "1:00 PM", title: "Bid and Build", description: "Competitive bidding and team-building challenge.", image: "" },
      { time: "3:00 PM", title: "USPL (Uttrakhand Startup Premier League)", description: "Regional startup league continues — Day 2.", image: "" },
    ],
    day3: [
      { time: "9:00 AM", title: "Startup Expo", description: "North India's top-level startup showcase.", image: "" },
      { time: "11:00 AM", title: "Project Exhibition", description: "Exhibit your prototypes and innovative projects.", image: "" },
      { time: "1:00 PM", title: "Main Stage Panel Discussions - Fireside Chat", description: "Industry leaders discuss the future of startups.", image: "" },
      { time: "3:30 PM", title: "Speed Mentoring", description: "Rapid mentoring sessions with industry experts.", image: "" },
    ],
  },
  preEvents: [
    { title: "Club Clash", date: "16 April" },
    { title: "The Reel Showcase", date: "17 April" },
    { title: "Poster Reveal", date: "20 April" },
    { title: "How To Build A Pitch Deck", date: "21 April" },
  ],
  eventImages: {},
  partnerCategories: ["Co-presented by", "Payments Partner", "Government Ecosystem Partner", "Startup Showcase Partner", "Partners"],
  partners: [
    { id: "1", name: "Startup Uttarakhand", category: "Partners", image: "" },
    { id: "2", name: "ADIF", category: "Partners", image: "" },
    { id: "3", name: "Headstart", category: "Partners", image: "" },
    { id: "4", name: "Womennovator", category: "Partners", image: "" },
  ],
};

const STORAGE_KEY = "srijan_site_data";
const SITE_SETTINGS_ID = "srijan_fest";

export function getSiteData(): SiteData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        schedule: { ...DEFAULT_DATA.schedule, ...parsed.schedule },
        partnerCategories: parsed.partnerCategories || DEFAULT_DATA.partnerCategories,
        featuredEvents: parsed.featuredEvents || DEFAULT_DATA.featuredEvents,
      };
    }
  } catch { }
  return DEFAULT_DATA;
}

export async function fetchSiteData(): Promise<SiteData> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("content")
      .eq("id", SITE_SETTINGS_ID)
      .single();

    if (error) {
      return getSiteData(); // Fallback to localStorage on error
    }

    const content = data?.content as any;

    // If Supabase has real data (not just the empty default {}), use it
    if (content && Object.keys(content).length > 0) {
      const mergedData = {
        ...DEFAULT_DATA,
        ...content,
        schedule: content.schedule ? { ...DEFAULT_DATA.schedule, ...content.schedule } : DEFAULT_DATA.schedule,
        partnerCategories: content.partnerCategories || DEFAULT_DATA.partnerCategories,
        featuredEvents: content.featuredEvents || DEFAULT_DATA.featuredEvents,
      };

      // Keep localStorage in sync for offline/fast load
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
      return mergedData;
    }

    // Supabase has empty content — fall back to localStorage
    return getSiteData();
  } catch (err) {
    console.error("Error fetching site data from Supabase:", err);
    return getSiteData();
  }
}

export async function saveSiteDataSupabase(data: SiteData) {
  try {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ id: SITE_SETTINGS_ID, content: data as any });

    if (error) throw error;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Error saving site data to Supabase:", err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    throw err;
  }
}

export function saveSiteData(data: SiteData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getRegistrations(): Array<Record<string, string>> {
  try {
    const stored = localStorage.getItem("srijan_registrations");
    if (stored) return JSON.parse(stored);
  } catch { }
  return [];
}

export function addRegistration(reg: Record<string, string>) {
  const regs = getRegistrations();
  regs.push({ ...reg, id: Date.now().toString(), registeredAt: new Date().toISOString() });
  localStorage.setItem("srijan_registrations", JSON.stringify(regs));
}
