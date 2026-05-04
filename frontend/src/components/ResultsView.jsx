import React from "react";
import { PromptCard } from "./PromptCard";
import { t } from "../lib/i18n";

export const ResultsView = ({ prompts, lang, onReset, onBack }) => {
    return (
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20 pb-step-enter" data-testid="results-view">
            <div className="mb-12">
                <div className="pb-eyebrow mb-3">{t(lang, "results_kicker")}</div>
                <h2 className="pb-serif text-4xl md:text-5xl tracking-tight mb-4 text-[var(--pb-text)]">
                    {t(lang, "results_title")}
                </h2>
                <p className="text-[var(--pb-text-secondary)] max-w-3xl">{t(lang, "results_sub")}</p>
            </div>

            <div className="space-y-6">
                {prompts.map((p, i) => (
                    <PromptCard key={p.id} prompt={p} lang={lang} index={i} />
                ))}
            </div>

            <div className="mt-12 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center pt-8 border-t border-[var(--pb-border)]">
                <button onClick={onBack} className="pb-button-ghost" data-testid="results-back">
                    ← {t(lang, "back")}
                </button>
                <button onClick={onReset} className="pb-button-primary" data-testid="results-start-over">
                    {t(lang, "start_over")} →
                </button>
            </div>
        </div>
    );
};
