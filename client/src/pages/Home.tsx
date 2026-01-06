import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Wrench, Truck, Phone, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body bg-metal-texture">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden border-b border-white/5">
        {/* Abstract Mechanic Background */}
        <div className="absolute inset-0 z-0 opacity-20">
            {/* garage mechanics working on car engine */}
            <img 
                src="https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&q=80" 
                alt="Mechanic Shop Background" 
                className="w-full h-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-block px-3 py-1 mb-6 border border-primary/50 bg-primary/10 text-primary font-bold uppercase tracking-widest text-sm rounded-sm">
              Professional Fleet Maintenance
            </div>
            <h1 className="font-display text-6xl md:text-8xl font-bold uppercase leading-[0.9] mb-6">
              Keep Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                Fleet Moving
              </span>
            </h1>
            <p className="text-muted-foreground text-xl md:text-2xl mb-10 max-w-lg font-light leading-relaxed">
              Premium diagnostics and repair services for heavy-duty trucks. Submit a work order online and track it in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/submit">
                <Button size="lg" className="h-14 px-8 text-lg font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 rounded-sm shadow-lg shadow-primary/20">
                  Start Work Order <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold uppercase tracking-wider border-white/20 hover:bg-white/5 rounded-sm">
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-secondary/30 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We combine expert mechanics with modern technology to minimize your downtime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: "Heavy Duty Experts",
                desc: "Certified specialists for all major truck makes and models."
              },
              {
                icon: Wrench,
                title: "Precision Repair",
                desc: "State-of-the-art diagnostic tools for accurate troubleshooting."
              },
              {
                icon: CheckCircle,
                title: "Fast Turnaround",
                desc: "Streamlined digital workflow to get you back on the road faster."
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="bg-background/50 border border-white/5 p-8 hover:border-primary/50 transition-colors group"
              >
                <div className="bg-secondary p-4 w-fit rounded-sm mb-6 group-hover:bg-primary transition-colors">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-5xl md:text-7xl font-bold text-white uppercase mb-8">
            Ready to Service?
          </h2>
          <Link href="/submit">
            <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-bold uppercase tracking-wider bg-background text-foreground hover:bg-background/90 rounded-none transform hover:-translate-y-1 transition-transform border-2 border-transparent hover:border-white">
              Create Request Now
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-background border-t border-white/10 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="font-display text-2xl font-bold tracking-tight uppercase">
              Heavy<span className="text-primary">Duty</span> Ops
            </span>
          </div>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            © {new Date().getFullYear()} Heavy Duty Operations Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
