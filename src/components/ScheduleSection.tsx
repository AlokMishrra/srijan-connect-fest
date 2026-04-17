import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CalendarDays, X, ZoomIn } from "lucide-react";
import { useSiteData } from "@/hooks/useSiteData";
import defaultDemoDay from "@/assets/event-demo-day.jpg";
import defaultExpo from "@/assets/event-startup-expo.jpg";
import defaultNetworking from "@/assets/event-networking.jpg";
import defaultMainStage from "@/assets/event-main-stage.jpg";

const defaultEventImages: Record<string, string> = {
  "GVFP Demo Day": defaultDemoDay,
  "Partner Unity Fest": defaultNetworking,
  "Main Stage Panel Discussions - Fireside Chat": defaultMainStage,
  "Startup Expo": defaultExpo,
  "Prototype Expo": defaultDemoDay,
  "Project Exhibition": defaultDemoDay,
  "ACE the Case": defaultMainStage,
  "Corporate Deal": defaultNetworking,
  "Bid and Build": defaultExpo,
  "Speed Mentoring": defaultNetworking,
  "USPL (Uttrakhand Startup Premier League)": defaultDemoDay,
};

const ScheduleSection = () => {
  const [activeDay, setActiveDay] = useState(0);
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);
  const { data: siteData } = useSiteData();

  if (!siteData) return null;

  const days = [
    { label: "Day 1", date: "23rd April", events: siteData.schedule.day1 },
    { label: "Day 2", date: "24th April", events: siteData.schedule.day2 },
    { label: "Day 3", date: "25th April", events: siteData.schedule.day3 },
  ];

  return (
    <section id="schedule" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Event Schedule</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Three Days of <span className="text-gradient">Innovation</span>
          </h2>
        </motion.div>

        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {days.map((day, i) => (
            <button
              key={day.label}
              onClick={() => setActiveDay(i)}
              className={`px-6 py-3 rounded-lg font-heading font-semibold text-sm transition-all ${
                activeDay === i
                  ? "bg-primary text-primary-foreground shadow-elevated"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {day.label} — {day.date}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {days[activeDay].events.map((event, i) => {
              const eventImage = event.image || defaultEventImages[event.title] || defaultDemoDay;

              return (
                <motion.div
                  key={`${event.title}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all border border-border/50 hover:border-primary/30 group"
                >
                  {/* Image — top with zoom overlay on hover */}
                  <div
                    className="w-full h-80 flex-shrink-0 relative overflow-hidden cursor-zoom-in"
                    onClick={() => setLightbox({ src: eventImage, title: event.title })}
                  >
                    <img
                      src={eventImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Hover hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <ZoomIn size={24} className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content — bottom */}
                  <div className="flex-1 flex flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-bold text-primary">{event.time}</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Clock size={11} />
                          {days[activeDay].label}
                        </span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-foreground mb-1.5">{event.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                      {event.note && <p className="text-xs text-primary font-medium mt-2">📌 {event.note}</p>}
                    </div>
                    <button
                      type="button"
                      className="mt-4 w-full px-4 py-2 rounded-lg text-xs font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90 hover:scale-105"
                      onClick={() => {
                        const formTarget =
                          event.formLink && event.formLink !== "general"
                            ? event.formLink
                            : event.title;
                        window.dispatchEvent(
                          new CustomEvent("prefill-event", {
                            detail: { eventName: event.title, formLink: formTarget },
                          })
                        );
                      }}
                    >
                      Register Now
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {siteData.preEvents && siteData.preEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-16"
          >
            <div className="text-center mb-8">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Pre-Event</span>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mt-2 text-foreground">Warm Up Sessions</h3>
            </div>
            <div className="bg-card rounded-xl shadow-card overflow-hidden border border-border">
              {siteData.preEvents.map((pe, i) => (
                <motion.div
                  key={pe.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center justify-between px-6 py-4 ${
                    i < siteData.preEvents.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-primary" />
                    <span className="font-medium text-foreground">{pe.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{pe.date}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-4xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightbox.src}
                alt={lightbox.title}
                className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
              <p className="text-center text-white/80 text-sm mt-3 font-medium">{lightbox.title}</p>
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ScheduleSection;
