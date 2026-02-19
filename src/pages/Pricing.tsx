import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";

// Placeholder packages — will be replaced with admin-configured data from DB
const packages = [
  {
    name: "Small",
    boxes: 2,
    price: 275,
    description: "Perfect for a light packer",
    features: ["2 large boxes", "Free box delivery & pickup", "Secure summer storage", "Fall delivery included"],
  },
  {
    name: "Medium",
    boxes: 4,
    price: 375,
    popular: true,
    description: "Our most popular option",
    features: ["4 large boxes", "Free box delivery & pickup", "Secure summer storage", "Fall delivery included"],
  },
  {
    name: "Large",
    boxes: 6,
    price: 475,
    description: "For the well-prepared student",
    features: ["6 large boxes", "Free box delivery & pickup", "Secure summer storage", "Fall delivery included"],
  },
  {
    name: "XL",
    boxes: 8,
    price: 575,
    description: "Maximum storage capacity",
    features: ["8 large boxes", "Free box delivery & pickup", "Secure summer storage", "Fall delivery included"],
  },
];

const addOns = [
  { name: "Bicycle", price: 50 },
  { name: "Mini Fridge", price: 40 },
  { name: "Futon / Small Couch", price: 60 },
  { name: "TV / Monitor", price: 35 },
  { name: "Extra Box", price: 30 },
];

const Pricing = () => {
  return (
    <>
      <section className="bg-gradient-to-b from-accent to-background py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Pick a package or customize your own. Add special items as needed.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.name}
                className={`relative transition-shadow hover:shadow-lg ${
                  pkg.popular ? "border-primary shadow-md" : "border-border/60"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="font-display text-xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                  <div className="mt-4">
                    <span className="font-display text-4xl font-bold text-foreground">${pkg.price}</span>
                    <span className="text-sm text-muted-foreground"> / summer</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" variant={pkg.popular ? "default" : "outline"} asChild>
                    <Link to="/book">Select Plan</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">
            Special Item Add-Ons
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-muted-foreground">
            Have something that doesn't fit in a box? We store those too.
          </p>
          <div className="mx-auto mt-10 grid max-w-2xl gap-3">
            {addOns.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-3"
              >
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="font-display font-semibold text-primary">+${item.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button size="lg" asChild>
              <Link to="/book">
                Build Your Package <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;
