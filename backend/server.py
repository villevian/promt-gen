from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import json
import re
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
# Haiku 4.5 — fast and structured-output-capable, ~5-10s per activity.
CLAUDE_MODEL = "claude-haiku-4-5-20251001"

app = FastAPI(title="AI Prompt Bank API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class GeneratePromptsRequest(BaseModel):
    aspect: str
    aspect_custom: Optional[str] = None
    topic: str
    context: Optional[str] = "general"   # 'general' or a free-text context (e.g. "I'm a doula")
    prior_knowledge: str
    problem_description: Optional[str] = None
    level: str
    energy: str
    bloom_stage: str
    material_status: str = "have"        # 'have' or 'need'
    material_mode: str = "generate"      # 'generate' or 'search'
    activities: List[str]
    custom_activity: Optional[str] = None
    language: str = "en"


class PromptVariation(BaseModel):
    label: str
    before: str = ""
    during: str = ""
    after: str = ""


class GeneratedPrompt(BaseModel):
    id: str
    activity_id: str
    activity_label: str
    tool: str
    methodology: str
    where_to_paste: str
    role_context: str = ""               # Role & context block — AI persona + student profile + mission
    vocab_activity_name: Optional[str] = None   # e.g. "R1 — Collocation Dictation"
    needs_preparation: bool = False
    preparation_prompt: Optional[str] = None
    preparation_tool: Optional[str] = None
    variations: List[PromptVariation]


class GeneratePromptsResponse(BaseModel):
    prompts: List[GeneratedPrompt]


ACTIVITY_REGISTRY = {
    "audio_retelling":   {"label": "Audio Overview (podcast)",            "tool": "notebooklm",     "where": "NotebookLM chat → Studio → Audio Overview"},
    "video_retelling":   {"label": "Video Overview (visual explainer)",   "tool": "notebooklm",     "where": "NotebookLM chat → Studio → Video Overview"},
    "mind_map":          {"label": "Mind Map",                            "tool": "notebooklm",     "where": "NotebookLM chat → Studio → Mind Map"},
    "flashcards":        {"label": "Flashcards",                          "tool": "notebooklm",     "where": "NotebookLM chat → Studio → Flashcards"},
    "test":              {"label": "Quiz / Test",                         "tool": "notebooklm",     "where": "NotebookLM chat → Studio → Quiz"},
    "infographic":       {"label": "Infographic",                         "tool": "notebooklm",     "where": "NotebookLM Studio → Infographic → paste as description"},
    "study_guide":       {"label": "Study Guide",                         "tool": "notebooklm",     "where": "NotebookLM Studio → Reports → Custom Format"},
    "presentation":      {"label": "Presentation",                        "tool": "notebooklm",     "where": "NotebookLM Studio → Presentation → extra instructions"},
    "roleplay":          {"label": "Roleplay / Dialogue",                 "tool": "chatgpt_gemini", "where": "ChatGPT or Gemini chat (text or voice)"},
    "speak_voice":       {"label": "Voice chat (live)",                   "tool": "chatgpt_gemini", "where": "ChatGPT voice mode or Gemini Live"},
    "write_feedback":    {"label": "Write + feedback",                    "tool": "chatgpt_gemini", "where": "ChatGPT or Gemini chat"},
    "claude_chat":       {"label": "Claude — tasks & explanations",       "tool": "claude",         "where": "Claude.ai chat"},
}


# ---------- Vocabulary Activity Bank ----------
# Per-Bloom-stage drills for the 'vocabulary' aspect. Selected in pairs and
# injected into the DURING section of the generated prompt. Variables are
# filled from wizard inputs: {CHUNK}, {L1}, {LEVEL}, {CONTEXT}, {NOUN}, {TEXT}.
# Current wizard exposes 6 Bloom stages; we map Bloom's revised 'Analyze' onto
# 'apply_free' (the independent production stage, which requires analytical
# awareness of word relations, collocation fields, word families, etc.).
VOCABULARY_ACTIVITY_BANK = {
    "remember": [
        {"id": "R1",  "name": "Collocation Dictation",
         "hint": "AI dictates 5–7 collocations that contain '{CHUNK}' at {LEVEL}, one by one. Student writes each, repeats it out loud, then AI reveals the correct form and adds the {L1} equivalent."},
        {"id": "R2",  "name": "Dictogloss",
         "hint": "AI reads a 60–90-word mini-text about {CONTEXT} containing '{CHUNK}' twice at natural speed. Student reconstructs it from memory keeping meaning intact; AI compares and flags where the target chunk was lost."},
        {"id": "R3",  "name": "MMM Gap Fill (Meaning · Memory · Mouth)",
         "hint": "AI shows 6 sentences with '{CHUNK}' removed. Student (1) guesses meaning, (2) recalls the exact form, (3) reads the full sentence aloud. AI corrects silently at the end."},
        {"id": "R5",  "name": "5-5-1 Grid",
         "hint": "AI builds a 5×5×1 grid: 5 synonyms of '{CHUNK}' × 5 typical noun partners × 1 register note. Student fills what they can; AI completes the rest with a short example per cell."},
        {"id": "R6",  "name": "L1 ↔ L2 Recall Grid",
         "hint": "AI shows 8 items in {L1} related to {CONTEXT}. Student produces the English equivalent from memory. AI flags near-misses ('I am agree' vs 'I agree') and explains why."},
        {"id": "R8",  "name": "Backchaining Drill",
         "hint": "AI takes the phrase containing '{CHUNK}' and drills it back-to-front, word-by-word, so the student repeats each fragment until the full chunk flows at natural stress. Focus on the stressed syllable."},
        {"id": "R10", "name": "Pass the Note",
         "hint": "AI and student alternate one short written message each about {CONTEXT}. Every message MUST reuse '{CHUNK}' in a new collocation. 6 turns total; AI scores accuracy at the end."},
    ],
    "understand": [
        {"id": "U1", "name": "3 Contexts Analysis",
         "hint": "AI gives three short authentic contexts where '{CHUNK}' appears: business, casual, academic. Student explains what each context signals about register and typical partners. AI corrects."},
        {"id": "U2", "name": "Collocation Strength Sort",
         "hint": "AI shows 10 phrases combining '{CHUNK}' with different words. Student sorts them into strong / weak / wrong. AI reveals the accepted collocations and why the rejected ones feel off."},
        {"id": "U4", "name": "CCQ Generator (Concept Checking Questions)",
         "hint": "AI asks 4–5 yes/no CCQs about '{CHUNK}' (e.g. 'If I {CHUNK}, am I being polite?'). Student answers; AI explains the boundary cases and nuances."},
        {"id": "U5", "name": "Register Sorting",
         "hint": "AI offers 8 variants of the same idea — some with '{CHUNK}', some with alternatives. Student sorts into formal / neutral / casual / rude. AI reveals the continuum."},
        {"id": "U7", "name": "Soundshape Analysis",
         "hint": "AI breaks '{CHUNK}' into stress pattern, linking, and weak forms. Student records the phrase, AI compares and points at the 1 sound the student's L1 ({L1}) most likely distorts."},
        {"id": "U8", "name": "False Friends Discussion",
         "hint": "AI names 3 {L1} words that LOOK like '{CHUNK}' or its partners but mean something else. Student explains the trap in their own words. AI confirms and gives a memory hook."},
        {"id": "U9", "name": "Pragmatic Equivalents",
         "hint": "AI gives one situation in {CONTEXT} and asks: 'In {L1}, what would you say here?'. Then: 'In English, which of these 4 options is most natural?'. AI explains the pragmatic match."},
    ],
    "apply_controlled": [  # APPLY
        {"id": "A1", "name": "Sentence Heads Generator",
         "hint": "AI gives 6 sentence stems ending just before '{CHUNK}' (e.g. 'In yesterday's stand-up, I had to…'). Student completes each using '{CHUNK}' correctly. AI corrects collocation and tense."},
        {"id": "A2", "name": "Cascade Dialogue",
         "hint": "AI starts a short workplace dialogue about {CONTEXT}. Every student turn MUST contain '{CHUNK}'. AI responds naturally and subtly recasts errors without breaking the scene."},
        {"id": "A3", "name": "What Do You Say When…",
         "hint": "AI names 5 micro-situations from {CONTEXT} (e.g. 'Your manager misses a deadline'). Student produces one sentence per situation that uses '{CHUNK}'. AI rates naturalness 1–3."},
        {"id": "A4", "name": "Retelling with Chunks",
         "hint": "AI gives the student a 120-word story snippet; student retells it in 60 words MUST-reusing '{CHUNK}' at least twice. AI marks whether the chunk was used authentically or bolted on."},
        {"id": "A7", "name": "Remove the Word List",
         "hint": "Student speaks 60 seconds about {CONTEXT} without any visible word list. AI transcribes, highlights every instance of '{CHUNK}' actually produced, and suggests 2 natural places it could have appeared."},
        {"id": "A9", "name": "Modalisation Practice",
         "hint": "AI takes '{CHUNK}' and asks student to produce 4 versions with different modal load: direct / softened / tentative / assertive. AI scores whether the tonal shift actually landed."},
    ],
    "apply_free": [  # ANALYZE — independent production requires analytical awareness
        {"id": "AN1", "name": "Text Deconstruction",
         "hint": "AI gives a 150-word authentic text about {CONTEXT}. Student extracts every collocation containing '{CHUNK}' or its partners, groups them by pattern (V+N, Adj+N, prep phrase). AI confirms and adds missed ones."},
        {"id": "AN4", "name": "Green Cross Code (safe to use vs not)",
         "hint": "AI lists 8 phrases built around '{CHUNK}'. Student marks each as safe-to-use / risky / wrong and explains why in one line. AI reveals the real status of each."},
        {"id": "AN5", "name": "Tone Unit Identification",
         "hint": "AI reads a 40-word sentence containing '{CHUNK}' aloud. Student marks where the tone units break and which word carries the main stress. AI confirms and explains the meaning shift."},
        {"id": "AN8", "name": "Delexical Word Concordance",
         "hint": "If '{CHUNK}' contains a delexical verb (make/do/have/take/get), AI shows 12 collocations the student must sort by verb. Student explains the pattern; AI adds the missing ones."},
        {"id": "AN9", "name": "Genre Microstructure Analysis",
         "hint": "AI gives two short texts from different genres (e.g. Slack message vs email) both mentioning {CONTEXT}. Student identifies which uses '{CHUNK}' and predicts why. AI confirms."},
    ],
    "evaluate": [
        {"id": "E1", "name": "Tone Ladder",
         "hint": "AI shows 5 versions of one idea built on '{CHUNK}' ladder rungs from rude → blunt → neutral → diplomatic → obsequious. Student ranks them and picks the one they'd actually send. AI explains which works best in {CONTEXT}."},
        {"id": "E2", "name": "Confidence Scale",
         "hint": "AI offers 4 phrasings of the same message with different confidence levels (hedged → assertive). Student rates own comfort 1–3 with each and picks the one matching the situation in {CONTEXT}."},
        {"id": "E3", "name": "You Could, But You Wouldn't",
         "hint": "AI shows 6 grammatically correct sentences using '{CHUNK}' — but 3 of them a native would NOT say. Student identifies which 3 and explains why. AI confirms the cultural/register traps."},
        {"id": "E4", "name": "Formal / Informal Sorting",
         "hint": "AI lists 10 alternatives to '{CHUNK}'. Student sorts into formal / informal / universal. AI gives the matching situation for each."},
        {"id": "E5", "name": "Le Mot Juste",
         "hint": "AI gives 3 real sentences from {CONTEXT} with '{CHUNK}' blanked out. Student picks the best word from a shortlist of 5 near-synonyms and justifies. AI explains the shade difference."},
        {"id": "E6", "name": "Personal Filter",
         "hint": "Student lists 3 situations from their own week where '{CHUNK}' would fit. AI checks the fit and flags any situation where a different phrase would have been more natural."},
    ],
    "create": [
        {"id": "C1",  "name": "Sentence Upgrade",
         "hint": "Student writes a 50-word paragraph about {CONTEXT} using basic vocabulary. AI flags every generic word (thing/good/do/make) and challenges student to replace with '{CHUNK}' or a better partner, without losing meaning."},
        {"id": "C2",  "name": "Ban Basic Words",
         "hint": "Student speaks 90 seconds about {CONTEXT}; the words GOOD, BAD, NICE, THING, VERY, REALLY are BANNED. AI listens for slips and forces a reformulation using '{CHUNK}' and collocated partners."},
        {"id": "C4",  "name": "Record → Transcript → Upgrade",
         "hint": "Student speaks 60 seconds on {CONTEXT}. AI transcribes, then returns an 'upgrade pass' where every generic collocation is rewritten using '{CHUNK}' or a stronger partner. Student re-records the upgrade."},
        {"id": "C7",  "name": "Story Box Creation",
         "hint": "AI gives a 'story box' of 6 constraints (a character, a mood, a place linked to {CONTEXT}, the word '{CHUNK}', a twist, a 120-word limit). Student writes the story; AI scores authenticity of chunk use."},
        {"id": "C8",  "name": "Role-Play Script Writing",
         "hint": "AI gives a workplace scenario from {CONTEXT}. Student writes a 8-line dialogue where both characters MUST use '{CHUNK}' at least once in a natural way. AI reviews register and flow."},
        {"id": "C10", "name": "Reformulation Pair Work",
         "hint": "Student sends their own real message from {CONTEXT} (email, Slack, voice memo). AI returns a reformulated version using '{CHUNK}' and 2 other stronger partners, with a 2-line explanation of each change."},
    ],
}

# Names like "apply_controlled" map to Bloom buckets used in the bank.
VOCAB_STAGE_ALIAS = {
    "remember": "remember",
    "understand": "understand",
    "apply_controlled": "apply_controlled",   # APPLY
    "apply_free": "apply_free",               # ANALYZE (independent production)
    "evaluate": "evaluate",
    "create": "create",
}


def pick_vocab_activities(bloom_stage: str, topic: str, seed_str: str, n: int = 2) -> list:
    """Deterministically pick n activities for the current bloom stage.
    Deterministic on (bloom_stage, topic, seed_str) so the same wizard
    submission gets consistent activities; different submissions rotate."""
    import random
    bucket = VOCABULARY_ACTIVITY_BANK.get(VOCAB_STAGE_ALIAS.get(bloom_stage, bloom_stage), [])
    if not bucket:
        return []
    rng = random.Random(f"{bloom_stage}|{topic}|{seed_str}")
    k = min(n, len(bucket))
    return rng.sample(bucket, k)


def fill_vocab_variables(text: str, req) -> str:
    """Replace {CHUNK}, {L1}, {LEVEL}, {CONTEXT}, {NOUN}, {TEXT} with wizard values."""
    l1_map = {"en": "English", "uk": "Ukrainian"}
    ctx_raw = (req.context or "general").strip()
    context_value = ctx_raw if ctx_raw and ctx_raw.lower() != "general" else req.topic.strip()
    replacements = {
        "{CHUNK}":   req.topic.strip(),
        "{L1}":      l1_map.get(req.language, "the student's L1"),
        "{LEVEL}":   req.level,
        "{CONTEXT}": context_value,
        "{NOUN}":    req.topic.strip(),
        "{TEXT}":    "[student's source material from NotebookLM]" if req.material_status == "have" else "[source material generated via the preparation prompt]",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text



def pick_methodology(aspect: str, bloom_stage: str) -> str:
    if aspect == "vocabulary":
        return "Lexical Approach (Lewis)" if bloom_stage in ("apply_controlled", "apply_free", "create") else "Input-based (Krashen)"
    return {
        "speaking": "CLT Task-Based (Willis)",
        "writing": "Output / Reformulation (Swain)",
        "grammar": "Focus on Form (Long)",
        "listening": "Extensive Input + Dictogloss",
        "reading": "Schema activation (Ausubel)",
        "translation": "Contrastive analysis",
    }.get(aspect, "Adaptive pedagogy")


# ---------- LLM prompts ----------
SYSTEM_PROMPT = """You are an expert English Learning Experience Designer for adult CEFR A1–C2 learners.
Your job: write ready-to-paste PROMPTS that the student will copy into an AI tool (NotebookLM, ChatGPT/Gemini, or Claude) to practise English. You are NOT teaching directly — you are writing the prompt the student sends to the AI.

==========  MANDATORY STRUCTURE  ==========

Field 1 — role_context (100–140 words, MUST BE FILLED IN, never empty, never just a placeholder):
  This is the TOP of the prompt the student will paste. Without it the AI doesn't know how to behave.
  It MUST contain all three parts, written in first-person "I am…" for the student:
  • ROLE for the AI: "You are a/an [specialised English tutor role]" — tailor to the aspect + activity (e.g. 'Business English roleplay coach', 'academic writing mentor', 'vocabulary coach for adult professionals', 'pronunciation tutor').
  • STUDENT PROFILE: "I am a [level] learner working on [topic]. My current state: [quote the prior-knowledge state verbatim — first time / some gaps / know but don't use / specific problem <paste the problem>]. My goal today: [translate the Bloom stage into plain English — e.g. 'practise these phrases with your guidance before I use them alone']."
  • MISSION for the AI: "Guide me step-by-step. Ask for my attempt BEFORE giving yours. Correct me gently and explain WHY natives phrase it differently. Stay at [level] — don't dump C2 vocabulary on a B1 learner. Don't lecture; coach. Switch to my L1 only if I explicitly ask."

Field 2 — preparation_prompt (string, empty "" when not needed):
  Only filled when material_status='need' AND tool='notebooklm'. See material_mode rules.

Field 3 — variations (array of EXACTLY three objects, labels MAIN / EASIER / HARDER):
  Each has: label, before, during, after. All four keys REQUIRED.
  - BEFORE → schema activation (Ausubel), success criteria (Wiggins), confidence 1–3 (Hattie).
  - DURING → the actual learning task. Apply the methodology. Adapt difficulty to CEFR level + energy.
    SOURCE RULE:
    * tool == 'notebooklm' → "Using vocabulary/phrases from MY sources…" — never invent phrases.
    * tool in ('chatgpt_gemini', 'claude') → include "[Paste your phrases from NotebookLM here]" + "Use ONLY these phrases."
  - AFTER  → reflection 3-2-1, self-rating 1–3, one phrase I'll use this week.
  Each section = 80–120 words.
  MAIN = standard. EASIER = more scaffolding, shorter. HARDER = open-ended, multi-step.

material_mode rules (for preparation_prompt only):
- 'generate' → instructs the LLM to write a 400–500-word article/dialogue at the level with 10–15 target phrases listed at the end.
- 'search' → instructs ChatGPT/Gemini WITH WEB SEARCH to return 5 real sources (2 articles, 2 podcasts/videos, 1 academic) with URLs + 2-sentence relevance.

==========  EXAMPLE OUTPUT (role_context FILLED IN)  ==========

{
  "role_context": "You are an experienced Business English speaking coach specialising in client-facing conversations for B2 adult professionals. I am a B2 learner working on running a kickoff meeting with a new client. My current state: I know the phrases passively but don't use them actively. My goal today: practise speaking freely without a script. Guide me step-by-step. Ask for my attempt BEFORE giving yours. Correct me gently and explain WHY natives would phrase things differently. Stay at B2 — don't dump C2 vocabulary. Don't lecture; coach. Switch to my L1 only if I explicitly ask.",
  "preparation_prompt": "",
  "variations": [
    {"label": "MAIN", "before": "...", "during": "...", "after": "..."},
    {"label": "EASIER", "before": "...", "during": "...", "after": "..."},
    {"label": "HARDER", "before": "...", "during": "...", "after": "..."}
  ]
}

==========  OUTPUT RULES  ==========

Output ONLY the JSON object. No markdown fences, no commentary.

CRITICAL:
- role_context MUST be a full 100–140 word paragraph, not empty, not a placeholder.
- Inside every string, escape " as \\" and replace real newlines with \\n.
- variations array = exactly three objects, each with all four keys.
- Your output must pass JSON.parse on the first attempt."""


def build_user_prompt(req: GeneratePromptsRequest, activity_id: str, methodology: str, vocab_activities: list = None) -> str:
    activity = ACTIVITY_REGISTRY.get(activity_id)
    activity_label = activity["label"] if activity else (req.custom_activity or "Custom activity")
    tool = activity["tool"] if activity else "chatgpt_gemini"

    aspect_label = req.aspect_custom if req.aspect == "custom" and req.aspect_custom else req.aspect

    prior_map = {
        "first_time": "First time — no prior knowledge yet.",
        "some_gaps": "Knows some, but with gaps.",
        "know_not_use": "Knows the topic but does not actively use it yet.",
        "specific_problem": f"Has a specific problem: {req.problem_description or '(not specified)'}",
    }
    energy_map = {
        "easy": "Easy & relaxed — shorter, simpler, no pressure.",
        "normal": "Normal pace — standard difficulty.",
        "challenge": "Challenge me! — multi-step, harder, more autonomy.",
    }
    bloom_map = {
        "remember": "Remember — meet/recognise the material",
        "understand": "Understand — see how/when it is used",
        "apply_controlled": "Apply with support (controlled practice)",
        "apply_free": "Apply on my own (free production) / Analyze word relations",
        "evaluate": "Evaluate — check what I remember / what sounds unnatural",
        "create": "Create — use in a real situation",
    }

    needs_prep = req.material_status == "need" and tool == "notebooklm"
    mode_line = ""
    if needs_prep:
        mode_line = (
            "material_mode='search' — the prep prompt must tell ChatGPT/Gemini (with web search enabled) to RETURN 5 REAL ONLINE SOURCES (articles + podcasts/videos + 1 academic), with URLs and summaries."
            if req.material_mode == "search"
            else "material_mode='generate' — the prep prompt must instruct the LLM to WRITE a 400–500-word article/dialogue/case study on the topic at the specified level, with a 10–15-word target glossary."
        )

    vocab_block = ""
    if vocab_activities:
        lines = []
        for v in vocab_activities:
            filled_hint = fill_vocab_variables(v["hint"], req)
            lines.append(f'- {v["id"]} — {v["name"]}: {filled_hint}')
        vocab_block = f"""

=== VOCABULARY ACTIVITY BANK (MANDATORY for DURING) ===
Aspect is 'vocabulary'. The DURING section of EACH variation MUST structure the actual learning task around ONE of the activities below. Weave the activity name ({vocab_activities[0]["id"]} — {vocab_activities[0]["name"]}) into the DURING text so the student sees a concrete drill, not a generic instruction. Keep the activity's structure; adapt difficulty to the CEFR level and energy.

Activities to use (choose ONE across all three variations — MAIN uses the main activity, EASIER simplifies it, HARDER extends it):
{chr(10).join(lines)}

All variables ({{CHUNK}}, {{L1}}, {{LEVEL}}, {{CONTEXT}}, {{NOUN}}, {{TEXT}}) have already been filled above with wizard data; use the filled text verbatim.
"""

    return f"""Generate the prompts for ONE activity.

CONTEXT:
- Aspect: {aspect_label}
- Topic: {req.topic}
- Student's domain context: {req.context if req.context and req.context.strip().lower() != 'general' else 'General — no specific professional/personal context. Pick neutral but relatable examples.'}
- Prior knowledge: {prior_map.get(req.prior_knowledge, req.prior_knowledge)}
- CEFR level: {req.level}
- Energy today: {energy_map.get(req.energy, req.energy)}
- Bloom stage: {bloom_map.get(req.bloom_stage, req.bloom_stage)}
- Methodology to apply (hidden from student): {methodology}
- Activity: {activity_label}
- Tool: {tool}
- Has own source material: {"NO — student does NOT have source material" if needs_prep else ("YES" if tool == "notebooklm" else "N/A")}
- Needs a preparation prompt: {"YES. " + mode_line if needs_prep else "NO — return empty string for preparation_prompt"}
- UI language for meta text: {req.language}
- Custom activity description (if any): {req.custom_activity or '(none)'}
{vocab_block}
IMPORTANT: when the student's domain context is specified (not 'General'), use it to colour every example, role_context profile, and task setting. Do NOT pretend the student is a generic office worker — use their actual domain.

Output ONLY the JSON object matching the schema."""


def extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Tolerant pass: fix common LLM mistakes — raw newlines inside strings
        # and occasional unescaped double-quotes mid-string.
        repaired = _repair_json_strings(text)
        return json.loads(repaired)


def _repair_json_strings(text: str) -> str:
    """Replace raw newlines/tabs inside JSON string literals with their escape sequences."""
    out = []
    in_string = False
    escape = False
    for ch in text:
        if escape:
            out.append(ch)
            escape = False
            continue
        if ch == "\\":
            out.append(ch)
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            out.append(ch)
            continue
        if in_string:
            if ch == "\n":
                out.append("\\n")
                continue
            if ch == "\r":
                out.append("\\r")
                continue
            if ch == "\t":
                out.append("\\t")
                continue
        out.append(ch)
    return "".join(out)


async def generate_for_activity(
    req: GeneratePromptsRequest,
    activity_id: str,
    vocab_drill: Optional[dict] = None,
) -> GeneratedPrompt:
    activity = ACTIVITY_REGISTRY.get(activity_id)
    is_custom = activity is None
    activity_label = activity["label"] if activity else (req.custom_activity or "Custom activity")
    tool = activity["tool"] if activity else "chatgpt_gemini"
    where = activity["where"] if activity else "Open ChatGPT, Gemini or Claude — paste the prompt"
    methodology = pick_methodology(req.aspect, req.bloom_stage)
    needs_prep = req.material_status == "need" and tool == "notebooklm"

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    # Vocabulary aspect: caller passes the exact drill to use for DURING.
    vocab_activities = [vocab_drill] if vocab_drill else []
    vocab_activity_name = f'{vocab_drill["id"]} — {vocab_drill["name"]}' if vocab_drill else None

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"prompt-bank-{uuid.uuid4()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", CLAUDE_MODEL)

    user_msg = UserMessage(text=build_user_prompt(req, activity_id, methodology, vocab_activities))

    # One-shot retry: Haiku can emit malformed JSON or drop fields on long prep articles.
    raw = None
    variations = []
    prep = ""
    last_err = None
    for attempt in range(2):
        try:
            raw = await chat.send_message(user_msg)
        except Exception as e:
            logging.exception("LLM call failed")
            raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

        try:
            parsed = extract_json(raw if isinstance(raw, str) else str(raw))
            variations_raw = parsed.get("variations") or []
            variations = [PromptVariation(**v) for v in variations_raw]
            prep = parsed.get("preparation_prompt") or ""
            role_ctx = parsed.get("role_context") or ""
            # All three variations must have non-empty before/during/after, plus role_context.
            complete = (
                len(variations) >= 1
                and all(v.before.strip() and v.during.strip() and v.after.strip() for v in variations)
                and bool(role_ctx.strip())
            )
            if complete:
                break
            last_err = ValueError(f"Incomplete response — attempt {attempt + 1}")
            logging.warning(str(last_err))
        except Exception as e:
            last_err = e
            logging.warning(f"Parse attempt {attempt + 1} failed: {e}")
            continue

    if not variations:
        logging.error(f"Final parse failure: {last_err}; raw={str(raw)[:500]}")
        raise HTTPException(status_code=502, detail=f"Could not parse LLM output: {last_err}")

    return GeneratedPrompt(
        id=str(uuid.uuid4()),
        activity_id=activity_id if not is_custom else "custom",
        activity_label=activity_label,
        tool=tool,
        methodology=methodology,
        where_to_paste=where,
        role_context=role_ctx.strip(),
        vocab_activity_name=vocab_activity_name,
        needs_preparation=needs_prep and bool(prep.strip()),
        preparation_prompt=prep.strip() if needs_prep and prep.strip() else None,
        preparation_tool="chatgpt_gemini" if needs_prep else None,
        variations=variations,
    )


@api_router.get("/")
async def root():
    return {"message": "AI Prompt Bank API", "model": CLAUDE_MODEL}


@api_router.post("/generate-prompts", response_model=GeneratePromptsResponse)
async def generate_prompts(req: GeneratePromptsRequest):
    activity_ids = list(req.activities)
    if req.custom_activity and "custom" not in activity_ids:
        activity_ids.append("custom")

    if not activity_ids:
        raise HTTPException(status_code=400, detail="At least one activity is required")

    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required")

    # For vocabulary aspect, fan out: one card per activity × per picked drill (2 drills).
    # Each drill becomes its own card so the student sees several concrete options.
    tasks = []
    if req.aspect == "vocabulary":
        for aid in activity_ids:
            drills = pick_vocab_activities(
                req.bloom_stage,
                req.topic,
                f"{aid}|{req.level}|{req.language}",
                n=2,
            )
            if drills:
                for d in drills:
                    tasks.append(generate_for_activity(req, aid, vocab_drill=d))
            else:
                tasks.append(generate_for_activity(req, aid))
    else:
        tasks = [generate_for_activity(req, aid) for aid in activity_ids]

    prompts = await asyncio.gather(*tasks)
    return GeneratePromptsResponse(prompts=prompts)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
