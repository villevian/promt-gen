import React from "react";
import { Printer } from "lucide-react";
import { PromptCard } from "./PromptCard";
import { t } from "../lib/i18n";

export const ResultsView = ({ prompts, lang, onReset, onBack, progress }) => {
    const hasProgress = progress && progress.total > 0 && progress.current <= progress.total;
    const isGenerating = hasProgress && progress.current > 0 && prompts.length < progress.total;

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20 pb-step-enter" data-testid="results-view">
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="flex-1">
                    <div className="pb-eyebrow mb-3">{t(lang, "results_kicker")}</div>
                    <h2 className="pb-serif text-4xl md:text-5xl tracking-tight mb-4 text-[var(--pb-text)]">
                        {t(lang, "results_title")}
                    </h2>
                    <p className="text-[var(--pb-text-secondary)] max-w-3xl">{t(lang, "results_sub")}</p>
                </div>
                <div className="flex gap-2 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="pb-button-ghost flex items-center gap-2"
                        data-testid="results-print"
                    >
                        <Printer size={14} /> {t(lang, "export_pdf")}
                    </button>
                </div>
            </div>

            {isGenerating && (
                <div className="pb-glass p-5 mb-6 flex items-center gap-4 print:hidden" data-testid="results-progress">
                    <div className="w-4 h-4 rounded-full bg-[var(--pb-accent)] animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                        <div className="pb-mono text-xs uppercase tracking-[0.18em] text-[var(--pb-text-secondary)]">
                            {t(lang, "generating")} {progress.current} / {progress.total}
                        </div>
                        <div className="pb-sans text-sm text-[var(--pb-text)] mt-1">
                            {t(lang, "generating_sub")} <span className="pb-mono">{progress.currentLabel}</span>
                        </div>
                    </div>
                    <div className="hidden md:block flex-1 max-w-xs h-px bg-[var(--pb-border)] relative overflow-hidden">
                        <div
                            className="absolute left-0 top-0 h-full bg-[var(--pb-text)] transition-all duration-500"
                            style={{ width: `${(prompts.length / progress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {prompts.map((p, i) => (
                    <PromptCard key={p.id} prompt={p} lang={lang} index={i} />
                ))}
            </div>

            <div className="mt-12 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center pt-8 border-t border-[var(--pb-border)] print:hidden">
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
