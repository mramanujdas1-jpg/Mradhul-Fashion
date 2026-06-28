import React from 'react';
import Link from 'next/link';

export default function InfoPage({ eyebrow, title, description, sections, cta }) {
  return (
    <main className="bg-[#FAF7F2] text-[#1E1617]">
      <section className="px-4 py-14 md:px-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">
            {eyebrow}
          </span>
          <h1 className="font-serif text-3xl font-semibold tracking-wide text-brand-primary md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
            {description}
          </p>
        </div>
      </section>

      <section className="px-4 pb-16 md:px-12 md:pb-24">
        <div className="mx-auto grid max-w-4xl gap-5">
          {sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-2xl border border-brand-gold/15 bg-white p-6 shadow-sm md:p-8"
            >
              <h2 className="font-serif text-xl font-semibold text-brand-primary">
                {section.heading}
              </h2>
              {section.body && (
                <p className="mt-3 text-sm leading-7 text-gray-600">{section.body}</p>
              )}
              {section.items && (
                <ul className="mt-4 grid gap-2 text-sm leading-7 text-gray-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}

          {cta && (
            <div className="rounded-2xl bg-brand-primary p-6 text-brand-cream md:p-8">
              <h2 className="font-serif text-xl font-semibold">{cta.title}</h2>
              <p className="mt-3 text-sm leading-7 text-brand-cream/85">{cta.body}</p>
              {cta.href && (
                <Link
                  href={cta.href}
                  className="mt-5 inline-flex rounded-full bg-brand-gold px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-brand-primaryDark"
                >
                  {cta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
