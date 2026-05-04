import React, { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { t } from "../lib/i18n";

const TOOL_LABEL = {
    notebooklm: "NotebookLM Studio",
    chatgpt_gemini: "ChatGPT / Gemini",
    claude: "Claude AI",
};

const TOOL_COLOR = {
    notebooklm: { bg: "var(--pb-during-bg)", text: "var(--pb-during-text)", border: "var(--pb-during-border)" },
    chatgpt_gemini: { bg: "var(--pb-after-bg)", text: "var(--pb-after-text)", border: "var(--pb-after-border)" },
    claude: { bg: "var(--pb-before-bg)", text: "var(--pb-before-text)", border: "var(--pb-before-border)" },
};

const SECTION_BORDER = {
    before: "var(--pb-before)",
    during: "var(--pb-during)",
    after: "var(--pb-after)",
};

const buildFullPrompt = (variation) => {
    return `--- BEFORE ---\n${variation.before.trim()}\n\n--- DURING ---\n${variation.during.trim()}\n\n--- AFTER ---\n${variation.after.trim()}`;
};

const CopyBtn = ({ onClick, copied, lang, testId }) => (
    <button
        onClick={onClick}
        className="pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text-muted)] hover:text-[var(--pb-text)] flex items-center gap-1 transition-colors"
        data-testid={testId}
    >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? t(lang, "copied") : t(lang, "copy")}
    </button>
);

const useCopier = () => {
    const [copied, setCopied] = useState(false);
    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* ignore */
        }
    };
    return [copied, copy];
};

const Section = ({ kind, label, body, lang, testIdPrefix }) => {
    const [copied, copy] = useCopier();
    return (
        <div className="pl-4" style={{ borderLeft: `4px solid ${SECTION_BORDER[kind]}` }} data-testid={`${testIdPrefix}-${kind}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="pb-eyebrow" style={{ color: SECTION_BORDER[kind] }}>{label}</div>
                <CopyBtn onClick={() => copy(body.trim())} copied={copied} lang={lang} testId={`${testIdPrefix}-copy-${kind}`} />
            </div>
            <div className="pb-prompt-block">{body.trim()}</div>
        </div>
    );
};

const PreparationBlock = ({ prompt, lang, testIdPrefix }) => {
    const [copied, copy] = useCopier();
    return (
        <section
            className="relative pb-glass-strong p-5 md:p-6"
            data-testid={`${testIdPrefix}-preparation`}
        >
            <div className="flex items-center gap-2 mb-2">
                <span className="pb-mono text-[10px] uppercase tracking-widest px-2 py-1 border flex items-center gap-1"
                    style={{ background: "var(--pb-before-bg)", color: "var(--pb-before-text)", borderColor: "var(--pb-before-border)" }}>
                    <Sparkles size={11} /> {t(lang, "prep_badge")}
                </span>
                <span className="pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text-muted)]">
                    ChatGPT · Claude · Gemini
                </span>
            </div>
            <h4 className="pb-serif text-xl text-[var(--pb-text)] mb-1">{t(lang, "prep_title")}</h4>
            <p className="text-[12px] text-[var(--pb-text-secondary)] mb-4">{t(lang, "prep_sub")}</p>
            <div className="flex items-center justify-between mb-2">
                <div className="pb-eyebrow">Prompt</div>
                <CopyBtn onClick={() => copy(prompt.trim())} copied={copied} lang={lang} testId={`${testIdPrefix}-copy-prep`} />
            </div>
            <div className="pb-prompt-block">{prompt.trim()}</div>
        </section>
    );
};

export const PromptCard = ({ prompt, lang, index }) => {
    const [activeVariation, setActiveVariation] = useState(0);
    const [returns, setReturns] = useState({ tomorrow: false, day_3: false, day_7: false });
    const [fullCopied, copyFull] = useCopier();

    const variation = prompt.variations[activeVariation];
    const tool = TOOL_COLOR[prompt.tool];
    const testIdPrefix = `prompt-${index}`;

    const toggleReturn = (k) => setReturns((s) => ({ ...s, [k]: !s[k] }));

    return (
        <article className="pb-glass-strong p-6 md:p-8 flex flex-col gap-7" data-testid={`prompt-card-${index}`}>
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-[var(--pb-border)]">
                <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                            className="pb-mono text-[10px] uppercase tracking-widest px-2 py-1 border"
                            style={{ background: tool.bg, color: tool.text, borderColor: tool.border }}
                            data-testid={`${testIdPrefix}-tool-badge`}
                        >
                            {TOOL_LABEL[prompt.tool]}
                        </span>
                        <span className="pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text-muted)]">
                            {prompt.methodology}
                        </span>
                    </div>
                    <h3 className="pb-serif text-2xl md:text-[1.625rem] tracking-tight text-[var(--pb-text)]">
                        {prompt.activity_label}
                    </h3>
                    <div className="pb-mono text-[11px] text-[var(--pb-text-secondary)] mt-2">
                        ↳ {t(lang, "where_to_paste")}: {prompt.where_to_paste}
                    </div>
                </div>
            </header>

            {/* Optional preparation prompt */}
            {prompt.needs_preparation && prompt.preparation_prompt && (
                <PreparationBlock prompt={prompt.preparation_prompt} lang={lang} testIdPrefix={testIdPrefix} />
            )}

            {prompt.needs_preparation && prompt.preparation_prompt && (
                <div className="pb-eyebrow -mb-3" data-testid={`${testIdPrefix}-main-title`}>
                    {t(lang, "main_title")}
                </div>
            )}

            {/* Variation tabs */}
            <div className="flex gap-1 -mb-3" data-testid={`${testIdPrefix}-variation-tabs`}>
                {prompt.variations.map((v, i) => (
                    <button
                        key={v.label}
                        onClick={() => setActiveVariation(i)}
                        className={`pb-mono text-[11px] uppercase tracking-widest px-3 py-2 border-b-2 transition-colors ${activeVariation === i ? "border-[var(--pb-text)] text-[var(--pb-text)]" : "border-transparent text-[var(--pb-text-muted)] hover:text-[var(--pb-text)]"}`}
                        data-testid={`${testIdPrefix}-variation-${v.label.toLowerCase()}`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {/* Sections */}
            <div className="space-y-6">
                <Section kind="before" label={t(lang, "before")} body={variation.before} lang={lang} testIdPrefix={testIdPrefix} />
                <Section kind="during" label={t(lang, "during")} body={variation.during} lang={lang} testIdPrefix={testIdPrefix} />
                <Section kind="after"  label={t(lang, "after")}  body={variation.after}  lang={lang} testIdPrefix={testIdPrefix} />
            </div>

            {/* Spaced repetition */}
            <div className="pt-6 border-t border-[var(--pb-border)]">
                <div className="pb-eyebrow mb-3">{t(lang, "return_kicker")} — {t(lang, "return_title")}</div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    {[
                        { key: "tomorrow", label: t(lang, "day_tomorrow") },
                        { key: "day_3", label: t(lang, "day_3") },
                        { key: "day_7", label: t(lang, "day_7") },
                    ].map((r) => (
                        <label key={r.key} className="flex items-center gap-2 cursor-pointer pb-sans text-sm text-[var(--pb-text)]" data-testid={`${testIdPrefix}-return-${r.key}`}>
                            <input
                                type="checkbox"
                                checked={returns[r.key]}
                                onChange={() => toggleReturn(r.key)}
                                className="pb-checkbox"
                            />
                            <span className={returns[r.key] ? "line-through text-[var(--pb-text-muted)]" : ""}>{r.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => copyFull(buildFullPrompt(variation))}
                    className="pb-button-primary flex items-center gap-2"
                    data-testid={`${testIdPrefix}-copy-full`}
                >
                    {fullCopied ? <Check size={16} /> : <Copy size={16} />}
                    {fullCopied ? t(lang, "copied") : t(lang, "copy_full")}
                </button>
            </div>
        </article>
    );
};
