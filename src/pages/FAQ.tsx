import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    q: "How does SquirrelBox work?",
    a: "We deliver empty boxes to your dorm or apartment about two weeks before move-out. You pack them up, and we come pick everything up on your scheduled date. We store your belongings all summer and deliver them back when you return in the fall.",
  },
  {
    q: "Which schools do you serve?",
    a: "We currently serve students at CU Boulder and the University of Denver (DU). Select your school during the booking process.",
  },
  {
    q: "How much does it cost?",
    a: "Pricing depends on how many boxes you need. We offer packages starting at $275 for 2 boxes, with options up to 8+ boxes. Special items like bikes and mini fridges have flat add-on fees. Check our Pricing page for current rates.",
  },
  {
    q: "When do I get my boxes?",
    a: "We drop off empty boxes about two weeks before your move-out date. You'll choose your preferred drop-off date from available slots during the booking process.",
  },
  {
    q: "Can I store special items like a bike or mini fridge?",
    a: "Yes! We offer fixed-price add-ons for special items including bicycles, mini fridges, futons, TVs, and more. You can add these during booking.",
  },
  {
    q: "Is my stuff insured?",
    a: "Your belongings are stored in a secure facility. We take great care of everything, but we recommend checking with your renter's or parent's homeowner's insurance for additional coverage.",
  },
  {
    q: "What if I live off-campus?",
    a: "No problem! We serve both on-campus dorms and off-campus apartments. Just enter your address during booking and we'll come to you.",
  },
  {
    q: "Can my parents see my order?",
    a: "Yes — we collect parent/guardian contact info during booking so they can stay informed about your storage status and billing.",
  },
  {
    q: "How do I cancel or change my order?",
    a: "Contact us directly and we'll help you modify or cancel your order. Our team is happy to work with you.",
  },
];

const FAQ = () => {
  return (
    <>
      <section className="bg-gradient-to-b from-accent to-background py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about SquirrelBox storage.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="rounded-lg border border-border bg-card px-5">
                  <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground">Still have questions?</p>
              <Button className="mt-3" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
