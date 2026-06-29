import { Link } from "react-router-dom";
import { Search, Shield, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import heroImage from "@/assets/hero-image.jpg";

const features = [
  { icon: Search, title: "Easy Search", description: "Find your ideal student home with powerful search and filters." },
  { icon: Shield, title: "Verified Listings", description: "Every property is verified for quality and safety standards." },
  { icon: Clock, title: "Quick Booking", description: "Book your accommodation in minutes with our streamlined process." },
];

const Index = () => (
  <Layout>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Student accommodation" className="h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>
      <div className="relative container mx-auto px-4 py-24 md:py-36">
        <div className="max-w-2xl">
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
            Find Your Perfect <span className="text-secondary">Student Home</span>
          </h1>
          <p className="mb-8 text-lg text-primary-foreground/80 md:text-xl">
            Discover quality, verified student accommodation near your university. Safe, affordable, and hassle-free.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="hero-gradient text-primary-foreground hover:opacity-90" asChild>
              <Link to="/properties">Browse Properties <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/owners">List Your Property</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>


    {/* Features */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Why Choose EduStay?</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            We make finding student accommodation easy, safe, and stress-free.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl bg-card p-6 card-shadow transition-all hover:card-shadow-hover hover:-translate-y-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <Icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>


    {/* CTA */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl hero-gradient p-12 text-center md:p-16">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">Ready to Find Your Home?</h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Join the EduStay community of students who found their perfect accommodation through EduStay.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <Link to="/properties">Browse Properties</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default Index;
