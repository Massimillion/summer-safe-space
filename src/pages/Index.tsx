import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, Warehouse, CalendarCheck, ArrowRight } from "lucide-react";

const steps = [
  { icon: CalendarCheck, title: "Sign Up & Schedule", desc: "Pick your school, dates, and package online in minutes." },
  { icon: Package, title: "We Drop Off Boxes", desc: "Empty boxes delivered right to your dorm or apartment." },
  { icon: Truck, title: "We Pick Up", desc: "Pack your stuff — we come grab it on your chosen date." },
  { icon: Warehouse, title: "Safe Storage All Summer", desc: "Your belongings stay in our secure, climate-aware facility." },
];

const testimonials = [
  { quote: "SquirrelBox made moving out so easy — I literally just packed and they handled everything.", name: "Sarah K.", school: "CU Boulder" },
  { quote: "My parents loved that they could track everything. Super professional service.", name: "Marcus T.", school: "University of Denver" },
  { quote: "Way cheaper than renting a storage unit and I didn't need a car. 10/10.", name: "Jess L.", school: "CU Boulder" },
];

const Index = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent via-background to-background py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              🐿️ Serving CU Boulder & DU
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              College Storage,{" "}
              <span className="text-primary">Simplified</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              We drop off boxes, pick up your packed stuff, store it all summer, and deliver it back in the fall. Zero hassle.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="text-base">
                <Link to="/book">
                  Book Now <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* How It Works Preview */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Four simple steps to stress-free storage
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Card key={i} className="group relative overflow-hidden border-border/60 transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {i + 1}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="link" asChild className="text-primary">
              <Link to="/how-it-works">Learn more about the process <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Schools */}
      <section className="border-y border-border bg-secondary/30 py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            Available at Your School
          </h2>
          <div className="mx-auto mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
            {[
              { name: "CU Boulder", location: "Boulder, CO" },
              { name: "University of Denver", location: "Denver, CO" },
            ].map((school) => (
              <Card key={school.name} className="text-center transition-shadow hover:shadow-md">
                <CardContent className="p-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                    🎓
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">{school.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{school.location}</p>
                  <Button className="mt-4" size="sm" asChild>
                    <Link to="/book">Book Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            What Students Say
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">"{t.quote}"</p>
                  <div className="mt-4">
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.school}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Stash Your Stuff?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
            Sign up in minutes. We handle the rest.
          </p>
          <Button size="lg" variant="secondary" className="mt-6 text-base" asChild>
            <Link to="/book">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default Index;
