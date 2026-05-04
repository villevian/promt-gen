"""Backend tests for AI Prompt Bank API (Claude Haiku 4.5 + FastAPI) — iteration 3.

Covers:
- Health: model is claude-haiku-4-5-20251001
- Validation errors
- material_status have/need + material_mode generate/search prep prompt logic
- Single-activity speed (<30s)
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
TIMEOUT = 90


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _base_payload(**overrides):
    p = {
        "aspect": "vocabulary",
        "topic": "phrasal verbs with get",
        "prior_knowledge": "some_gaps",
        "level": "B2",
        "energy": "normal",
        "bloom_stage": "apply_controlled",
        "material_status": "have",
        "material_mode": "generate",
        "activities": ["flashcards"],
        "language": "en",
    }
    p.update(overrides)
    return p


# ---------- Health ----------
def test_root_returns_haiku_model(client):
    r = client.get(f"{API}/", timeout=30)
    assert r.status_code == 200
    assert r.json().get("model") == "claude-haiku-4-5-20251001"


# ---------- Validation ----------
def test_empty_topic_returns_400(client):
    r = client.post(f"{API}/generate-prompts", json=_base_payload(topic=""), timeout=30)
    assert r.status_code == 400


def test_no_activities_returns_400(client):
    r = client.post(
        f"{API}/generate-prompts",
        json=_base_payload(activities=[], custom_activity=None),
        timeout=30,
    )
    assert r.status_code == 400


# ---------- material_mode default works when omitted ----------
def test_material_mode_defaults_to_generate(client):
    payload = _base_payload(material_status="have", activities=["flashcards"])
    payload.pop("material_mode", None)
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text


# ---------- have + flashcards → no prep, fast ----------
def test_material_have_flashcards_no_prep(client):
    start = time.time()
    r = client.post(
        f"{API}/generate-prompts",
        json=_base_payload(material_status="have", activities=["flashcards"]),
        timeout=TIMEOUT,
    )
    elapsed = time.time() - start
    assert r.status_code == 200, r.text
    p = r.json()["prompts"][0]
    assert p["activity_id"] == "flashcards"
    assert p["tool"] == "notebooklm"
    assert p["needs_preparation"] is False
    assert p["preparation_prompt"] in (None, "")
    labels = {v["label"] for v in p["variations"]}
    assert labels == {"MAIN", "EASIER", "HARDER"}
    print(f"[have+flashcards] elapsed={elapsed:.1f}s")
    assert elapsed < 30, f"Single activity took {elapsed:.1f}s (>30s)"


# ---------- need + generate + flashcards → prep mentions article/dialogue, >400 chars ----------
def test_material_need_generate_prep_is_long_article(client):
    r = client.post(
        f"{API}/generate-prompts",
        json=_base_payload(
            material_status="need",
            material_mode="generate",
            level="B2",
            activities=["flashcards"],
        ),
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, r.text
    p = r.json()["prompts"][0]
    assert p["needs_preparation"] is True
    prep = (p["preparation_prompt"] or "").strip()
    assert len(prep) > 400, f"prep length={len(prep)} should be > 400"
    low = prep.lower()
    assert any(k in low for k in ("article", "dialogue", "case study")), (
        f"prep should mention article/dialogue/case study; got: {prep[:300]}"
    )


# ---------- need + search + B2 + mind_map → prep mentions web search + 5 sources ----------
def test_material_need_search_prep_mentions_web_search_and_sources(client):
    r = client.post(
        f"{API}/generate-prompts",
        json=_base_payload(
            material_status="need",
            material_mode="search",
            level="B2",
            activities=["mind_map"],
        ),
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, r.text
    p = r.json()["prompts"][0]
    assert p["needs_preparation"] is True
    prep = (p["preparation_prompt"] or "").strip()
    low = prep.lower()
    assert "web search" in low or "search the web" in low or "web-search" in low, (
        f"prep should mention web search; got: {prep[:300]}"
    )
    assert "5" in prep and ("source" in low), f"prep should mention 5 sources; got: {prep[:300]}"


# ---------- need + roleplay (non-NLM) → no prep ----------
def test_material_need_roleplay_no_prep(client):
    payload = _base_payload(
        aspect="speaking",
        bloom_stage="apply_free",
        material_status="need",
        material_mode="search",
        activities=["roleplay"],
    )
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    p = r.json()["prompts"][0]
    assert p["tool"] == "chatgpt_gemini"
    assert p["needs_preparation"] is False
    assert p["preparation_prompt"] in (None, "")
