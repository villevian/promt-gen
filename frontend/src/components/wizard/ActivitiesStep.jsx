import React from "react";
import { ACTIVITIES, RECOMMENDATIONS } from "../../lib/wizardData";
import { t } from "../../lib/i18n";

const TOOL_BG = {
    notebooklm: { bg: "var(--pb-during-bg)", text: "var(--pb-during-text)" },
    chatgpt_gemini: { bg: "var(--pb-after-bg)", text: "var(--pb-after-text)" },
    claude: { bg: "var(--pb-before-bg)", text: "var(--pb-before-text)" },
};

export const ActivitiesStep = ({ aspect, bloom, selected, toggle, customActivity, setCustomActivity, lang }) => {
    const recommended = (RECOMMENDATIONS[aspect]?.[bloom]) || [];

    return (
        <div className="pb-step-enter">
            <div className="pb-eyebrow mb-3">{t(lang, "step5_kicker")}</div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "step5_title")}
            </h2>
            <p className="text-[var(--pb-text-secondary)] max-w-2xl mb-6">{t(lang, "step5_sub")}</p>

            <div className="flex flex-wrap items-center gap-3 mb-8 pb-mono text-[11px]">
                <span className="px-2 py-1 border border-[var(--pb-during-border)]" style={{ background: "var(--pb-during-bg)", color: "var(--pb-during-text)" }}>{t(lang, "tool_notebooklm")}</span>
                <span className="px-2 py-1 border border-[var(--pb-after-border)]" style={{ background: "var(--pb-after-bg)", color: "var(--pb-after-text)" }}>{t(lang, "tool_chatgpt_gemini")}</span>
                <span className="px-2 py-1 border border-[var(--pb-before-border)]" style={{ background: "var(--pb-before-bg)", color: "var(--pb-before-text)" }}>{t(lang, "tool_claude")}</span>
                <span className="px-2 py-1 border border-[#059669]" style={{ color: "#059669" }}>★ {t(lang, "recommended")}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="activities-grid">
                {ACTIVITIES.map((a) => {
                    const isSelected = selected.includes(a.id);
                    const isRecommended = recommended.includes(a.id);
                    const palette = TOOL_BG[a.tool];
                    return (
                        <button
                            key={a.id}
                            onClick={() => toggle(a.id)}
                            className={`pb-card relative text-left p-4 cursor-pointer flex items-start gap-3 ${isSelected ? "pb-card-selected" : ""} ${isRecommended ? "pb-recommended" : ""}`}
                            data-testid={`activity-${a.id}`}
                        >
                            <div
                                className="w-9 h-9 flex items-center justify-center pb-mono text-base flex-shrink-0"
                                style={{ background: palette.bg, color: palette.text }}
                            >
                                {a.glyph}
                            </div>
                            <div className="flex-1">
                                <div className="pb-serif text-base text-[var(--pb-text)] leading-tight">
                                    {lang === "uk" ? a.labelUk : a.labelEn}
                                </div>
                                <div className="pb-mono text-[10px] uppercase tracking-wider mt-1" style={{ color: palette.text }}>
                                    {a.tool === "notebooklm" ? "NotebookLM" : a.tool === "chatgpt_gemini" ? "ChatGPT / Gemini" : "Claude"}
                                </div>
                            </div>
                            {isSelected && (
                                <span className="pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text)]">✓</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-10 pt-8 border-t border-[var(--pb-border)]">
                <label className="pb-eyebrow block mb-3">{t(lang, "step5_custom")}</label>
                <textarea
                    value={customActivity}
                    onChange={(e) => setCustomActivity(e.target.value)}
                    rows={2}
                    placeholder={t(lang, "step5_custom_ph")}
                    className="w-full p-3 bg-[var(--pb-card)] border border-[var(--pb-border)] focus:border-[var(--pb-text)] outline-none pb-sans text-sm text-[var(--pb-text)] transition-colors resize-none"
                    data-testid="custom-activity-input"
                />
            </div>
        </div>
    );
};
