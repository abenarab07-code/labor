import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Minus } from "lucide-react";
import { Reveal } from "./motion-primitives";
import { faqs } from "@/content/faqs";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container-editorial max-w-4xl">
        <Reveal className="mb-12">
          <div className="eyebrow mb-4">Questions fréquentes</div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol">
            Les réponses<br />
            <span className="italic text-teal">à vos questions.</span>
          </h2>
        </Reveal>

        <div className="divide-y divide-border">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-6 py-6 md:py-7 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-xl md:text-2xl text-petrol group-hover:text-teal transition-colors">
                    {f.q}
                  </span>
                  <span
                    className={`shrink-0 h-9 w-9 rounded-full border border-border flex items-center justify-center transition-colors ${
                      isOpen ? "bg-petrol text-ivory border-petrol" : "text-petrol"
                    }`}
                  >
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 md:pb-7 pr-16 text-ink/70 leading-relaxed max-w-2xl">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
