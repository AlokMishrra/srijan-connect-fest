import { motion } from "framer-motion";
import { Presentation, Globe, Trophy, Zap, Lightbulb, Briefcase, Rocket, Users } from "lucide-react";
import { useSiteData } from "@/hooks/useSiteData";

const iconMap: Record<string, any> = {
  "ACE the Case": Lightbulb,
  "Corporate Deal": Briefcase,
  "GVFP Demo Day": Presentation,
  "Partner Unity Fest": Users,
  "Bid and Build": Rocket,
  "Startup Expo": Globe,
  "Prototype Expo": Trophy,
  "Speed Mentoring": Zap,
  "Project Exhibition": Trophy,
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotateX: -5 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5 } },
};

const EventsSection = () => {
  const { data: siteData } = useSiteData();
  
  if (!siteData) return null;
  
  const featuredEvents = siteData.featuredEvents || siteData.events.map((name) => ({ name, description: "", day: "" }));

  return (
    <section id="events" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Featured Events</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Don't Miss <span className="text-gradient">These</span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
        >
          {featuredEvents.map((event: any) => {
            const Icon = iconMap[event.name] || Zap;
            return (
              <motion.div
                key={event.name}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                className="bg-background rounded-xl p-5 shadow-card hover:shadow-elevated transition-all group relative overflow-hidden cursor-pointer"
              >
                <motion.div className="absolute inset-0 bg-hero-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
                {event.day && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    {event.day}
                  </div>
                )}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center mb-4"
                >
                  <Icon size={20} className="text-primary-foreground" />
                </motion.div>
                <h3 className="font-heading text-base font-bold text-foreground mb-1.5">{event.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{event.description || "Join this exciting event at SRIJAN 4.0"}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default EventsSection;
