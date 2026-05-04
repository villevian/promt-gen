import React from "react";
import { t } from "../../lib/i18n";

const OPTIONS = [
    { id: "have", glyph: "✓", keyTitle: "material_have_title", keySub: "material_have_sub" },
    { id: "need", glyph: "⌕", keyTitle: "material_need_title", keySub: "material_need_sub" },
];

const MODE_OPTIONS = [
    { id: "generate", glyph: "✎", keyTitle: "material_mode_generate_title", keySub: "material_mode_generate_sub", minLevel: null },
    { id: "search",   glyph: "⌕", keyTitle: "material_mode_search_title",   keySub: "material_mode_search_sub",   minLevel: "B2" },
];

const LEVEL_ORDER = ["A1", "A2", "A2+", "B1", "B1+", "B2", "C1", "C2"];

const meetsLevel = (userLevel, minLevel) => {
    if (!minLevel) return true;
    return LEVEL_ORDER.indexOf(userLevel) >= LEVEL_ORDER.indexOf(minLevel);
};

export const MaterialStep = ({ value, onChange, mode, onChangeMode, level, lang }) => {
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

            {value === "need" && (
                <div className="mt-8 pt-8 border-t border-[var(--pb-border)] pb-step-enter">
                    <div className="pb-eyebrow mb-3">{t(lang, "material_mode_kicker")}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="material-mode-grid">
                        {MODE_OPTIONS.map((m) => {
                            const locked = !meetsLevel(level, m.minLevel);
                            const selected = mode === m.id;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => !locked && onChangeMode(m.id)}
                                    disabled={locked}
                                    className={`pb-card text-left p-5 flex items-start gap-4 ${selected ? "pb-card-selected" : ""} ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    data-testid={`material-mode-${m.id}`}
                                >
                                    <div className="pb-mono text-xl text-[var(--pb-text)] mt-1">{m.glyph}</div>
                                    <div className="flex-1">
                                        <div className="pb-serif text-lg text-[var(--pb-text)] mb-1 flex items-center gap-2">
                                            {t(lang, m.keyTitle)}
                                            {m.minLevel && (
                                                <span className="pb-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-[var(--pb-border-strong)] text-[var(--pb-text-secondary)]">
                                                    {m.minLevel}+
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[12px] text-[var(--pb-text-secondary)] leading-snug">{t(lang, m.keySub)}</div>
                                        {locked && (
                                            <div className="pb-mono text-[10px] uppercase tracking-wider text-[var(--pb-text-muted)] mt-2">
                                                {t(lang, "material_mode_locked")}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
