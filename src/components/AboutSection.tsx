import { motion } from "framer-motion";
import { Lightbulb, Users, Rocket, Award } from "lucide-react";

const features = [
  {
    icon: Lightbulb,
    title: "Innovation Showcase",
    description: "Present groundbreaking projects and ideas to industry leaders and investors.",
  },
  {
    icon: Users,
    title: "Speed Networking",
    description: "Connect with founders, mentors, and collaborators in structured networking sessions.",
  },
  {
    icon: Rocket,
    title: "Startup Expo",
    description: "Top-level North India startup showcase with demo booths and live pitches.",
  },
  {
    icon: Award,
    title: "Project Expo",
    description: "Special recognition for unique and innovative standout projects.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-primary uppercase tracking-wider inline-block"
          >
            About the Event
          </motion.span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Where Ideas Meet <span className="text-gradient">Opportunity</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            SRIJAN is a 3-day innovation summit bringing together startups, investors, incubators, and visionaries
            for collaboration, showcasing, and building the future together.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.2 } }}
              className="bg-background rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow group cursor-pointer"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                <feature.icon size={22} className="text-primary group-hover:text-primary-foreground transition-colors" />
              </motion.div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
