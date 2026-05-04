import React from "react";
import { ENERGIES } from "../../lib/wizardData";
import { t } from "../../lib/i18n";

export const EnergyStep = ({ value, onChange, lang }) => {
    return (
        <div className="pb-step-enter">
            <div className="pb-eyebrow mb-3">{t(lang, "step3_kicker")}</div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "step3_title")}
            </h2>
            <p className="text-[var(--pb-text-secondary)] max-w-2xl mb-10">{t(lang, "step3_sub")}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="energy-grid">
                {ENERGIES.map((e) => {
                    const selected = value === e.id;
                    return (
                        <button
                            key={e.id}
                            onClick={() => onChange(e.id)}
                            className={`pb-card text-left p-6 cursor-pointer ${selected ? "pb-card-selected" : ""}`}
                            data-testid={`energy-${e.id}`}
                        >
                            <div className="pb-mono text-2xl text-[var(--pb-text)] mb-4">{e.glyph}</div>
                            <div className="pb-serif text-xl text-[var(--pb-text)]">{t(lang, `energy_${e.id}`)}</div>
                            <div className="text-xs text-[var(--pb-text-muted)] mt-1">{t(lang, `energy_${e.id}_sub`)}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
