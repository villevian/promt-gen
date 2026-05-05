import React, { useState, useEffect, useMemo } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Coffee } from "lucide-react";

import { Header } from "./components/Header";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { AspectStep } from "./components/wizard/AspectStep";
import { TopicStep } from "./components/wizard/TopicStep";
import { LevelStep } from "./components/wizard/LevelStep";
import { EnergyStep } from "./components/wizard/EnergyStep";
import { BloomStep } from "./components/wizard/BloomStep";
import { MaterialStep } from "./components/wizard/MaterialStep";
import { ActivitiesStep } from "./components/wizard/ActivitiesStep";
import { ResultsView } from "./components/ResultsView";
import { t } from "./lib/i18n";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TOTAL_STEPS = 7;

const INITIAL_STATE = {
    aspect: null,
    aspectCustom: "",
    topic: "",
    contextMode: "general",   // 'general' or 'custom'
    contextCustom: "",
    prior: null,
    problem: "",
    level: null,
    energy: null,
    bloom: null,
    material: null,
    materialMode: "generate",
    activities: [],
    customActivity: "",
};

function Intro({ lang, onStart }) {
    return (
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-16 md:py-28 pb-step-enter" data-testid="intro-view">
            <div className="pb-eyebrow mb-6">{t(lang, "intro_kicker")}</div>
            <h1 className="pb-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.05] mb-6 text-[var(--pb-text)]">
                {t(lang, "intro_h1")}
            </h1>
            <p className="text-base md:text-lg text-[var(--pb-text-secondary)] leading-relaxed max-w-2xl mb-10">
                {t(lang, "intro_lede")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <button
                    onClick={onStart}
                    className="pb-button-primary flex items-center gap-3"
                    data-testid="intro-start-btn"
                >
                    {t(lang, "intro_cta")} →
                </button>
                <span className="pb-mono text-xs text-[var(--pb-text-muted)] tracking-wider">
                    {t(lang, "intro_meta")}
                </span>
            </div>
        </div>
    );
}

function LoadingView({ lang }) {
    return (
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-32 text-center pb-step-enter" data-testid="loading-view">
            <div className="pb-mono text-xs uppercase tracking-[0.2em] text-[var(--pb-text-muted)] mb-6">
                · · ·
            </div>
            <h2 className="pb-serif text-3xl md:text-4xl tracking-tight mb-4 text-[var(--pb-text)]">
                {t(lang, "loading")}
            </h2>
            <p className="text-[var(--pb-text-secondary)]">{t(lang, "loading_sub")}</p>
        </div>
    );
}

function App() {
    const [lang, setLang] = useState(() => localStorage.getItem("pb-lang") || "en");
    const [phase, setPhase] = useState("intro"); // intro | wizard | results
    const [step, setStep] = useState(0);
    const [state, setState] = useState(INITIAL_STATE);
    const [prompts, setPrompts] = useState([]);
    const [genProgress, setGenProgress] = useState({ current: 0, total: 0, currentLabel: "" });

    useEffect(() => {
        localStorage.setItem("pb-lang", lang);
        document.documentElement.lang = lang;
    }, [lang]);

    useEffect(() => {
        const url = `${process.env.PUBLIC_URL || ""}/bg.png`;
        document.body.style.backgroundImage = `url("${url}")`;
    }, []);

    const update = (patch) => setState((s) => ({ ...s, ...patch }));

    const reset = () => {
        setPhase("intro");
        setStep(0);
        setState(INITIAL_STATE);
        setPrompts([]);
    };

    const canAdvance = useMemo(() => {
        switch (step) {
            case 0: return !!state.aspect;
            case 1: {
                if (!state.topic.trim()) return false;
                if (state.aspect === "custom" && !state.aspectCustom.trim()) return false;
                if (state.contextMode === "custom" && !state.contextCustom.trim()) return false;
                if (!state.prior) return false;
                if (state.prior === "specific_problem" && !state.problem.trim()) return false;
                return true;
            }
            case 2: return !!state.level;
            case 3: return !!state.energy;
            case 4: return !!state.bloom;
            case 5: return !!state.material;
            case 6: return state.activities.length > 0 || state.customActivity.trim().length > 0;
            default: return false;
        }
    }, [step, state]);

    const next = async () => {
        if (!canAdvance) {
            if (step === 1) {
                if (!state.topic.trim()) toast.error(t(lang, "error_topic"));
                else if (state.aspect === "custom" && !state.aspectCustom.trim()) toast.error(t(lang, "error_aspect_custom"));
                else if (state.contextMode === "custom" && !state.contextCustom.trim()) toast.error(t(lang, "error_context_custom"));
                else if (state.prior === "specific_problem" && !state.problem.trim()) toast.error(t(lang, "error_problem"));
            } else if (step === 6) {
                toast.error(t(lang, "error_activity"));
            }
            return;
        }

        if (step < TOTAL_STEPS - 1) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            await generate();
        }
    };

    const back = () => {
        if (phase === "results") {
            setPhase("wizard");
            setStep(TOTAL_STEPS - 1);
            return;
        }
        if (step > 0) setStep(step - 1);
        else setPhase("intro");
    };

    const toggleActivity = (id) => {
        setState((s) => ({
            ...s,
            activities: s.activities.includes(id)
                ? s.activities.filter((x) => x !== id)
                : [...s.activities, id],
        }));
    };

    const generate = async () => {
        setPhase("loading");
        setPrompts([]);
        const activityIds = [...state.activities];
        if (state.customActivity.trim()) activityIds.push("custom");

        setGenProgress({ current: 0, total: activityIds.length, currentLabel: "" });

        const basePayload = {
            aspect: state.aspect,
            aspect_custom: state.aspect === "custom" ? state.aspectCustom : null,
            topic: state.topic,
            context: state.contextMode === "custom" ? state.contextCustom : "general",
            prior_knowledge: state.prior,
            problem_description: state.prior === "specific_problem" ? state.problem : null,
            level: state.level,
            energy: state.energy,
            bloom_stage: state.bloom,
            material_status: state.material || "have",
            material_mode: state.materialMode || "generate",
            custom_activity: state.customActivity || null,
            language: lang,
        };

        const fetchOne = async (aid) => {
            const payload = { ...basePayload, activities: aid === "custom" ? [] : [aid] };
            // 1 retry on transient failure (timeout, 502, parse error)
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const res = await axios.post(`${API}/generate-prompts`, payload, { timeout: 90000 });
                    return res.data.prompts || [];
                } catch (e) {
                    if (attempt === 1) throw e;
                    await new Promise((r) => setTimeout(r, 1500));
                }
            }
            return [];
        };

        // For vocabulary, backend returns 2 prompts per activity (two drills from the bank).
        const promptsPerActivity = state.aspect === "vocabulary" ? 2 : 1;
        const expectedPrompts = activityIds.length * promptsPerActivity;

        // Run in parallel chunks of 3 — keeps UX responsive while halving wall time on large batches.
        const CHUNK = 3;
        let completed = 0;
        let failed = 0;
        setPhase("results");

        try {
            for (let i = 0; i < activityIds.length; i += CHUNK) {
                const slice = activityIds.slice(i, i + CHUNK);
                setGenProgress({ current: completed + 1, total: expectedPrompts, currentLabel: slice.join(", ") });
                // settle so partial successes are kept
                const results = await Promise.allSettled(slice.map(fetchOne));
                results.forEach((r, j) => {
                    if (r.status === "fulfilled") {
                        completed += r.value.length;
                        setPrompts((prev) => [...prev, ...r.value]);
                    } else {
                        failed += 1;
                        console.error(`Activity ${slice[j]} failed:`, r.reason);
                    }
                });
                setGenProgress({ current: completed, total: expectedPrompts, currentLabel: "" });
            }
        } catch (e) {
            console.error("Unexpected error in generation loop:", e);
        }

        setGenProgress({ current: 0, total: 0, currentLabel: "" });

        if (failed > 0 && completed > 0) {
            toast.warning(t(lang, "error_partial").replace("{n}", failed).replace("{total}", activityIds.length));
        } else if (failed === activityIds.length) {
            toast.error(t(lang, "error_generate"));
            setPhase("wizard");
            return;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return <AspectStep value={state.aspect} onChange={(v) => update({ aspect: v })} lang={lang} />;
            case 1:
                return <TopicStep
                    aspect={state.aspect}
                    topic={state.topic} setTopic={(v) => update({ topic: v })}
                    contextMode={state.contextMode} setContextMode={(v) => update({ contextMode: v })}
                    contextCustom={state.contextCustom} setContextCustom={(v) => update({ contextCustom: v })}
                    prior={state.prior} setPrior={(v) => update({ prior: v })}
                    problem={state.problem} setProblem={(v) => update({ problem: v })}
                    aspectCustom={state.aspectCustom} setAspectCustom={(v) => update({ aspectCustom: v })}
                    lang={lang}
                />;
            case 2:
                return <LevelStep value={state.level} onChange={(v) => update({ level: v })} lang={lang} />;
            case 3:
                return <EnergyStep value={state.energy} onChange={(v) => update({ energy: v })} lang={lang} />;
            case 4:
                return <BloomStep aspect={state.aspect} value={state.bloom} onChange={(v) => update({ bloom: v })} lang={lang} />;
            case 5:
                return <MaterialStep
                    value={state.material}
                    onChange={(v) => update({ material: v })}
                    mode={state.materialMode}
                    onChangeMode={(v) => update({ materialMode: v })}
                    level={state.level}
                    lang={lang}
                />;
            case 6:
                return <ActivitiesStep
                    aspect={state.aspect} bloom={state.bloom}
                    selected={state.activities} toggle={toggleActivity}
                    customActivity={state.customActivity} setCustomActivity={(v) => update({ customActivity: v })}
                    lang={lang}
                />;
            default: return null;
        }
    };

    return (
        <div className="App min-h-screen relative">
            <Toaster position="top-center" theme="light" />
            <Header lang={lang} setLang={setLang} onReset={reset} />

            {phase === "intro" && <Intro lang={lang} onStart={() => setPhase("wizard")} />}

            {phase === "wizard" && (
                <>
                    <ProgressIndicator step={step} total={TOTAL_STEPS} lang={lang} />
                    <main className="max-w-6xl mx-auto px-6 md:px-12 my-8 md:my-10" data-testid="wizard-main">
                        <div className="pb-glass p-6 md:p-10">
                            {renderStep()}
                            <nav className="mt-14 pt-8 border-t border-[var(--pb-border)] flex flex-col-reverse md:flex-row md:justify-between gap-3">
                                <button onClick={back} className="pb-button-ghost" data-testid="wizard-back">
                                    ← {t(lang, "back")}
                                </button>
                                <button
                                    onClick={next}
                                    disabled={!canAdvance}
                                    className="pb-button-primary"
                                    data-testid="wizard-next"
                                >
                                    {step === TOTAL_STEPS - 1 ? t(lang, "generate") : t(lang, "next")} →
                                </button>
                            </nav>
                        </div>
                    </main>
                </>
            )}

            {phase === "results" && (
                <ResultsView
                    prompts={prompts}
                    lang={lang}
                    onReset={reset}
                    onBack={back}
                    progress={genProgress}
                />
            )}

            <footer className="border-t border-[var(--pb-border)] pb-glass mt-16" data-testid="app-footer">
                <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 flex flex-col gap-8">
                    <div className="pb-glass-strong p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5 md:gap-8" data-testid="donate-block">
                        <div className="flex-1">
                            <div className="pb-mono text-[10px] uppercase tracking-[0.18em] text-[var(--pb-text-muted)] mb-2">
                                ☕ Support
                            </div>
                            <p className="pb-sans text-sm md:text-[15px] leading-relaxed text-[var(--pb-text)] max-w-2xl">
                                {t(lang, "donate_title")}
                            </p>
                        </div>
                        <a
                            href="https://donate.stripe.com/7sY3cv7sFgJU9Zn0Ns7kc01"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pb-button-primary flex items-center gap-2 !py-3 !px-5 whitespace-nowrap self-start md:self-auto"
                            data-testid="donate-btn"
                        >
                            <Coffee size={16} />
                            {t(lang, "donate_cta")}
                        </a>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center pb-mono text-[11px] text-[var(--pb-text-muted)]">
                        <div>{t(lang, "byline")}</div>
                        <div>{t(lang, "brand")} · {new Date().getFullYear()} · Powered by Claude Haiku 4.5</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
