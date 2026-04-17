import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import defaultHeroBg from "@/assets/hero-bg.jpg";
import { useSiteData } from "@/hooks/useSiteData";

const HeroSection = () => {
  const { data: siteData } = useSiteData();
  if (!siteData) return null;
  
  const heroBg = siteData.heroImage || defaultHeroBg;
  const targetDate = new Date(siteData.countdownDate || "2026-04-22T09:00:00").getTime();

  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="SRIJAN Event" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-widest mb-4"
            >
              3-Day Innovation & Startup Event · Quantum University
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground tracking-tight leading-none mb-6"
            >
              NORTH INDIA'S
              <br />
              PREMIER
              <br />
              <span className="text-accent">STARTUP SUMMIT</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-primary-foreground/80 text-lg max-w-xl mb-8 leading-relaxed"
            >
              Empowering innovators, connecting founders, and showcasing the brightest startups.
              Three days. 5,000+ attendees. Unlimited connections.
            </motion.p>
          </div>

          {/* Right: Stats & Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="bg-primary-foreground/10 backdrop-blur-md rounded-2xl p-8 border border-primary-foreground/20">
              <p className="text-primary-foreground/70 text-sm font-semibold uppercase tracking-wider mb-1">Save the Date</p>
              <h2 className="font-heading text-4xl font-bold text-primary-foreground mb-6">23–25 April 2026</h2>

              <div className="flex items-start gap-2 mb-6">
                <MapPin size={18} className="text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-primary-foreground font-semibold text-sm">Quantum University, Uttarakhand</p>
                  <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-accent text-xs underline">
                    View on Google Maps
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: "5K+", label: "Attendees" },
                  { value: "20+", label: "Speakers" },
                  { value: "20+", label: "Startups" },
                  { value: "3", label: "Days" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-heading text-3xl font-bold text-primary-foreground">{stat.value}</div>
                    <div className="text-sm text-primary-foreground/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="lg:hidden grid grid-cols-2 gap-4 mt-8"
        >
          {[
            { value: "5K+", label: "Attendees" },
            { value: "20+", label: "Speakers" },
            { value: "20+", label: "Startups" },
            { value: "3", label: "Days" },
          ].map((stat) => (
            <div key={stat.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="font-heading text-2xl font-bold text-primary-foreground">{stat.value}</div>
              <div className="text-xs text-primary-foreground/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Countdown + Buttons — Below stats area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10 flex flex-col items-center gap-6"
        >
          {/* Countdown Timer */}
          <div className="flex gap-3 sm:gap-4">
            {([
              { value: timeLeft.days, label: "DAYS" },
              { value: timeLeft.hours, label: "HOURS" },
              { value: timeLeft.minutes, label: "MIN" },
              { value: timeLeft.seconds, label: "SEC" },
            ] as const).map((item) => (
              <div key={item.label} className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-5 py-4 text-center min-w-[75px] sm:min-w-[85px] border border-primary-foreground/20">
                <div className="font-heading text-3xl sm:text-4xl font-bold text-primary-foreground">{String(item.value).padStart(2, "0")}</div>
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-primary-foreground/60 mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-4 items-center">
            <a
              href="#register"
              className="bg-accent text-accent-foreground px-8 sm:px-10 py-3.5 rounded-lg font-bold text-base hover:opacity-90 transition-all hover:scale-105 text-center whitespace-nowrap shadow-lg"
            >
              Register Now
            </a>
            <a
              href="#schedule"
              className="border-2 border-primary-foreground/30 text-primary-foreground px-8 sm:px-10 py-3.5 rounded-lg font-semibold text-base hover:bg-primary-foreground/10 transition-all hover:scale-105 text-center whitespace-nowrap"
            >
              View Agenda
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

function getTimeLeft(target: number) {
  const now = Date.now();
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default HeroSection;
