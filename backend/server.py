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


def build_user_prompt(req: GeneratePromptsRequest, activity_id: str, methodology: str) -> str:
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
        "apply_free": "Apply on my own (free production)",
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

    return f"""Generate the prompts for ONE activity.

CONTEXT:
- Aspect: {aspect_label}
- Topic: {req.topic}
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


async def generate_for_activity(req: GeneratePromptsRequest, activity_id: str) -> GeneratedPrompt:
    activity = ACTIVITY_REGISTRY.get(activity_id)
    is_custom = activity is None
    activity_label = activity["label"] if activity else (req.custom_activity or "Custom activity")
    tool = activity["tool"] if activity else "chatgpt_gemini"
    where = activity["where"] if activity else "Open ChatGPT, Gemini or Claude — paste the prompt"
    methodology = pick_methodology(req.aspect, req.bloom_stage)
    needs_prep = req.material_status == "need" and tool == "notebooklm"

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"prompt-bank-{uuid.uuid4()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", CLAUDE_MODEL)

    user_msg = UserMessage(text=build_user_prompt(req, activity_id, methodology))

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
