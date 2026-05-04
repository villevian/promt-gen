import React from "react";
import { t } from "../../lib/i18n";

const OPTIONS = [
    { id: "have", glyph: "✓", keyTitle: "material_have_title", keySub: "material_have_sub" },
    { id: "need", glyph: "⌕", keyTitle: "material_need_title", keySub: "material_need_sub" },
];

export const MaterialStep = ({ value, onChange, lang }) => {
    return (
        <div className="pb-step-enter">
            <div className="pb-eyebrow mb-3">{t(lang, "material_kicker")}</div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "material_title")}
            </h2>
            <p className="text-[var(--pb-text-secondary)] max-w-2xl mb-10">{t(lang, "material_sub")}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="material-grid">
                {OPTIONS.map((o) => {
                    const selected = value === o.id;
                    return (
                        <button
                            key={o.id}
                            onClick={() => onChange(o.id)}
                            className={`pb-card text-left p-6 cursor-pointer flex items-start gap-5 ${selected ? "pb-card-selected" : ""}`}
                            data-testid={`material-${o.id}`}
                        >
                            <div className="pb-mono text-2xl text-[var(--pb-text)] mt-1">{o.glyph}</div>
                            <div>
                                <div className="pb-serif text-xl text-[var(--pb-text)] mb-1">{t(lang, o.keyTitle)}</div>
                                <div className="text-[13px] text-[var(--pb-text-secondary)] leading-snug">{t(lang, o.keySub)}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
