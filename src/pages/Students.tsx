import { Link } from "react-router-dom";
import { Search, FileCheck, Key, Smile, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const steps = [
  { icon: Search, step: "01", title: "Search", description: "Browse our verified listings filtered by location, price, and amenities." },
  { icon: FileCheck, step: "02", title: "Apply", description: "Submit your application online with your student ID and supporting documents." },
  { icon: Key, step: "03", title: "Move In", description: "Sign your lease, pay your deposit, and collect your keys. Welcome home!" },
  { icon: Smile, step: "04", title: "Enjoy", description: "Settle in and focus on your studies in a safe, comfortable environment." },
];

const benefits = [
  "All-inclusive bills (water, electricity, WiFi)",
  "Fully furnished rooms with study desks",
  "24/7 security and CCTV monitoring",
  "On-site maintenance support",
  "Proximity to universities",
];

const Students = () => (
  <Layout>
    {/* Hero */}
    <section className="hero-gradient py-20 md:py-28">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-6 text-4xl font-extrabold text-primary-foreground md:text-5xl">
          Student Accommodation Made Easy
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
          We understand the challenges of finding the right place to live while studying. Let us help you find a safe, affordable home near your campus.
        </p>
        <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
          <Link to="/properties">Find Your Home <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </section>

    {/* How it works */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="relative rounded-xl bg-card p-6 card-shadow text-center">
                <span className="mb-2 block text-4xl font-extrabold text-accent-foreground/20">{s.step}</span>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                  <Icon className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="bg-muted py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">What You Get</h2>
          <p className="mb-10 text-muted-foreground">All our properties come with student-friendly amenities.</p>
          <div className="grid gap-4 text-left sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 rounded-lg bg-card p-4 card-shadow">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-4 text-3xl font-bold text-foreground">Ready to Get Started?</h2>
        <p className="mx-auto mb-8 max-w-lg text-muted-foreground">Browse available properties or contact us for personalized assistance.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="hero-gradient text-primary-foreground" asChild>
            <Link to="/properties">View Properties</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);

export default Students;
