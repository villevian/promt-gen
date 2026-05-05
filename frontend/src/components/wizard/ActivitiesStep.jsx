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
    // Sort: recommended first, then the rest in original order
    const sortedActivities = [
        ...ACTIVITIES.filter((a) => recommended.includes(a.id)),
        ...ACTIVITIES.filter((a) => !recommended.includes(a.id)),
    ];

    return (
        <div className="pb-step-enter">
            <div className="pb-eyebrow mb-3">{t(lang, "step5_kicker")}</div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "step5_title")}
            </h2>
            <p className="text-[var(--pb-text-secondary)] max-w-2xl mb-6">{t(lang, "step5_sub")}</p>

            <div className="flex flex-wrap items-center gap-3 mb-8 pb-mono text-[11px]">
                <span className="px-2 py-1 border" style={{ background: "var(--pb-during-bg)", color: "var(--pb-during-text)", borderColor: "var(--pb-during-border)" }}>{t(lang, "tool_notebooklm")}</span>
                <span className="px-2 py-1 border" style={{ background: "var(--pb-after-bg)", color: "var(--pb-after-text)", borderColor: "var(--pb-after-border)" }}>{t(lang, "tool_chatgpt_gemini")}</span>
                <span className="px-2 py-1 border" style={{ background: "var(--pb-before-bg)", color: "var(--pb-before-text)", borderColor: "var(--pb-before-border)" }}>{t(lang, "tool_claude")}</span>
                <span className="px-2 py-1 border border-[#059669]" style={{ color: "#059669" }}>★ {t(lang, "recommended")}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="activities-grid">
                {sortedActivities.map((a) => {
                    const isSelected = selected.includes(a.id);
                    const isRecommended = recommended.includes(a.id);
                    const palette = TOOL_BG[a.tool];
                    const label = lang === "uk" ? a.labelUk : a.labelEn;
                    const what = lang === "uk" ? a.whatUk : a.whatEn;
                    const how = lang === "uk" ? a.howUk : a.howEn;
                    return (
                        <button
                            key={a.id}
                            onClick={() => toggle(a.id)}
                            className={`pb-card relative text-left p-4 cursor-pointer flex items-start gap-3 ${isSelected ? "pb-card-selected" : ""} ${isRecommended ? "pb-recommended" : ""}`}
                            data-testid={`activity-${a.id}`}
                            style={isRecommended ? { borderColor: "#059669", borderWidth: "2px", boxShadow: "0 0 0 4px rgba(5, 150, 105, 0.08)" } : undefined}
                        >
                            {isRecommended && (
                                <span
                                    className="absolute -top-2.5 left-4 pb-mono text-[10px] uppercase tracking-widest px-2 py-0.5 flex items-center gap-1"
                                    style={{ background: "#059669", color: "#FFFFFF", letterSpacing: "0.15em" }}
                                    data-testid={`activity-${a.id}-recommended-badge`}
                                >
                                    ★ {t(lang, "recommended")}
                                </span>
                            )}
                            <div
                                className="w-9 h-9 flex items-center justify-center pb-mono text-base flex-shrink-0"
                                style={{ background: palette.bg, color: palette.text }}
                            >
                                {a.glyph}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="pb-serif text-base text-[var(--pb-text)] leading-tight">
                                        {label}
                                    </div>
                                    <span
                                        className="pb-mono text-[9px] uppercase tracking-wider whitespace-nowrap px-1.5 py-0.5 flex-shrink-0"
                                        style={{ color: palette.text, background: palette.bg }}
                                    >
                                        {a.tool === "notebooklm" ? "NLM" : a.tool === "chatgpt_gemini" ? "GPT" : "Claude"}
                                    </span>
                                </div>
                                <div className="text-[12px] text-[var(--pb-text-secondary)] leading-snug mb-1.5">
                                    <span className="pb-mono text-[10px] uppercase tracking-wider text-[var(--pb-text-muted)] mr-1">What</span>
                                    {what}
                                </div>
                                <div className="text-[12px] text-[var(--pb-text-secondary)] leading-snug">
                                    <span className="pb-mono text-[10px] uppercase tracking-wider text-[var(--pb-text-muted)] mr-1">How</span>
                                    {how}
                                </div>
                            </div>
                            {isSelected && (
                                <span className="absolute top-3 right-3 pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text)]">✓</span>
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
                    className="w-full p-3 bg-white/60 backdrop-blur border border-[var(--pb-border)] focus:border-[var(--pb-text)] outline-none pb-sans text-sm text-[var(--pb-text)] transition-colors resize-none"
                    data-testid="custom-activity-input"
                />
            </div>
        </div>
    );
};
