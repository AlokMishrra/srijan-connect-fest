import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";
import { useSiteData } from "@/hooks/useSiteData";
import defaultSpeaker1 from "@/assets/speaker-1.jpg";
import defaultSpeaker2 from "@/assets/speaker-2.jpg";
import defaultSpeaker3 from "@/assets/speaker-3.jpg";
import defaultSpeaker4 from "@/assets/speaker-4.jpg";

const defaultImages = [defaultSpeaker1, defaultSpeaker2, defaultSpeaker3, defaultSpeaker4];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const SpeakersSection = () => {
  const { data: siteData } = useSiteData();
  const speakers = siteData?.speakers || [];

  return (
    <section id="speakers" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground italic">Speakers</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <p className="text-muted-foreground font-medium">Who you'll hear from</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto"
        >
          30+ voices from the Indian startup ecosystem — founders, investors, and builders
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
        >
          {speakers.map((speaker, i) => {
            const img = speaker.image || defaultImages[i % defaultImages.length];
            return (
              <motion.div
                key={speaker.id}
                variants={cardVariants}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="text-center group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[4/5] bg-gradient-to-b from-primary/30 to-primary/60">
                  <motion.img
                    src={img}
                    alt={speaker.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={512}
                    height={640}
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300" />
                </div>

                <motion.a
                  href={speaker.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#0077B5] text-primary-foreground hover:opacity-80 transition-opacity mb-2"
                >
                  <Linkedin size={16} />
                </motion.a>

                <h3 className="font-heading text-base font-bold text-primary">{speaker.name}</h3>
                <p className="text-sm text-muted-foreground">{speaker.company}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default SpeakersSection;
