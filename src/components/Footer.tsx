import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-white p-1 rounded-lg inline-block mb-4">
              <img src="/logo.png" alt="SRIJAN 4.0" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-background/60 text-sm leading-relaxed">
              North India's premier innovation & startup summit. Two days of demos, expos, networking, and recognition.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-heading text-sm font-semibold text-background mb-4 uppercase tracking-wider">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {["About", "Speakers", "Schedule", "Events", "Partners", "Register"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-sm text-background/60 hover:text-background transition-colors hover:translate-x-1 transform inline-block"
                >
                  {link}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-heading text-sm font-semibold text-background mb-4 uppercase tracking-wider">Contact</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:srijan@event.in" className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors">
                <Mail size={14} /> srijan@event.in
              </a>
              <a href="tel:+918974894143" className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors">
                <Phone size={14} /> +91 89748 94143
              </a>
              <span className="flex items-center gap-2 text-sm text-background/60">
                <MapPin size={14} /> Quantum University, Uttarakhand
              </span>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-background/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">© 2026 SRIJAN. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.headstart.in/hsx" target="_blank" rel="noopener noreferrer" className="text-xs text-background/40 hover:text-background/70 transition-colors">
              Powered by Headstart
            </a>
            <a href="https://www.genesis-quic.in/" target="_blank" rel="noopener noreferrer" className="text-xs text-background/40 hover:text-background/70 transition-colors">
              Genesis Incubator
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
