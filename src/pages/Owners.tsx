import { Link } from "react-router-dom";
import { TrendingUp, Users, Shield, Headphones, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const benefits = [
  { icon: TrendingUp, title: "Maximize Revenue", description: "Reach thousands of students actively searching for accommodation." },
  { icon: Users, title: "Quality Tenants", description: "We screen all students so you get reliable, responsible tenants." },
  { icon: Shield, title: "Secure Payments", description: "Guaranteed monthly payments to our trust account." },
  { icon: Headphones, title: "Full Support", description: "Our team handles enquiries, viewings, and tenant management." },
];

const steps = [
  "Register your property on our platform",
  "We verify and photograph your property",
  "Your listing goes live to thousands of students",
  "We handle enquiries and tenant screening",
  "You receive guaranteed monthly rental income",
];

const Owners = () => (
  <Layout>
    <section className="hero-gradient py-20 md:py-28">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-6 text-4xl font-extrabold text-primary-foreground md:text-5xl">
          List Your Property With Us
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
          Join the EduStay community of property owners who trust EduStay to manage their student accommodation. Maximize your rental income with zero hassle.
        </p>
        <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
          <Link to="/contact">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">Why Partner With EduStay?</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="rounded-xl bg-card p-6 card-shadow text-center transition-all hover:card-shadow-hover hover:-translate-y-1">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                  <Icon className="h-7 w-7 text-accent-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="bg-muted py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground md:text-4xl">How It Works</h2>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg bg-card p-5 card-shadow">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hero-gradient text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <span className="text-foreground font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="rounded-2xl hero-gradient p-12 md:p-16">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">Start Earning Today</h2>
          <p className="mx-auto mb-8 max-w-lg text-primary-foreground/80">
            List your property with us and start your income growth.
          </p>
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
            <Link to="/contact">List Your Property</Link>
          </Button>
        </div>
      </div>
    </section>
  </Layout>
);

export default Owners;
