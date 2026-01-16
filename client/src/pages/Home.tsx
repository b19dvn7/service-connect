import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

// Import logos
import volvoLogo from "@/assets/logos/volvo-logo.png";
import cumminsLogo from "@/assets/logos/cummins-logo.png";
import detroitEmblem from "@/assets/logos/detroit-emblem.png";
import volvoOutline from "@/assets/logos/volvo-outline.png";
import allisonLogo from "@/assets/logos/allison-logo.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Collage Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={volvoOutline}
          alt=""
          className="absolute bottom-0 right-0 w-[70%] h-[70%] translate-x-[8%] translate-y-[12%] rotate-2 opacity-[0.2] brightness-200"
        />
        <img
          src={detroitEmblem}
          alt=""
          className="absolute top-16 left-10 w-[46%] h-[46%] rotate-[-6deg] opacity-[0.32] brightness-110"
        />
        <img
          src={cumminsLogo}
          alt=""
          className="absolute bottom-40 left-24 w-[28%] h-[28%] rotate-[10deg] opacity-[0.18] brightness-150"
        />
        <img
          src={allisonLogo}
          alt=""
          className="absolute top-32 right-6 w-[40%] h-[40%] rotate-[8deg] opacity-[0.24] brightness-130"
        />
      </div>

      <main className="flex-1 flex items-start justify-center px-4 pt-6 pb-10 relative z-10">
        <div className="w-full max-w-2xl space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-10 mb-10"
          >
            {/* Primary Detroit Logo - Emblem (The Biggest) */}
            <div className="w-full flex justify-center">
              <img 
                src={detroitEmblem} 
                alt="Detroit Diesel Emblem" 
                className="h-64 md:h-96 w-auto object-contain brightness-200 transition-all hover:scale-105 duration-500" 
              />
            </div>

            {/* Secondary Logos */}
            <div className="flex items-center justify-center gap-12 opacity-80">
              <img src={cumminsLogo} alt="Cummins" className="h-16 md:h-20 object-contain brightness-200" />
              <img src={volvoLogo} alt="Volvo" className="h-16 md:h-20 object-contain brightness-200" />
            </div>
          </motion.div>

          <div className="mt-10 translate-y-6 grid gap-3 text-center">
            <h1 className="text-xs md:text-sm font-semibold uppercase tracking-[0.32em]">
              Maintenance / Service
            </h1>
            <Link href="/submit" className="flex justify-center">
              <Button size="lg" className="h-11 px-8 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center">
                Submit Request
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
