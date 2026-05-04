import React from "react";
import { LEVELS } from "../../lib/wizardData";
import { t } from "../../lib/i18n";

export const LevelStep = ({ value, onChange, lang }) => {
    return (
        <div className="pb-step-enter">
            <div className="pb-eyebrow mb-3">{t(lang, "step2_kicker")}</div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "step2_title")}
            </h2>
            <p className="text-[var(--pb-text-secondary)] max-w-2xl mb-10">{t(lang, "step2_sub")}</p>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-2" data-testid="level-grid">
                {LEVELS.map((l) => {
                    const selected = value === l.id;
                    return (
                        <button
                            key={l.id}
                            onClick={() => onChange(l.id)}
                            className={`pb-card flex flex-col items-center justify-center py-5 px-2 cursor-pointer ${selected ? "pb-card-selected" : ""}`}
                            data-testid={`level-${l.id}`}
                        >
                            <span className="pb-mono text-lg font-medium text-[var(--pb-text)]">{l.label}</span>
                            <span className="text-[10px] text-[var(--pb-text-muted)] mt-1">
                                {lang === "uk" ? l.descUk : l.descEn}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
