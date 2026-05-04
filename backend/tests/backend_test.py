"""Backend tests for AI Prompt Bank API (Claude Sonnet 4.5 + FastAPI)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://prompt-studio-en.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
TIMEOUT = 120


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
        "activities": ["flashcards"],
        "language": "en",
    }
    p.update(overrides)
    return p


# ---------- Health ----------
def test_root_returns_model(client):
    r = client.get(f"{API}/", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "message" in data
    assert data.get("model") == "claude-sonnet-4-5-20250929"


# ---------- Validation errors ----------
def test_empty_topic_returns_400(client):
    r = client.post(f"{API}/generate-prompts", json=_base_payload(topic=""), timeout=30)
    assert r.status_code == 400


def test_no_activities_returns_400(client):
    r = client.post(f"{API}/generate-prompts",
                    json=_base_payload(activities=[], custom_activity=None), timeout=30)
    assert r.status_code == 400


# ---------- Main happy path ----------
def test_single_activity_returns_3_variations(client):
    r = client.post(f"{API}/generate-prompts", json=_base_payload(), timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "prompts" in data
    assert len(data["prompts"]) == 1
    p = data["prompts"][0]
    assert p["activity_id"] == "flashcards"
    assert p["tool"] == "notebooklm"
    # vocabulary + apply_controlled -> Lexical Approach
    assert "Lexical" in p["methodology"]
    labels = [v["label"] for v in p["variations"]]
    assert set(labels) == {"MAIN", "EASIER", "HARDER"}
    for v in p["variations"]:
        assert v["before"].strip()
        assert v["during"].strip()
        assert v["after"].strip()


def test_multiple_activities_returns_multiple_prompts(client):
    payload = _base_payload(
        aspect="speaking",
        bloom_stage="apply_free",
        activities=["roleplay", "write_feedback"],
    )
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data["prompts"]) == 2
    ids = {p["activity_id"] for p in data["prompts"]}
    assert ids == {"roleplay", "write_feedback"}
    tools = {p["activity_id"]: p["tool"] for p in data["prompts"]}
    assert tools["roleplay"] == "chatgpt_gemini"
    assert tools["write_feedback"] == "chatgpt_gemini"
    for p in data["prompts"]:
        assert "CLT Task-Based" in p["methodology"]


def test_custom_activity_adds_custom_prompt(client):
    payload = _base_payload(
        activities=["flashcards"],
        custom_activity="Create 10 gap-fill sentences with target phrasal verbs",
    )
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    ids = [p["activity_id"] for p in data["prompts"]]
    assert "flashcards" in ids
    assert "custom" in ids
    assert len(data["prompts"]) == 2


def test_language_uk_still_produces_valid_response(client):
    payload = _base_payload(language="uk", activities=["flashcards"])
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data["prompts"]) == 1
    assert len(data["prompts"][0]["variations"]) == 3


def test_claude_chat_tool_mapping(client):
    payload = _base_payload(
        aspect="grammar",
        activities=["claude_chat"],
        bloom_stage="understand",
    )
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    p = r.json()["prompts"][0]
    assert p["tool"] == "claude"
    assert "Focus on Form" in p["methodology"]


def test_writing_methodology(client):
    payload = _base_payload(
        aspect="writing",
        activities=["write_feedback"],
        bloom_stage="apply_free",
    )
    r = client.post(f"{API}/generate-prompts", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    p = r.json()["prompts"][0]
    assert "Output" in p["methodology"] or "Reformulation" in p["methodology"]
