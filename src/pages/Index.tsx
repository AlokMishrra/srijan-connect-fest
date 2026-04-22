import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SpeakersSection from "@/components/SpeakersSection";
import ScheduleSection from "@/components/ScheduleSection";
import EventsSection from "@/components/EventsSection";
import PartnersSection from "@/components/PartnersSection";
import RegistrationSection from "@/components/RegistrationSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SpeakersSection />
      <ScheduleSection />
      <EventsSection />
      <PartnersSection />
      <RegistrationSection />
      <Footer />
    </div>
  );
};

export default Index;
