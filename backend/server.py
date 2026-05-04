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
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"

app = FastAPI(title="AI Prompt Bank API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class GeneratePromptsRequest(BaseModel):
    aspect: str                     # vocabulary, listening, reading, speaking, writing, grammar, translation, custom
    aspect_custom: Optional[str] = None
    topic: str
    prior_knowledge: str            # first_time | some_gaps | know_not_use | specific_problem
    problem_description: Optional[str] = None
    level: str                      # A1, A2, A2+, B1, B1+, B2, C1, C2
    energy: str                     # easy | normal | challenge
    bloom_stage: str                # remember | understand | apply_controlled | apply_free | evaluate | create
    activities: List[str]           # list of activity ids (e.g. ['audio_retelling', 'roleplay'])
    custom_activity: Optional[str] = None
    language: str = "en"            # en | uk


class PromptVariation(BaseModel):
    label: str                      # MAIN / EASIER / HARDER
    before: str
    during: str
    after: str


class GeneratedPrompt(BaseModel):
    id: str
    activity_id: str
    activity_label: str
    tool: str                       # notebooklm | chatgpt_gemini | claude
    methodology: str                # short methodology badge
    where_to_paste: str
    variations: List[PromptVariation]


class GeneratePromptsResponse(BaseModel):
    prompts: List[GeneratedPrompt]


# ---------- Activity definitions (server-side, source of truth for the LLM) ----------
ACTIVITY_REGISTRY = {
    "audio_retelling":   {"label": "Audio Retelling",   "tool": "notebooklm",   "where": "NotebookLM chat → then Studio → Audio Overview"},
    "video_retelling":   {"label": "Video Retelling",   "tool": "notebooklm",   "where": "NotebookLM chat → then Studio → Video Overview"},
    "mind_map":          {"label": "Mind Map",          "tool": "notebooklm",   "where": "NotebookLM chat → then Studio → Mind Map"},
    "flashcards":        {"label": "Flashcards",        "tool": "notebooklm",   "where": "NotebookLM chat → then Studio → Flashcards"},
    "test":              {"label": "Test / Quiz",       "tool": "notebooklm",   "where": "NotebookLM chat → then Studio → Quiz"},
    "infographic":       {"label": "Infographic",       "tool": "notebooklm",   "where": "NotebookLM Studio → Infographic → paste as description"},
    "study_guide":       {"label": "Study Guide",       "tool": "notebooklm",   "where": "NotebookLM Studio → Reports → Custom Format"},
    "presentation":      {"label": "Presentation",      "tool": "notebooklm",   "where": "NotebookLM Studio → Presentation → extra instructions"},
    "roleplay":          {"label": "Roleplay / Dialogue", "tool": "chatgpt_gemini", "where": "ChatGPT or Gemini chat (text or voice)"},
    "speak_voice":       {"label": "Speak / Voice Chat", "tool": "chatgpt_gemini", "where": "ChatGPT voice mode or Gemini Live"},
    "write_feedback":    {"label": "Write + Feedback",   "tool": "chatgpt_gemini", "where": "ChatGPT or Gemini chat"},
    "claude_chat":       {"label": "Claude — Tasks & Explanations", "tool": "claude", "where": "Claude.ai chat"},
}

METHODOLOGY_MAP = {
    # (aspect, sub) -> label
    "vocabulary_notice":     "Input-based (Krashen)",
    "vocabulary_controlled": "Lexical Approach (Lewis)",
    "speaking_free":         "CLT Task-Based (Willis)",
    "writing_check":         "Output / Reformulation (Swain)",
    "grammar_any":           "Focus on Form (Long)",
    "listening_notice":      "Extensive Input + Dictogloss",
    "reading_any":           "Schema activation (Ausubel)",
    "translation_any":       "Contrastive analysis",
    "custom_any":            "Adaptive pedagogy",
}


def pick_methodology(aspect: str, bloom_stage: str) -> str:
    if aspect == "vocabulary":
        return METHODOLOGY_MAP["vocabulary_controlled"] if bloom_stage in ("apply_controlled", "apply_free", "create") else METHODOLOGY_MAP["vocabulary_notice"]
    if aspect == "speaking":
        return METHODOLOGY_MAP["speaking_free"]
    if aspect == "writing":
        return METHODOLOGY_MAP["writing_check"]
    if aspect == "grammar":
        return METHODOLOGY_MAP["grammar_any"]
    if aspect == "listening":
        return METHODOLOGY_MAP["listening_notice"]
    if aspect == "reading":
        return METHODOLOGY_MAP["reading_any"]
    if aspect == "translation":
        return METHODOLOGY_MAP["translation_any"]
    return METHODOLOGY_MAP["custom_any"]


# ---------- LLM ----------
SYSTEM_PROMPT = """You are an expert English Learning Experience Designer working with adult learners (CEFR A1–C2).
Your job: generate **ready-to-paste prompts** that a student will copy into an AI tool (NotebookLM, ChatGPT/Gemini, or Claude) to practise English.

You are NOT teaching the student directly. You are writing the *prompt the student will send to the AI*.

You always respect a strict pedagogical structure:
- BEFORE  → schema activation (Ausubel), success criteria (Wiggins), confidence 1–3 (Hattie). Few short instructions to the AI to ask the student to recall, predict, set criteria.
- DURING  → the actual learning task. Apply the methodology supplied. Adapt difficulty to CEFR level + energy. CRITICAL SOURCE RULE:
    * If tool == 'notebooklm': use phrases like "Using vocabulary from MY sources..." — never invent phrases.
    * If tool == 'chatgpt_gemini' or 'claude': insert a clear instruction "[Paste your phrases from NotebookLM here]" and add: "Use ONLY these phrases — do not invent new ones."
- AFTER   → reflection 3-2-1 (3 new phrases, 2 I'll use, 1 question), self-rating 1–3, one phrase I'll use this week. (Kolb + Hattie + Ebbinghaus.)

For each activity you must produce 3 variations:
- MAIN    → standard, level-appropriate
- EASIER  → more scaffolding, simpler, shorter, more support
- HARDER  → open-ended, multi-step, less scaffolding

OUTPUT FORMAT (mandatory):
Return ONLY valid JSON, no markdown fences, no commentary. Schema:
{
  "variations": [
    {"label": "MAIN",   "before": "...", "during": "...", "after": "..."},
    {"label": "EASIER", "before": "...", "during": "...", "after": "..."},
    {"label": "HARDER", "before": "...", "during": "...", "after": "..."}
  ]
}

Each section is plain text addressed to the AI tool (instruction-style). Each section must be 60–180 words. Include concrete instructions, not abstract goals. Use the user's UI language for surrounding instructions BUT keep the actual English-learning task content in English (since it's an English class)."""


def build_user_prompt(req: GeneratePromptsRequest, activity_id: str, methodology: str) -> str:
    activity = ACTIVITY_REGISTRY.get(activity_id)
    if activity:
        activity_label = activity["label"]
        tool = activity["tool"]
    else:
        activity_label = req.custom_activity or "Custom activity"
        tool = "chatgpt_gemini"

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

    return f"""Generate the prompts for ONE activity.

CONTEXT:
- Aspect: {aspect_label}
- Topic: {req.topic}
- Prior knowledge: {prior_map.get(req.prior_knowledge, req.prior_knowledge)}
- CEFR level: {req.level}
- Energy today: {energy_map.get(req.energy, req.energy)}
- Bloom stage: {bloom_map.get(req.bloom_stage, req.bloom_stage)}
- Methodology to apply (hidden from student, drives design): {methodology}
- Activity: {activity_label}
- Tool: {tool}   ← apply the SOURCE RULE from your system message accordingly.
- UI language for any meta-explanations: {req.language}
- Custom activity description (if any): {req.custom_activity or '(none)'}

Now produce the JSON object with the three variations (MAIN, EASIER, HARDER) following the schema. Remember: ONLY JSON, nothing else."""


def extract_json(text: str) -> dict:
    """Robust JSON extraction from LLM output."""
    text = text.strip()
    # Strip code fences if any
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    # Find first { ... last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]
    return json.loads(text)


async def generate_for_activity(req: GeneratePromptsRequest, activity_id: str) -> GeneratedPrompt:
    activity = ACTIVITY_REGISTRY.get(activity_id)
    is_custom = activity is None
    activity_label = activity["label"] if activity else (req.custom_activity or "Custom activity")
    tool = activity["tool"] if activity else "chatgpt_gemini"
    where = activity["where"] if activity else "Open ChatGPT, Gemini or Claude — paste the prompt"
    methodology = pick_methodology(req.aspect, req.bloom_stage)

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"prompt-bank-{uuid.uuid4()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", CLAUDE_MODEL)

    user_msg = UserMessage(text=build_user_prompt(req, activity_id, methodology))

    try:
        raw = await chat.send_message(user_msg)
    except Exception as e:
        logging.exception("LLM call failed")
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

    try:
        parsed = extract_json(raw if isinstance(raw, str) else str(raw))
        variations_raw = parsed.get("variations") or []
        variations = [PromptVariation(**v) for v in variations_raw]
        if not variations:
            raise ValueError("no variations")
    except Exception as e:
        logging.error(f"Parse failed: {e}; raw was: {raw[:500] if isinstance(raw, str) else raw}")
        raise HTTPException(status_code=502, detail=f"Could not parse LLM output: {e}")

    return GeneratedPrompt(
        id=str(uuid.uuid4()),
        activity_id=activity_id if not is_custom else "custom",
        activity_label=activity_label,
        tool=tool,
        methodology=methodology,
        where_to_paste=where,
        variations=variations,
    )


# ---------- Routes ----------
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
