import React from "react";
import { t } from "../lib/i18n";

export const ProgressIndicator = ({ step, total, lang }) => {
    return (
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-8 pb-2" data-testid="progress-indicator">
            <div className="flex items-center gap-3 pb-mono text-[11px] text-[var(--pb-text-secondary)] mb-3">
                <span>{t(lang, "step")} {String(step + 1).padStart(2, "0")}</span>
                <span className="text-[var(--pb-text-muted)]">{t(lang, "of")}</span>
                <span>{String(total).padStart(2, "0")}</span>
            </div>
            <div className="flex gap-1.5 h-px">
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 transition-colors duration-300 ${i <= step ? "bg-[var(--pb-text)]" : "bg-[var(--pb-border)]"}`}
                        style={{ height: "1px" }}
                    />
                ))}
            </div>
        </div>
    );
};
