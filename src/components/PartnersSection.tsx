import { motion } from "framer-motion";
import { useSiteData } from "@/hooks/useSiteData";
import { Building2 } from "lucide-react";

const PartnersSection = () => {
  const { data: siteData } = useSiteData();
  
  if (!siteData) return null;
  
  const partners = siteData.partners || [];

  const grouped = partners.reduce<Record<string, typeof partners>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const categoryOrder = siteData.partnerCategories || [
    "Co-presented by",
    "Payments Partner",
    "Government Ecosystem Partner",
    "Startup Showcase Partner",
    "Partners",
  ];

  const sortedCategories = categoryOrder.filter((cat) => grouped[cat]?.length > 0);

  if (partners.length === 0) return null;

  return (
    <section id="partners" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Our Partners</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3">
            Backed by <span className="text-gradient">Leaders</span>
          </h2>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-14">
          {sortedCategories.map((category, catIdx) => {
            const catPartners = grouped[category];
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIdx * 0.1 }}
                className="flex flex-col items-center"
              >
                {/* Category label */}
                <div className="flex items-center gap-3 mb-8 w-full max-w-2xl">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap px-2">
                    {category}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Partner logos — centered, uniform grid */}
                <div className="flex flex-wrap justify-center items-center gap-5">
                  {catPartners.map((partner, i) => (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: catIdx * 0.1 + i * 0.06 }}
                      whileHover={{ scale: 1.06, y: -3 }}
                      className="bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-elevated transition-all flex items-center justify-center"
                      style={{ width: 160, height: 90 }}
                    >
                      {partner.image ? (
                        <img
                          src={partner.image}
                          alt={partner.name}
                          className="max-h-[82px] max-w-[155px] object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground px-3">
                          <Building2 size={20} />
                          <span className="text-xs font-semibold text-center leading-tight">{partner.name}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
