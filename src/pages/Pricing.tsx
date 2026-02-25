import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Pkg = Tables<"packages">;
type AddOn = Tables<"add_ons">;

const defaultFeatures = (pkg: Pkg) => [
  pkg.description || `${pkg.num_boxes} large boxes`,
  "Free box delivery & pickup",
  "Secure summer storage",
  "Fall delivery included",
];

const Pricing = () => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [p, a] = await Promise.all([
        supabase.from("packages").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("add_ons").select("*").eq("is_active", true).order("sort_order"),
      ]);
      if (p.data) setPackages(p.data);
      if (a.data) setAddOns(a.data);
    };
    fetch();
  }, []);

  // Mark the 2nd package as popular
  const popularIndex = 1;

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
            {packages.map((pkg, i) => {
              const isPopular = i === popularIndex;
              const price = pkg.price_cents / 100;
              return (
                <Card
                  key={pkg.id}
                  className={`relative transition-shadow hover:shadow-lg ${
                    isPopular ? "border-primary shadow-md" : "border-border/60"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="font-display text-xl">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                    <div className="mt-4">
                      <span className="font-display text-4xl font-bold text-foreground">${price.toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground"> / summer</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {defaultFeatures(pkg).map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button className="mt-6 w-full" variant={isPopular ? "default" : "outline"} asChild>
                      <Link to="/book">Select Plan</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Valet Service */}
      <section className="border-t border-border py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent">
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">🚚 Valet Service</CardTitle>
                <CardDescription className="text-base">
                  Don't want to carry everything yourself? We've got you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  Our team comes to your dorm room (accompanied by you) and moves everything out for you.
                  No heavy lifting required.
                </p>
                <div>
                  <span className="font-display text-4xl font-bold text-primary">$300</span>
                  <span className="text-sm text-muted-foreground"> add-on</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Without valet, you simply bring your packed items to the designated pickup location.
                </p>
                <Button size="lg" asChild>
                  <Link to="/book">
                    Book with Valet <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
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
            {addOns.filter(a => !a.name.toLowerCase().includes("valet")).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-3"
              >
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="font-display font-semibold text-primary">+${(item.price_cents / 100).toFixed(0)}</span>
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
