import React from "react";
import { ASPECTS } from "../../lib/wizardData";
import { t } from "../../lib/i18n";

export const AspectStep = ({ value, onChange, lang }) => {
    return (
        <div className="pb-step-enter">
            <div className="pb-eyebrow mb-3">{t(lang, "step0_kicker")}</div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "step0_title")}
            </h2>
            <p className="text-[var(--pb-text-secondary)] max-w-2xl mb-10">{t(lang, "step0_sub")}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="aspect-grid">
                {ASPECTS.map((a) => {
                    const selected = value === a.id;
                    const label = lang === "uk" ? a.labelUk : a.labelEn;
                    const desc = lang === "uk" ? a.descUk : a.descEn;
                    return (
                        <button
                            key={a.id}
                            onClick={() => onChange(a.id)}
                            className={`pb-card pb-has-tooltip relative text-left p-5 min-h-[140px] flex flex-col justify-between cursor-pointer ${selected ? "pb-card-selected" : ""}`}
                            data-testid={`aspect-card-${a.id}`}
                        >
                            <div className="pb-mono text-[15px] text-[var(--pb-text-secondary)] mb-3">
                                {a.emoji}
                            </div>
                            <div>
                                <div className="pb-serif text-lg leading-snug text-[var(--pb-text)]">{label}</div>
                                <div className="text-[12px] text-[var(--pb-text-muted)] mt-1 leading-snug">{desc}</div>
                            </div>
                            {selected && (
                                <span className="absolute top-3 right-3 pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text)]">
                                    ✓
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
