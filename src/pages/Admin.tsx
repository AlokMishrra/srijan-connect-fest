import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSiteData, saveSiteData, fetchSiteData, saveSiteDataSupabase, type SiteData, type Speaker, type ScheduleEvent, type Partner, type FeaturedEvent } from "@/lib/siteData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Trash2, Plus, Save, Image, Users, Calendar, LayoutDashboard, ArrowLeft, Handshake, Clock, ScanLine, Shield, FileText, LogOut, GripVertical, Star, Edit2, UserPlus, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import QRScanner from "@/components/QRScanner";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

type Tab = "dashboard" | "hero" | "speakers" | "schedule" | "events" | "partners" | "registrations" | "scanner" | "roles" | "form-builder";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  form_manager: "Form Manager",
  content_manager: "Content Manager",
  event_manager: "Event Manager",
};

const Admin = () => {
  const queryClient = useQueryClient();
  const { user, loading, hasRole, hasAnyRole, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<SiteData>(getSiteData());
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [formFields, setFormFields] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const siteData = await fetchSiteData();
      setData(siteData);
    }
    loadData();

    if (user && hasAnyRole()) {
      fetchRegistrations();
      fetchFormFields();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    const { data: regs } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
    if (regs) setRegistrations(regs);
  };

  const fetchFormFields = async () => {
    const { data: fields } = await supabase.from("registration_form_fields").select("*").order("sort_order");
    if (fields) setFormFields(fields);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;
  if (!hasAnyRole()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center bg-card rounded-2xl p-10 shadow-elevated max-w-md">
          <Shield size={48} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-6">Your account doesn't have any admin roles assigned. Please contact the Super Admin.</p>
          <button onClick={signOut} className="text-primary text-sm font-medium hover:underline">Sign Out</button>
        </div>
      </div>
    );
  }

  const save = async () => {
    toast.loading("Saving changes...", { id: "save-site-data" });
    try {
      await saveSiteDataSupabase(data);
      // Set the query cache directly so images appear immediately without waiting for refetch
      queryClient.setQueryData(["siteData"], data);
      queryClient.invalidateQueries({ queryKey: ["siteData"] });
      toast.success("Changes saved for everyone!", { id: "save-site-data" });
    } catch (err) {
      toast.error("Failed to save changes to cloud. Saved locally only.", { id: "save-site-data" });
      saveSiteData(data);
      queryClient.setQueryData(["siteData"], data);
    }
  };

  const handleImageUpload = (callback: (url: string) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      toast.loading("Uploading image...", { id: "img-upload" });
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage
          .from("site-assets")
          .upload(fileName, file, { upsert: true, contentType: file.type });

        if (error) throw error;

        const { data: publicData } = supabase.storage
          .from("site-assets")
          .getPublicUrl(data.path);

        toast.success("Image uploaded!", { id: "img-upload" });
        callback(publicData.publicUrl);
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message || "Unknown error"}`, { id: "img-upload" });
        // Fallback to base64 if storage fails
        const reader = new FileReader();
        reader.onload = () => callback(reader.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const updateSpeaker = (index: number, field: keyof Speaker, value: string) => {
    const speakers = [...data.speakers];
    speakers[index] = { ...speakers[index], [field]: value };
    setData({ ...data, speakers });
  };

  const addSpeaker = () => {
    setData({ ...data, speakers: [...data.speakers, { id: Date.now().toString(), name: "", company: "", image: "", linkedin: "" }] });
  };

  const removeSpeaker = (index: number) => {
    setData({ ...data, speakers: data.speakers.filter((_, i) => i !== index) });
  };

  const updateScheduleEvent = (day: "day1" | "day2" | "day3", index: number, field: keyof ScheduleEvent, value: string) => {
    const schedule = { ...data.schedule };
    const events = [...schedule[day]];
    events[index] = { ...events[index], [field]: value } as ScheduleEvent;
    schedule[day] = events;
    setData({ ...data, schedule });
  };

  const addScheduleEvent = (day: "day1" | "day2" | "day3") => {
    const schedule = { ...data.schedule };
    schedule[day] = [...schedule[day], { time: "", title: "", description: "", image: "" }];
    setData({ ...data, schedule });
  };

  const removeScheduleEvent = (day: "day1" | "day2" | "day3", index: number) => {
    const schedule = { ...data.schedule };
    schedule[day] = schedule[day].filter((_, i) => i !== index);
    setData({ ...data, schedule });
  };

  const updatePartner = (index: number, field: keyof Partner, value: string) => {
    const partners = [...data.partners];
    partners[index] = { ...partners[index], [field]: value };
    setData({ ...data, partners });
  };

  const addPartner = () => {
    setData({ ...data, partners: [...data.partners, { id: Date.now().toString(), name: "", category: data.partnerCategories?.[0] || "Partners", image: "" }] });
  };

  const removePartner = (index: number) => {
    setData({ ...data, partners: data.partners.filter((_, i) => i !== index) });
  };

  const isSuperAdmin = hasRole("super_admin");
  const isFormManager = hasRole("form_manager") || isSuperAdmin;
  const isContentManager = hasRole("content_manager") || isSuperAdmin;
  const isEventManager = hasRole("event_manager") || isSuperAdmin;

  const allTabs: { id: Tab; label: string; icon: React.ReactNode; visible: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, visible: true },
    { id: "hero", label: "Hero & Countdown", icon: <Clock size={18} />, visible: isContentManager },
    { id: "speakers", label: "Speakers", icon: <Users size={18} />, visible: isContentManager },
    { id: "schedule", label: "Schedule", icon: <Calendar size={18} />, visible: isContentManager },
    { id: "events", label: "Featured Events", icon: <Star size={18} />, visible: isContentManager },
    { id: "partners", label: "Partners", icon: <Handshake size={18} />, visible: isContentManager },
    { id: "registrations", label: "Registrations", icon: <FileText size={18} />, visible: isFormManager },
    { id: "form-builder", label: "Form Builder", icon: <FileText size={18} />, visible: isSuperAdmin },
    { id: "scanner", label: "QR Scanner", icon: <ScanLine size={18} />, visible: isEventManager },
    { id: "roles", label: "User Roles", icon: <Shield size={18} />, visible: isSuperAdmin },
  ];

  const visibleTabs = allTabs.filter((t) => t.visible);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></Link>
            <div className="bg-white p-1 rounded-md inline-block">
              <img src="/logo.png" alt="SRIJAN 4.0" className="h-8 w-auto object-contain" />
            </div>
            <h1 className="font-heading text-xl font-bold text-foreground">Admin Portal</h1>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium hidden sm:inline">{user.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"><Save size={16} /> Save</button>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-2 transition-colors" title="Sign Out"><LogOut size={18} /></button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-56 flex-shrink-0">
            <div className="flex md:flex-col gap-2 overflow-x-auto">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                    }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === "dashboard" && <DashboardTab data={data} registrations={registrations} />}
                {activeTab === "hero" && isContentManager && <HeroTab data={data} setData={setData} handleImageUpload={handleImageUpload} />}
                {activeTab === "speakers" && isContentManager && <SpeakersTab data={data} updateSpeaker={updateSpeaker} addSpeaker={addSpeaker} removeSpeaker={removeSpeaker} handleImageUpload={handleImageUpload} />}
                {activeTab === "schedule" && isContentManager && <ScheduleTab data={data} updateScheduleEvent={updateScheduleEvent} addScheduleEvent={addScheduleEvent} removeScheduleEvent={removeScheduleEvent} handleImageUpload={handleImageUpload} />}
                {activeTab === "events" && isContentManager && <FeaturedEventsTab data={data} setData={setData} />}
                {activeTab === "partners" && isContentManager && <PartnersTab data={data} setData={setData} updatePartner={updatePartner} addPartner={addPartner} removePartner={removePartner} handleImageUpload={handleImageUpload} />}
                {activeTab === "registrations" && isFormManager && <RegistrationsTab registrations={registrations} onRefresh={fetchRegistrations} />}
                {activeTab === "form-builder" && isSuperAdmin && <FormBuilderTab fields={formFields} onRefresh={fetchFormFields} />}
                {activeTab === "scanner" && isEventManager && (
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h2 className="font-heading text-lg font-bold text-foreground mb-4">QR Code Scanner</h2>
                    <p className="text-sm text-muted-foreground mb-6">Scan attendee QR codes for event check-in.</p>
                    <QRScanner />
                  </div>
                )}
                {activeTab === "roles" && isSuperAdmin && <RolesTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */
const inputClass = "px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const DashboardTab = ({ data, registrations }: { data: SiteData; registrations: any[] }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[
      { label: "Total Registrations", value: registrations.length, color: "text-primary" },
      { label: "Checked In", value: registrations.filter((r) => r.checked_in).length, color: "text-primary" },
      { label: "Speakers", value: data.speakers.length, color: "text-foreground" },
      { label: "Schedule Events", value: data.schedule.day1.length + data.schedule.day2.length + (data.schedule.day3?.length || 0), color: "text-foreground" },
    ].map((s) => (
      <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 shadow-card">
        <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
        <p className={`font-heading text-3xl font-bold ${s.color}`}>{s.value}</p>
      </motion.div>
    ))}
  </div>
);

const HeroTab = ({ data, setData, handleImageUpload }: { data: SiteData; setData: (d: SiteData) => void; handleImageUpload: (cb: (url: string) => void) => void }) => (
  <div className="space-y-6">
    <div className="bg-card rounded-xl p-6 shadow-card">
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">Hero Background Image</h2>
      {data.heroImage && <img src={data.heroImage} alt="Hero" className="w-full max-w-lg rounded-lg mb-4 h-48 object-cover" />}
      <div className="flex gap-2">
        <button onClick={() => handleImageUpload((url) => setData({ ...data, heroImage: url }))} className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80">{data.heroImage ? "Change Image" : "Upload Image"}</button>
        {data.heroImage && <button onClick={() => setData({ ...data, heroImage: "" })} className="text-destructive text-sm font-medium hover:underline">Remove</button>}
      </div>
    </div>
    <div className="bg-card rounded-xl p-6 shadow-card">
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">Countdown Date & Time</h2>
      <input type="datetime-local" value={data.countdownDate || "2026-04-22T09:00"} onChange={(e) => setData({ ...data, countdownDate: e.target.value })} className={inputClass} />
      <p className="text-xs text-muted-foreground mt-2">The countdown timer on the hero section will count down to this date.</p>
    </div>
  </div>
);

const SpeakersTab = ({ data, updateSpeaker, addSpeaker, removeSpeaker, handleImageUpload }: any) => (
  <div className="space-y-4">
    {data.speakers.map((speaker: Speaker, i: number) => (
      <div key={speaker.id} className="bg-card rounded-xl p-5 shadow-card">
        <div className="flex items-start gap-4">
          <div onClick={() => handleImageUpload((url: string) => updateSpeaker(i, "image", url))} className="w-20 h-20 rounded-lg bg-accent flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 flex items-center justify-center">
            {speaker.image ? <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover" /> : <Image size={20} className="text-muted-foreground" />}
          </div>
          <div className="flex-1 grid sm:grid-cols-2 gap-3">
            <input value={speaker.name} onChange={(e) => updateSpeaker(i, "name", e.target.value)} placeholder="Speaker name" className={inputClass} />
            <input value={speaker.company} onChange={(e) => updateSpeaker(i, "company", e.target.value)} placeholder="Company" className={inputClass} />
            <input value={speaker.linkedin} onChange={(e) => updateSpeaker(i, "linkedin", e.target.value)} placeholder="LinkedIn URL" className={`${inputClass} sm:col-span-2`} />
          </div>
          <button onClick={() => removeSpeaker(i)} className="text-destructive hover:opacity-70 p-1"><Trash2 size={18} /></button>
        </div>
      </div>
    ))}
    <button onClick={addSpeaker} className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline"><Plus size={16} /> Add Speaker</button>
  </div>
);

const dayLabels: Record<string, string> = { day1: "Day 1 — 23rd April", day2: "Day 2 — 24th April", day3: "Day 3 — 25th April" };

const SCHEDULE_FORM_OPTIONS = [
  "general",
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
];

const ScheduleTab = ({ data, updateScheduleEvent, addScheduleEvent, removeScheduleEvent, handleImageUpload }: any) => (
  <div className="space-y-8">
    {(["day1", "day2", "day3"] as const).map((day) => (
      <div key={day}>
        <h3 className="font-heading text-lg font-bold text-foreground mb-4">{dayLabels[day]}</h3>
        <div className="space-y-3">
          {(data.schedule[day] || []).map((event: ScheduleEvent, i: number) => (
            <div key={i} className="bg-card rounded-xl p-4 shadow-card">
              <div className="flex items-start gap-4">
                <div onClick={() => handleImageUpload((url: string) => updateScheduleEvent(day, i, "image", url))} className="w-24 h-16 rounded-lg bg-accent flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 flex items-center justify-center">
                  {event.image ? <img src={event.image} alt={event.title} className="w-full h-full object-cover" /> : <Image size={16} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input value={event.time} onChange={(e) => updateScheduleEvent(day, i, "time", e.target.value)} placeholder="Time" className={inputClass} />
                    <input value={event.title} onChange={(e) => updateScheduleEvent(day, i, "title", e.target.value)} placeholder="Title" className={`${inputClass} sm:col-span-2`} />
                  </div>
                  <input value={event.description} onChange={(e) => updateScheduleEvent(day, i, "description", e.target.value)} placeholder="Description" className={`${inputClass} w-full`} />
                  <input value={event.note || ""} onChange={(e) => updateScheduleEvent(day, i, "note", e.target.value)} placeholder="Note (optional)" className={`${inputClass} w-full`} />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">Register Now → Form:</label>
                    <select
                      value={event.formLink || ""}
                      onChange={(e) => updateScheduleEvent(day, i, "formLink", e.target.value)}
                      className={`${inputClass} flex-1`}
                    >
                      <option value="">Auto (match by title)</option>
                      {SCHEDULE_FORM_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt === "general" ? "General (Default)" : opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={() => removeScheduleEvent(day, i)} className="text-destructive hover:opacity-70 p-1"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          <button onClick={() => addScheduleEvent(day)} className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline"><Plus size={16} /> Add Event to {dayLabels[day].split(" — ")[0]}</button>
        </div>
      </div>
    ))}
  </div>
);

/* ─── Featured Events Tab ─── */
const FORM_EVENT_OPTIONS = [
  "general",
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
];

const FeaturedEventsTab = ({ data, setData }: { data: SiteData; setData: (d: SiteData) => void }) => {
  const updateFeaturedEvent = (index: number, field: keyof FeaturedEvent, value: string) => {
    const events = [...(data.featuredEvents || [])];
    events[index] = { ...events[index], [field]: value };
    setData({ ...data, featuredEvents: events });
  };

  const addFeaturedEvent = () => {
    setData({ ...data, featuredEvents: [...(data.featuredEvents || []), { name: "", description: "", day: "", formLink: "general" }] });
  };

  const removeFeaturedEvent = (index: number) => {
    setData({ ...data, featuredEvents: (data.featuredEvents || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold text-foreground mb-2">Featured Events</h2>
        <p className="text-sm text-muted-foreground mb-2">These events are displayed as cards on the homepage. Each has a "Register Now" button.</p>
        <p className="text-xs text-muted-foreground bg-accent/50 px-3 py-2 rounded-lg">💡 <strong>Link to Form</strong>: Select which registration form each event card links to. Use "General (Default)" if no specific form is set up for that event.</p>
      </div>
      {(data.featuredEvents || []).map((event, i) => (
        <div key={i} className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-start gap-4">
            <div className="flex-1 grid sm:grid-cols-3 gap-3">
              <input value={event.name} onChange={(e) => updateFeaturedEvent(i, "name", e.target.value)} placeholder="Event Name" className={`${inputClass} sm:col-span-2`} />
              <input value={event.day} onChange={(e) => updateFeaturedEvent(i, "day", e.target.value)} placeholder="Day (e.g. Day 1)" className={inputClass} />
              <input value={event.description} onChange={(e) => updateFeaturedEvent(i, "description", e.target.value)} placeholder="Short description" className={`${inputClass} sm:col-span-2`} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Link to Form</label>
                <select
                  value={event.formLink || "general"}
                  onChange={(e) => updateFeaturedEvent(i, "formLink", e.target.value)}
                  className={inputClass}
                >
                  {FORM_EVENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt === "general" ? "General (Default)" : opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={() => removeFeaturedEvent(i)} className="text-destructive hover:opacity-70 p-1"><Trash2 size={18} /></button>
          </div>
        </div>
      ))}
      <button onClick={addFeaturedEvent} className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline"><Plus size={16} /> Add Featured Event</button>

      <div className="bg-card rounded-xl p-6 shadow-card mt-6">
        <h3 className="font-heading text-base font-bold text-foreground mb-3">Registration Event List</h3>
        <p className="text-xs text-muted-foreground mb-3">These are the event names shown in the registration form event selector.</p>
        {data.events.map((ev, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input value={ev} onChange={(e) => { const events = [...data.events]; events[i] = e.target.value; setData({ ...data, events }); }} className={`${inputClass} flex-1`} />
            <button onClick={() => setData({ ...data, events: data.events.filter((_, idx) => idx !== i) })} className="text-destructive hover:opacity-70 p-1"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={() => setData({ ...data, events: [...data.events, ""] })} className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline mt-2"><Plus size={14} /> Add Event Name</button>
      </div>
    </div>
  );
};

/* ─── Partners Tab ─── */
const PartnersTab = ({ data, setData, updatePartner, addPartner, removePartner, handleImageUpload }: any) => {
  const [newCategory, setNewCategory] = useState("");

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h3 className="font-heading text-base font-bold text-foreground mb-3">Partner Categories</h3>
        <p className="text-xs text-muted-foreground mb-3">Edit category labels (e.g. "Co-presented by", "Payments Partner").</p>
        {(data.partnerCategories || []).map((cat: string, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              value={cat}
              onChange={(e) => {
                const oldCat = data.partnerCategories[i];
                const cats = [...data.partnerCategories];
                cats[i] = e.target.value;
                const partners = data.partners.map((p: Partner) => p.category === oldCat ? { ...p, category: e.target.value } : p);
                setData({ ...data, partnerCategories: cats, partners });
              }}
              className={`${inputClass} flex-1`}
            />
            <button onClick={() => {
              setData({ ...data, partnerCategories: data.partnerCategories.filter((_: string, idx: number) => idx !== i) });
            }} className="text-destructive hover:opacity-70 p-1"><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" className={`${inputClass} flex-1`} />
          <button onClick={() => { if (newCategory) { setData({ ...data, partnerCategories: [...(data.partnerCategories || []), newCategory] }); setNewCategory(""); } }} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-semibold"><Plus size={14} /></button>
        </div>
      </div>

      <div className="space-y-4">
        {data.partners.map((partner: Partner, i: number) => (
          <div key={partner.id} className="bg-card rounded-xl p-5 shadow-card">
            <div className="flex items-start gap-4">
              <div onClick={() => handleImageUpload((url: string) => updatePartner(i, "image", url))} className="w-24 h-16 rounded-lg bg-accent flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 flex items-center justify-center">
                {partner.image ? <img src={partner.image} alt={partner.name} className="w-full h-full object-cover" /> : <Image size={20} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <input value={partner.name} onChange={(e) => updatePartner(i, "name", e.target.value)} placeholder="Partner name" className={inputClass} />
                <select value={partner.category} onChange={(e) => updatePartner(i, "category", e.target.value)} className={inputClass}>
                  {(data.partnerCategories || []).map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => removePartner(i)} className="text-destructive hover:opacity-70 p-1"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
        <button onClick={addPartner} className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline"><Plus size={16} /> Add Partner</button>
      </div>
    </div>
  );
};

const EVENT_BADGE_COLORS: Record<string, string> = {
  "ACE the Case": "bg-blue-100 text-blue-700",
  "Corporate Deal": "bg-purple-100 text-purple-700",
  "GVFP Demo Day": "bg-orange-100 text-orange-700",
  "Partner Unity Fest": "bg-pink-100 text-pink-700",
  "Bid and Build": "bg-yellow-100 text-yellow-700",
  "Startup Expo": "bg-green-100 text-green-700",
  "Project Exhibition": "bg-teal-100 text-teal-700",
  "Speed Mentoring": "bg-red-100 text-red-700",
  "Main Stage Panel Discussions - Fireside Chat": "bg-indigo-100 text-indigo-700",
  "USPL (Uttrakhand Startup Premier League)": "bg-cyan-100 text-cyan-700",
};

// ── helpers ──────────────────────────────────────────────────────────────────
/** Case-insensitive fuzzy lookup inside custom_fields */
function cfGet(cf: Record<string, string>, ...keywords: string[]): string {
  for (const kw of keywords) {
    const key = Object.keys(cf).find((k) => k.toLowerCase().replace(/[\s_-]/g, "").includes(kw.toLowerCase().replace(/[\s_-]/g, "")));
    if (key && cf[key]) return cf[key];
  }
  return "";
}

/** Resolve the best display value for a core column */
function resolveField(direct: string | null | undefined, cf: Record<string, string>, ...keywords: string[]): string {
  return direct || cfGet(cf, ...keywords) || "—";
}

/** All custom fields that are NOT already mapped to a core column */
function getExtraFields(cf: Record<string, string>, email: string, phone: string, org: string): [string, string][] {
  const coreValues = new Set([email, phone, org].filter((v) => v && v !== "—"));
  return Object.entries(cf).filter(([, v]) => !coreValues.has(v));
}

// ── download helpers ──────────────────────────────────────────────────────────
function downloadCSV(registrations: any[]) {
  const rows = registrations.map((reg) => {
    const cf = (reg.custom_fields as Record<string, string>) || {};
    const email = resolveField(reg.email, cf, "email", "mail", "gmail");
    const phone = resolveField(reg.phone, cf, "phone", "mobile", "whatsapp", "number");
    const org = resolveField(reg.organization, cf, "organization", "college", "company", "institution");
    const extra = getExtraFields(cf, email, phone, org);
    const extraObj: Record<string, string> = {};
    extra.forEach(([k, v]) => { extraObj[k] = v; });
    return {
      Name: reg.name || "—",
      Email: email,
      Event: reg.event || "—",
      Phone: phone,
      Organization: org,
      Status: reg.checked_in ? "Checked In" : "Pending",
      Date: new Date(reg.created_at).toLocaleString("en-IN"),
      "Registration ID": reg.registration_id || "—",
      ...extraObj,
    };
  });
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(registrations: any[], eventFilter: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(`SRIJAN 4.0 — Registrations${eventFilter !== "all" ? ` (${eventFilter})` : ""}`, 14, 15);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}  |  Total: ${registrations.length}`, 14, 22);

  const rows = registrations.map((reg, i) => {
    const cf = (reg.custom_fields as Record<string, string>) || {};
    const email = resolveField(reg.email, cf, "email", "mail", "gmail");
    const phone = resolveField(reg.phone, cf, "phone", "mobile", "whatsapp", "number");
    const org = resolveField(reg.organization, cf, "organization", "college", "company", "institution");
    const extra = getExtraFields(cf, email, phone, org);
    const extraStr = extra.map(([k, v]) => `${k}: ${v}`).join("\n");
    return [
      i + 1,
      reg.name || "—",
      email,
      reg.event || "—",
      phone,
      org,
      extraStr || "—",
      reg.checked_in ? "✓ Checked In" : "Pending",
      new Date(reg.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    ];
  });

  autoTable(doc, {
    startY: 27,
    head: [["#", "Name", "Email", "Event", "Phone", "Org", "Extra Fields", "Status", "Date"]],
    body: rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 250, 245] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 28 },
      2: { cellWidth: 45 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 28 },
      6: { cellWidth: 50 },
      7: { cellWidth: 22 },
      8: { cellWidth: 25 },
    },
  });

  doc.save(`registrations-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── RegistrationsTab ──────────────────────────────────────────────────────────
const RegistrationsTab = ({ registrations, onRefresh }: { registrations: any[]; onRefresh: () => void }) => {
  const [eventFilter, setEventFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleCheckIn = async (id: string) => {
    await supabase.from("registrations").update({ checked_in: true, checked_in_at: new Date().toISOString() }).eq("id", id);
    toast.success("Attendee checked in!");
    onRefresh();
  };

  const uniqueEvents = Array.from(new Set(registrations.map((r) => r.event))).filter(Boolean);
  const filtered = eventFilter === "all" ? registrations : registrations.filter((r) => r.event === eventFilter);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 shadow-card border-l-4 border-primary">
          <p className="text-xs text-muted-foreground mb-1">Total Registrations</p>
          <p className="font-heading text-2xl font-bold text-primary">{registrations.length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card border-l-4 border-green-500">
          <p className="text-xs text-muted-foreground mb-1">Checked In</p>
          <p className="font-heading text-2xl font-bold text-green-600">{registrations.filter((r) => r.checked_in).length}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card border-l-4 border-orange-400">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="font-heading text-2xl font-bold text-orange-500">{registrations.filter((r) => !r.checked_in).length}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
          <h2 className="font-heading text-lg font-bold text-foreground flex-1">
            Registrations ({filtered.length}{eventFilter !== "all" ? ` for "${eventFilter}"` : ""})
          </h2>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Events</option>
            {uniqueEvents.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
          </select>
          <button onClick={onRefresh} className="text-primary text-sm font-medium hover:underline">Refresh</button>
          {/* Download buttons */}
          <button
            onClick={() => downloadCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => downloadPDF(filtered, eventFilter)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Download size={14} /> PDF
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No registrations {eventFilter !== "all" ? `for "${eventFilter}"` : "yet"}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent">
                <tr>
                  {["", "Name", "Email", "Registered Event", "Phone", "Org", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => {
                  const cf = (reg.custom_fields as Record<string, string>) || {};
                  const email = resolveField(reg.email, cf, "email", "mail", "gmail");
                  const phone = resolveField(reg.phone, cf, "phone", "mobile", "whatsapp", "number");
                  const org = resolveField(reg.organization, cf, "organization", "college", "company", "institution");
                  const name = reg.name || cfGet(cf, "name", "fullname") || "—";
                  const extra = getExtraFields(cf, email, phone, org);
                  const isExpanded = expandedRow === reg.id;

                  return (
                    <>
                      <tr
                        key={reg.id}
                        className="border-t border-border hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : reg.id)}
                      >
                        {/* Expand toggle */}
                        <td className="px-3 py-3 text-muted-foreground">
                          {extra.length > 0
                            ? (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
                            : <span className="w-3.5 inline-block" />}
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">{name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate" title={email}>{email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${EVENT_BADGE_COLORS[reg.event] || "bg-primary/10 text-primary"}`}>
                            {reg.event || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{phone}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[120px] truncate" title={org}>{org}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${reg.checked_in ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {reg.checked_in ? "✓ Checked In" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(reg.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {!reg.checked_in && (
                            <button onClick={() => handleCheckIn(reg.id)} className="text-primary text-xs font-semibold hover:underline whitespace-nowrap">
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Expanded extra fields row */}
                      {isExpanded && extra.length > 0 && (
                        <tr key={`${reg.id}-extra`} className="bg-accent/20 border-t border-border">
                          <td colSpan={9} className="px-8 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-1.5">
                              {extra.map(([k, v]) => (
                                <div key={k} className="text-xs">
                                  <span className="font-semibold text-foreground capitalize">{k.replace(/[_-]/g, " ")}:</span>{" "}
                                  <span className="text-muted-foreground">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Form Builder (Super Admin) ─── */
const EVENTS_LIST = [
  "general",
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
];

const FormBuilderTab = ({ fields, onRefresh }: { fields: any[]; onRefresh: () => void }) => {
  const [selectedEvent, setSelectedEvent] = useState("general");
  const [newField, setNewField] = useState({ field_name: "", field_label: "", field_type: "text", is_required: false, options: "" });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const filteredFields = fields.filter((f) => f.event_name === selectedEvent);

  const addField = async () => {
    if (!newField.field_label) {
      toast.error("Field label is required");
      return;
    }
    const maxOrder = filteredFields.reduce((max, f) => Math.max(max, f.sort_order), 0);
    const opts = newField.field_type === "select" && newField.options
      ? JSON.parse(`[${newField.options.split(",").map((o: string) => `"${o.trim()}"`).join(",")}]`)
      : null;

    await supabase.from("registration_form_fields").insert({
      field_name: newField.field_label.toLowerCase().replace(/\s+/g, "_"),
      field_label: newField.field_label,
      field_type: newField.field_type,
      is_required: newField.is_required,
      options: opts,
      sort_order: maxOrder + 1,
      event_name: selectedEvent,
    });
    toast.success("Field added!");
    setNewField({ field_name: "", field_label: "", field_type: "text", is_required: false, options: "" });
    onRefresh();
  };

  const removeField = async (id: string) => {
    await supabase.from("registration_form_fields").delete().eq("id", id);
    toast.success("Field removed");
    onRefresh();
  };

  const startEdit = (field: any) => {
    setEditingField(field.id);
    setEditValues({ field_label: field.field_label, field_type: field.field_type, is_required: field.is_required, options: field.options ? (field.options as string[]).join(", ") : "" });
  };

  const saveEdit = async (id: string) => {
    const opts = editValues.field_type === "select" && editValues.options
      ? JSON.parse(`[${editValues.options.split(",").map((o: string) => `"${o.trim()}"`).join(",")}]`)
      : null;
    await supabase.from("registration_form_fields").update({
      field_label: editValues.field_label,
      field_type: editValues.field_type,
      is_required: editValues.is_required,
      options: opts,
    }).eq("id", id);
    toast.success("Field updated!");
    setEditingField(null);
    onRefresh();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("registration_form_fields").update({ is_active: !current }).eq("id", id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">Registration Form Builder</h2>
        <p className="text-sm text-muted-foreground mb-3">Select an event to manage its registration form. "General" is the fallback form.</p>
        <div className="flex flex-wrap gap-2">
          {EVENTS_LIST.map((ev) => (
            <button key={ev} onClick={() => setSelectedEvent(ev)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedEvent === ev ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"}`}>
              {ev === "general" ? "General (Default)" : ev}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card">
        <h3 className="font-heading text-base font-bold text-foreground mb-4">
          Fields for: <span className="text-primary">{selectedEvent === "general" ? "General (Default)" : selectedEvent}</span>
        </h3>
        <div className="space-y-3">
          {filteredFields.length === 0 && <p className="text-sm text-muted-foreground py-4">No fields yet. Add fields below or this event will use the General form.</p>}
          {filteredFields.map((field) => (
            <div key={field.id} className="p-3 bg-accent/30 rounded-lg">
              {editingField === field.id ? (
                <div className="space-y-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input value={editValues.field_label} onChange={(e) => setEditValues({ ...editValues, field_label: e.target.value })} className={inputClass} placeholder="Field Label" />
                    <select value={editValues.field_type} onChange={(e) => setEditValues({ ...editValues, field_type: e.target.value })} className={inputClass}>
                      {["text", "email", "tel", "textarea", "select", "number", "url"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {editValues.field_type === "select" && (
                    <input value={editValues.options} onChange={(e) => setEditValues({ ...editValues, options: e.target.value })} placeholder="Options (comma separated)" className={`${inputClass} w-full`} />
                  )}
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editValues.is_required} onChange={(e) => setEditValues({ ...editValues, is_required: e.target.checked })} /> Required</label>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(field.id)} className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-semibold">Save</button>
                    <button onClick={() => setEditingField(null)} className="text-muted-foreground text-xs hover:underline">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-foreground text-sm">{field.field_label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({field.field_type})</span>
                    {field.is_required && <span className="text-xs text-destructive ml-1">*required</span>}
                  </div>
                  <button onClick={() => startEdit(field)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={14} /></button>
                  <button onClick={() => toggleActive(field.id, field.is_active)} className={`text-xs font-medium px-2 py-0.5 rounded-full ${field.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {field.is_active ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => removeField(field.id)} className="text-destructive hover:opacity-70"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card">
        <h3 className="font-heading text-base font-bold text-foreground mb-4">Add New Field</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={newField.field_label} onChange={(e) => setNewField({ ...newField, field_label: e.target.value, field_name: e.target.value })} placeholder="Field Label (e.g. Company)" className={inputClass} />
          <select value={newField.field_type} onChange={(e) => setNewField({ ...newField, field_type: e.target.value })} className={inputClass}>
            {["text", "email", "tel", "textarea", "select", "number", "url"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {newField.field_type === "select" && (
            <input value={newField.options} onChange={(e) => setNewField({ ...newField, options: e.target.value })} placeholder="Options (comma separated)" className={`${inputClass} sm:col-span-2`} />
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={newField.is_required} onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })} className="rounded" />
            Required field
          </label>
        </div>
        <button onClick={addField} className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"><Plus size={16} /> Add Field</button>
      </div>
    </div>
  );
};

/* ─── Roles Management (Super Admin) ─── */
const RolesTab = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<string>("form_manager");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data } = await supabase.from("user_roles").select("*");
    if (data) setRoles(data);
  };

  const createUserAndAssignRole = async () => {
    if (!newEmail || !newPassword) {
      toast.error("Email and password are required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);
    try {
      // Sign up the new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: { emailRedirectTo: window.location.origin },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        setCreating(false);
        return;
      }

      if (!signUpData.user) {
        toast.error("Failed to create user");
        setCreating(false);
        return;
      }

      // Assign role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: signUpData.user.id,
        role: newRole as any,
      });

      if (roleError) {
        toast.error(`User created but role assignment failed: ${roleError.message}`);
      } else {
        toast.success(`User created and assigned ${ROLE_LABELS[newRole]} role!`);
      }

      setNewEmail("");
      setNewPassword("");
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
    setCreating(false);
  };

  const removeRole = async (id: string) => {
    await supabase.from("user_roles").delete().eq("id", id);
    toast.success("Role removed");
    fetchRoles();
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">User Roles</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage admin roles. Create new users or assign roles to existing ones.</p>

        {roles.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No roles assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                <div>
                  <span className="text-sm font-mono text-foreground">{r.user_id.slice(0, 8)}...</span>
                  <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{ROLE_LABELS[r.role] || r.role}</span>
                </div>
                <button onClick={() => removeRole(r.id)} className="text-destructive hover:opacity-70"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card">
        <h3 className="font-heading text-base font-bold text-foreground mb-4 flex items-center gap-2"><UserPlus size={18} /> Create User & Assign Role</h3>
        <p className="text-xs text-muted-foreground mb-4">Create a new admin user with email and password, then assign them a role.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email address" className={inputClass} />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password (min 6 chars)" className={inputClass} />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={inputClass}>
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={createUserAndAssignRole}
          disabled={creating}
          className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          <UserPlus size={16} /> {creating ? "Creating..." : "Create User & Assign Role"}
        </button>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card">
        <h3 className="font-heading text-base font-bold text-foreground mb-4">Assign Role to Existing User</h3>
        <p className="text-xs text-muted-foreground mb-3">If a user already signed up, paste their User ID to assign a role.</p>
        <AssignExistingRole onRefresh={fetchRoles} />
      </div>
    </div>
  );
};

const AssignExistingRole = ({ onRefresh }: { onRefresh: () => void }) => {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("form_manager");

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID (UUID)" className={inputClass} />
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
          {Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>
      <button
        onClick={async () => {
          if (!userId) { toast.error("Enter user ID"); return; }
          const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
          if (error) { toast.error(error.message); return; }
          toast.success("Role assigned!");
          setUserId("");
          onRefresh();
        }}
        className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
      >
        <Plus size={16} /> Assign Role
      </button>
    </>
  );
};

export default Admin;
