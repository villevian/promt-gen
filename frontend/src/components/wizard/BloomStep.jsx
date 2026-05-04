import React from "react";
import { BLOOM_STAGES, BLOOM_LABELS } from "../../lib/wizardData";
import { t } from "../../lib/i18n";

export const BloomStep = ({ aspect, value, onChange, lang }) => {
    const labelMap = BLOOM_LABELS[aspect] || BLOOM_LABELS.custom;

    return (
        <div className="pb-step-enter">
            <div className="pb-eyebrow mb-3">{t(lang, "step4_kicker")}</div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "step4_title")}
            </h2>
            <p className="text-[var(--pb-text-secondary)] max-w-2xl mb-10">{t(lang, "step4_sub")}</p>

            <div className="space-y-2" data-testid="bloom-list">
                {BLOOM_STAGES.map((stage, idx) => {
                    const selected = value === stage;
                    const label = labelMap[stage]?.[lang] || labelMap[stage]?.en || stage;
                    return (
                        <button
                            key={stage}
                            onClick={() => onChange(stage)}
                            className={`pb-card w-full text-left p-4 md:p-5 flex items-center gap-5 cursor-pointer ${selected ? "pb-card-selected" : ""}`}
                            data-testid={`bloom-${stage}`}
                        >
                            <span className="pb-mono text-xs text-[var(--pb-text-muted)] w-8 flex-shrink-0">
                                {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="pb-serif text-lg md:text-xl text-[var(--pb-text)] leading-snug flex-1">
                                {label}
                            </span>
                            <span className="pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text-muted)] hidden md:inline">
                                {stage.replace("_", " ")}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
