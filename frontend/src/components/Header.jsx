import React from "react";
import { t } from "../lib/i18n";

export const Header = ({ lang, setLang, onReset }) => {
    return (
        <header className="border-b border-[var(--pb-border)] bg-[var(--pb-bg)]" data-testid="app-header">
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-5 flex items-baseline justify-between gap-6">
                <button
                    onClick={onReset}
                    className="text-left group"
                    data-testid="brand-reset"
                >
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <h1 className="pb-serif text-2xl md:text-[1.75rem] tracking-tight leading-none text-[var(--pb-text)]">
                            {t(lang, "brand")}
                        </h1>
                        <span className="pb-mono text-[10px] uppercase tracking-[0.18em] text-[var(--pb-text-muted)] group-hover:text-[var(--pb-text)] transition-colors">
                            v1 · 2026
                        </span>
                    </div>
                    <div className="pb-mono text-[11px] text-[var(--pb-text-secondary)] mt-1">
                        {t(lang, "byline")}
                    </div>
                </button>

                <div className="flex items-center gap-1 pb-mono text-xs" data-testid="lang-toggle">
                    <button
                        onClick={() => setLang("en")}
                        className={`px-2 py-1 transition-colors ${lang === "en" ? "text-[var(--pb-text)] underline underline-offset-4" : "text-[var(--pb-text-muted)] hover:text-[var(--pb-text)]"}`}
                        data-testid="lang-en"
                    >
                        EN
                    </button>
                    <span className="text-[var(--pb-text-muted)]">/</span>
                    <button
                        onClick={() => setLang("uk")}
                        className={`px-2 py-1 transition-colors ${lang === "uk" ? "text-[var(--pb-text)] underline underline-offset-4" : "text-[var(--pb-text-muted)] hover:text-[var(--pb-text)]"}`}
                        data-testid="lang-uk"
                    >
                        UK
                    </button>
                </div>
            </div>
        </header>
    );
};
