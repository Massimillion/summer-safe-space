import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarCheck, Package, Truck, Warehouse, Home } from "lucide-react";

const steps = [
  {
    icon: CalendarCheck,
    title: "1. Sign Up Online",
    desc: "Choose your school, select your package, and pick your dates — all in a few minutes.",
  },
  {
    icon: Package,
    title: "2. We Deliver Empty Boxes",
    desc: "About two weeks before move-out, we drop off empty boxes and packing materials right at your door.",
  },
  {
    icon: Truck,
    title: "3. We Pick Up Your Packed Boxes",
    desc: "Once you've packed, bring your items to the pickup location on your scheduled date. Or upgrade to our Valet Service ($300) and we'll come to your room and move everything out with you!",
  },
  {
    icon: Warehouse,
    title: "4. Safe Storage All Summer",
    desc: "Your belongings are stored in our secure facility all summer long. No worries, no stress.",
  },
  {
    icon: Home,
    title: "5. Fall Delivery",
    desc: "When you're back on campus in the fall, we deliver everything right to your new place.",
  },
];

const HowItWorks = () => {
  return (
    <>
      <section className="bg-gradient-to-b from-accent to-background py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              How It Works
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              From sign-up to fall delivery — we make summer storage effortless.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl space-y-12">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <step.icon className="h-7 w-7" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-2 h-full w-0.5 bg-border" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-display text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild className="text-base">
              <Link to="/book">
                Book Now <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HowItWorks;
