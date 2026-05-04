import React, { useState } from "react";
import { Copy, Check, Sparkles, Share2, ListOrdered } from "lucide-react";
import { t } from "../lib/i18n";
import { PASTE_STEPS } from "../lib/wizardData";

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

const buildFullPrompt = (variation, prep, roleContext) => {
    const parts = [];
    if (prep) parts.push(`=== STEP 1 — PREPARATION PROMPT (paste into ChatGPT/Claude/Gemini) ===\n${prep.trim()}\n`);
    parts.push(`=== STEP 2 — LEARNING PROMPT ===`);
    if (roleContext) parts.push(`--- ROLE & CONTEXT (for the AI) ---\n${roleContext.trim()}`);
    parts.push(`--- BEFORE ---\n${variation.before.trim()}`);
    parts.push(`--- DURING ---\n${variation.during.trim()}`);
    parts.push(`--- AFTER ---\n${variation.after.trim()}`);
    return parts.join("\n\n");
};

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
            <div className="flex items-center gap-2 mb-2 flex-wrap">
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

const HowToUseBlock = ({ activityId, lang, testIdPrefix }) => {
    const steps = PASTE_STEPS[activityId]?.[lang] || PASTE_STEPS[activityId]?.en;
    if (!steps) return null;
    return (
        <section className="pb-glass p-5 md:p-6" data-testid={`${testIdPrefix}-howto`}>
            <div className="flex items-center gap-2 mb-3">
                <ListOrdered size={14} className="text-[var(--pb-text-secondary)]" />
                <div className="pb-eyebrow">{t(lang, "how_to_use_kicker")}</div>
            </div>
            <ol className="space-y-2 pb-sans text-sm text-[var(--pb-text)]">
                {steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                        <span className="pb-mono text-[11px] text-[var(--pb-text-muted)] w-6 flex-shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                        <span className="leading-relaxed">{s}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
};

const RoleContextBlock = ({ text, lang, testIdPrefix }) => {
    const [copied, copy] = useCopier();
    return (
        <section className="pb-glass p-5 md:p-6 relative" data-testid={`${testIdPrefix}-role-context`}
            style={{ borderLeft: "4px solid var(--pb-accent)" }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="pb-mono text-[10px] uppercase tracking-widest px-2 py-1 border"
                        style={{ background: "rgba(55, 112, 112, 0.12)", color: "var(--pb-accent)", borderColor: "var(--pb-accent)" }}>
                        {t(lang, "role_badge")}
                    </span>
                    <span className="pb-mono text-[10px] uppercase tracking-widest text-[var(--pb-text-muted)]">
                        {t(lang, "role_sub")}
                    </span>
                </div>
                <CopyBtn onClick={() => copy(text.trim())} copied={copied} lang={lang} testId={`${testIdPrefix}-copy-role`} />
            </div>
            <div className="pb-prompt-block" style={{ background: "rgba(55, 112, 112, 0.05)" }}>{text.trim()}</div>
        </section>
    );
};

export const PromptCard = ({ prompt, lang, index }) => {
    const [activeVariation, setActiveVariation] = useState(0);
    const [fullCopied, copyFull] = useCopier();
    const [shareCopied, copyShare] = useCopier();

    const variation = prompt.variations[activeVariation];
    const tool = TOOL_COLOR[prompt.tool];
    const testIdPrefix = `prompt-${index}`;

    const handleShare = async () => {
        const text = `AI Prompt Bank — ${prompt.activity_label}\n\n${buildFullPrompt(variation, prompt.preparation_prompt, prompt.role_context)}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: `AI Prompt Bank — ${prompt.activity_label}`, text });
                return;
            } catch { /* fall back */ }
        }
        copyShare(text);
    };

    return (
        <article className="pb-glass-strong p-6 md:p-8 flex flex-col gap-7 print:break-inside-avoid" data-testid={`prompt-card-${index}`}>
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
                        {prompt.vocab_activity_name && (
                            <span
                                className="pb-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-[var(--pb-text)] text-[var(--pb-text)]"
                                data-testid={`${testIdPrefix}-vocab-activity`}
                            >
                                {prompt.vocab_activity_name}
                            </span>
                        )}
                    </div>
                    <h3 className="pb-serif text-2xl md:text-[1.625rem] tracking-tight text-[var(--pb-text)]">
                        {prompt.activity_label}
                    </h3>
                </div>
                <div className="flex gap-2 items-start print:hidden">
                    <button
                        onClick={handleShare}
                        className="pb-button-ghost flex items-center gap-2 !py-2 !px-3 text-xs"
                        data-testid={`${testIdPrefix}-share`}
                    >
                        {shareCopied ? <Check size={14} /> : <Share2 size={14} />}
                        {shareCopied ? t(lang, "link_copied") : t(lang, "share_link")}
                    </button>
                </div>
            </header>

            {/* How to use — step by step */}
            <HowToUseBlock activityId={prompt.activity_id} lang={lang} testIdPrefix={testIdPrefix} />

            {/* Optional preparation prompt */}
            {prompt.needs_preparation && prompt.preparation_prompt && (
                <>
                    <PreparationBlock prompt={prompt.preparation_prompt} lang={lang} testIdPrefix={testIdPrefix} />
                    <div className="pb-eyebrow -mb-3" data-testid={`${testIdPrefix}-main-title`}>
                        {t(lang, "main_title")}
                    </div>
                </>
            )}

            {/* Role & context for the AI */}
            {prompt.role_context && (
                <RoleContextBlock text={prompt.role_context} lang={lang} testIdPrefix={testIdPrefix} />
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

            <div className="flex justify-end print:hidden">
                <button
                    onClick={() => copyFull(buildFullPrompt(variation, prompt.preparation_prompt, prompt.role_context))}
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
