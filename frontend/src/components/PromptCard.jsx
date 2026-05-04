import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
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

const Section = ({ kind, label, body, lang, testIdPrefix }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(body.trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // ignore
        }
    };
    return (
        <div className="pl-4" style={{ borderLeft: `4px solid ${SECTION_BORDER[kind]}` }} data-testid={`${testIdPrefix}-${kind}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="pb-eyebrow" style={{ color: SECTION_BORDER[kind] }}>{label}</div>
                <button
                    onClick={handleCopy}
                    className="pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text-muted)] hover:text-[var(--pb-text)] flex items-center gap-1 transition-colors"
                    data-testid={`${testIdPrefix}-copy-${kind}`}
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? t(lang, "copied") : t(lang, "copy")}
                </button>
            </div>
            <div className="pb-prompt-block">{body.trim()}</div>
        </div>
    );
};

export const PromptCard = ({ prompt, lang, index }) => {
    const [activeVariation, setActiveVariation] = useState(0);
    const [returns, setReturns] = useState({ tomorrow: false, day_3: false, day_7: false });
    const [fullCopied, setFullCopied] = useState(false);

    const variation = prompt.variations[activeVariation];
    const tool = TOOL_COLOR[prompt.tool];
    const testIdPrefix = `prompt-${index}`;

    const handleCopyFull = async () => {
        try {
            await navigator.clipboard.writeText(buildFullPrompt(variation));
            setFullCopied(true);
            setTimeout(() => setFullCopied(false), 1500);
        } catch {
            // ignore
        }
    };

    const toggleReturn = (k) => setReturns((s) => ({ ...s, [k]: !s[k] }));

    return (
        <article className="pb-card p-6 md:p-8 flex flex-col gap-7" data-testid={`prompt-card-${index}`}>
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-[var(--pb-border)]">
                <div>
                    <div className="flex items-center gap-2 mb-2">
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

            {/* Footer action */}
            <div className="flex justify-end">
                <button
                    onClick={handleCopyFull}
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
