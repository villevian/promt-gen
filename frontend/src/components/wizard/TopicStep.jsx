import React from "react";
import { TOPIC_PLACEHOLDERS } from "../../lib/wizardData";
import { t } from "../../lib/i18n";

const DIAGNOSTIC_OPTIONS = [
    { id: "first_time",      key: "diag_first_time",   glyph: "○○○" },
    { id: "some_gaps",       key: "diag_some_gaps",    glyph: "●○○" },
    { id: "know_not_use",    key: "diag_know_not_use", glyph: "●●○" },
    { id: "specific_problem", key: "diag_specific",    glyph: "▲" },
];

export const TopicStep = ({ aspect, topic, setTopic, contextMode, setContextMode, contextCustom, setContextCustom, prior, setPrior, problem, setProblem, aspectCustom, setAspectCustom, lang }) => {
    const placeholderObj = TOPIC_PLACEHOLDERS[aspect] || TOPIC_PLACEHOLDERS.custom;
    const placeholder = placeholderObj[lang] || placeholderObj.en;

    return (
        <div className="pb-step-enter">
            <div className="pb-eyebrow mb-3">{t(lang, "step1_kicker")}</div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "step1_title")}
            </h2>
            <p className="text-[var(--pb-text-secondary)] max-w-2xl mb-10">{t(lang, "step1_sub")}</p>

            {aspect === "custom" && (
                <div className="mb-8">
                    <label className="pb-eyebrow block mb-2">
                        {lang === "uk" ? "Що саме тренуєш?" : "What exactly are you training?"}
                    </label>
                    <input
                        type="text"
                        value={aspectCustom}
                        onChange={(e) => setAspectCustom(e.target.value)}
                        placeholder={lang === "uk" ? "напр. Вимова TH" : "e.g. TH pronunciation"}
                        className="pb-input-large !text-2xl"
                        data-testid="aspect-custom-input"
                    />
                </div>
            )}

            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={placeholder}
                className="pb-input-large mb-12"
                data-testid="topic-input"
                autoFocus
            />

            {/* Context selector */}
            <div className="mb-12">
                <div className="pb-eyebrow mb-4">{t(lang, "context_kicker")}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="context-grid">
                    <button
                        onClick={() => setContextMode("general")}
                        className={`pb-card text-left p-4 cursor-pointer ${contextMode === "general" ? "pb-card-selected" : ""}`}
                        data-testid="context-general"
                    >
                        <div className="pb-serif text-lg text-[var(--pb-text)] mb-1">{t(lang, "context_general_title")}</div>
                        <div className="text-[12px] text-[var(--pb-text-secondary)] leading-snug">{t(lang, "context_general_sub")}</div>
                    </button>
                    <button
                        onClick={() => setContextMode("custom")}
                        className={`pb-card text-left p-4 cursor-pointer ${contextMode === "custom" ? "pb-card-selected" : ""}`}
                        data-testid="context-custom"
                    >
                        <div className="pb-serif text-lg text-[var(--pb-text)] mb-1">{t(lang, "context_custom_title")}</div>
                        <div className="text-[12px] text-[var(--pb-text-secondary)] leading-snug">{t(lang, "context_custom_sub")}</div>
                    </button>
                </div>

                {contextMode === "custom" && (
                    <div className="mt-4 pb-step-enter">
                        <textarea
                            value={contextCustom}
                            onChange={(e) => setContextCustom(e.target.value)}
                            rows={2}
                            placeholder={t(lang, "context_custom_ph")}
                            className="w-full p-3 bg-white/60 backdrop-blur border border-[var(--pb-border)] focus:border-[var(--pb-text)] outline-none pb-sans text-sm text-[var(--pb-text)] transition-colors resize-none"
                            data-testid="context-custom-input"
                        />
                    </div>
                )}
            </div>

            <div className="pb-eyebrow mb-4">{t(lang, "step1_diagnostic")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="diagnostic-grid">
                {DIAGNOSTIC_OPTIONS.map((opt) => {
                    const selected = prior === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => setPrior(opt.id)}
                            className={`pb-card text-left p-4 flex items-center gap-4 cursor-pointer ${selected ? "pb-card-selected" : ""}`}
                            data-testid={`diagnostic-${opt.id}`}
                        >
                            <span className="pb-mono text-sm text-[var(--pb-text-secondary)] w-12">{opt.glyph}</span>
                            <span className="pb-sans text-sm text-[var(--pb-text)]">{t(lang, opt.key)}</span>
                        </button>
                    );
                })}
            </div>

            {prior === "specific_problem" && (
                <div className="mt-6 pb-step-enter">
                    <label className="pb-eyebrow block mb-2">{t(lang, "step1_problem_label")}</label>
                    <textarea
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        placeholder={t(lang, "step1_problem_ph")}
                        rows={3}
                        className="w-full p-3 bg-white/60 backdrop-blur border border-[var(--pb-border)] focus:border-[var(--pb-text)] outline-none pb-sans text-sm text-[var(--pb-text)] transition-colors resize-none"
                        data-testid="problem-input"
                    />
                </div>
            )}
        </div>
    );
};
