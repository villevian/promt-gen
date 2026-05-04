# AI Prompt Bank — PRD

## Problem statement
Generator персоналізованих навчальних промтів для дорослих студентів англійської мови (CEFR A1–C2), які використовують AI-інструменти (NotebookLM, ChatGPT/Gemini, Claude). Розвʼязує проблему: студент не знає як правильно поставити AI-завдання, пише «teach me English» і отримує загальну відповідь. Промт-банк генерує точний, методично обґрунтований запит замість нього.

**Автор/методолог:** Valentyna Gordiienko, Sr. Learning Experience Designer, DLI.

## Architecture
- **Frontend:** React + Tailwind. Multi-step wizard з 7 кроками. Editorial/frosted-glass стиль на мʼятному (teal) фоні.
- **Backend:** FastAPI + MongoDB (без persistence поки що).
- **LLM:** Claude Haiku 4.5 через Emergent Universal Key + emergentintegrations.
- **Endpoint:** `POST /api/generate-prompts`.

## User personas
- Дорослі професіонали (A1–C2), які вчать business/ESP/загальну англійську й вже мають акаунт у NotebookLM/ChatGPT/Gemini/Claude.
- Викладачі, які хочуть дати студентам продуманий промт під конкретну тему.

## Core requirements (static)
1. Шестикроковий флоу: Aspect → Topic+Diagnostic → CEFR Level → Energy → Bloom Stage → Material Source → Activities.
2. Генерація промту з 3 секціями (BEFORE/DURING/AFTER) і 3 варіаціями (MAIN/EASIER/HARDER) на кожну вибрану активність.
3. Preparation prompt: коли material_status='need' і активність NotebookLM, окремий промт для ChatGPT/Claude/Gemini для генерації джерельного матеріалу.
4. EN/UK toggle.
5. Color-coded секції і інструменти (Before/purple, During/blue, After/green; NLM/blue, ChatGPT/green, Claude/purple).
6. Spaced repetition UI (Tomorrow / Day 3 / Day 7).

## What's been implemented (2026-02-04)
- [x] 7-step wizard з progress indicator і валідацією per-step.
- [x] Aspect-specific Bloom labels + aspect-specific student-voice "симптоми" (8 aspects × 6 stages × 2 languages).
- [x] What / How підказки на кожній з 12 activity-карток.
- [x] Material-status check (have / need) — з підкроком material_mode:
    - `generate` — AI пише 400-500-слівну статтю/діалог з цільовою лексикою
    - `search` — AI з веб-пошуком повертає 5 реальних джерел (обмежено B2+)
- [x] Backend: Claude Haiku 4.5 + retry + tolerant JSON repair + strict escape rules у system prompt (вирішує проблему unescaped JSON у довгих prep-промтах).
- [x] Progressive generation — одна активність за раз, live progress bar.
- [x] Per-card: step-by-step "How to use this prompt" інструкції (EN + UK, 4–7 кроків на активність).
- [x] Share button per card (Web Share API + clipboard fallback).
- [x] Print / Save as PDF кнопка на результатах (window.print() + print CSS).
- [x] Frosted-glass UI на teal/mint абстрактному фоні.
- [x] EN/UK toggle повний переклад (з усіма новими ключами).

## Prioritized backlog
### P0 (next iteration)
- Mobile polish — vertical stepper, collapsible sections
- Telegram bot integration для spaced-repetition нагадувань
- Partial-success fallback: не скидати вже згенеровані картки при помилці в наступній

### P1
- Share via URL (запакувати state у query params)
- Збереження профілю студента + історія промтів (MongoDB)
- Teacher view — задавати тему для групи

### P2 (roadmap від ТЗ)
- Профіль вчителя: задавати тему групи.
- Аналітика: що студенти вивчають найчастіше.
- Telegram бот-нагадування про spaced repetition.
- Інтеграція з Edvibe / інші LMS.

## Next tasks (if continuing)
1. Revenue/conversion: додати "Save these prompts" → email capture + weekly digest → leadgen для DLI.
2. Streaming SSE для прогресивних результатів.
3. Profile persistence у MongoDB.
