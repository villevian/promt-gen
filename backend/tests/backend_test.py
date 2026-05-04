"""Backend tests for AI Prompt Bank API (Claude Haiku 4.5 + FastAPI) — iteration 2.

Adds material_status (have/need) + preparation_prompt logic for NotebookLM activities.
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
        "activities": ["flashcards"],
        "language": "en",
    }
    p.update(overrides)
    return p


# ---------- Health: model is Haiku 4.5 ----------
def test_root_returns_haiku_model(client):
    r = client.get(f"{API}/", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data.get("model") == "claude-haiku-4-5-20251001"


# ---------- Validation errors ----------
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


# ---------- material_status='have' + NLM activity → no prep prompt ----------
def test_material_have_flashcards_no_prep(client):
    start = time.time()
    r = client.post(
        f"{API}/generate-prompts",
        json=_base_payload(material_status="have", activities=["flashcards"]),
        timeout=TIMEOUT,
    )
    elapsed = time.time() - start
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data["prompts"]) == 1
    p = data["prompts"][0]
    assert p["activity_id"] == "flashcards"
    assert p["tool"] == "notebooklm"
    assert p["needs_preparation"] is False
    assert p["preparation_prompt"] in (None, "")
    # Variation sanity
    labels = {v["label"] for v in p["variations"]}
    assert labels == {"MAIN", "EASIER", "HARDER"}
    for v in p["variations"]:
        assert v["before"].strip() and v["during"].strip() and v["after"].strip()
    # Speed sanity (Haiku should comfortably finish under 15s)
    print(f"[have+flashcards] elapsed={elapsed:.1f}s")
    assert elapsed < 30, f"Single activity took {elapsed:.1f}s (>30s)"


# ---------- material_status='need' + NLM activity → prep prompt populated ----------
def test_material_need_flashcards_has_prep(client):
    r = client.post(
        f"{API}/generate-prompts",
        json=_base_payload(material_status="need", activities=["flashcards"]),
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, r.text
    p = r.json()["prompts"][0]
    assert p["tool"] == "notebooklm"
    assert p["needs_preparation"] is True
    assert isinstance(p["preparation_prompt"], str)
    assert len(p["preparation_prompt"].strip()) > 30
    assert p["preparation_tool"] == "chatgpt_gemini"


# ---------- material_status='need' + non-NLM activity → still no prep ----------
def test_material_need_roleplay_no_prep(client):
    payload = _base_payload(
        aspect="speaking",
        bloom_stage="apply_free",
        material_status="need",
        activities=["roleplay"],
    )
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    p = r.json()["prompts"][0]
    assert p["tool"] == "chatgpt_gemini"
    assert p["needs_preparation"] is False
    assert p["preparation_prompt"] in (None, "")


# ---------- mixed activities: only NLM ones get prep ----------
def test_material_need_mixed_only_nlm_gets_prep(client):
    payload = _base_payload(
        aspect="speaking",
        bloom_stage="apply_free",
        material_status="need",
        activities=["flashcards", "roleplay"],
    )
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    by_id = {p["activity_id"]: p for p in r.json()["prompts"]}
    assert by_id["flashcards"]["needs_preparation"] is True
    assert (by_id["flashcards"]["preparation_prompt"] or "").strip()
    assert by_id["roleplay"]["needs_preparation"] is False
    assert by_id["roleplay"]["preparation_prompt"] in (None, "")
