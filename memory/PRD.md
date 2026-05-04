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
- [x] Aspect-specific Bloom labels + student-voice "симптоми" під кожним етапом для впізнавання без знання таксономії.
- [x] What / How підказки на кожній з 12 activity-карток (NotebookLM Audio Overview, Video Overview, Mind Map, Flashcards з варіантами, Quiz, Infographic, Study Guide, Presentation + Roleplay / Voice / Write+feedback + Claude chat).
- [x] Material-status check (have / need) — новий крок.
- [x] Backend: Claude Haiku 4.5 integration (швидкість ~6–12 сек на активність, працює з множинними активностями без 502-таймауту).
- [x] Preparation prompt для NotebookLM коли material='need'.
- [x] Frosted-glass UI на teal/mint абстрактному фоні з завантаженого користувачем зображення.
- [x] Copy-per-section + copy-full для кожної картки.
- [x] Variations tabs (MAIN/EASIER/HARDER).
- [x] Recommendations (зелений кільцевий бордер) на активностях, які найбільше підходять для вибраного aspect+Bloom.
- [x] EN/UK повний переклад (включно з усіма новими ключами).
- [x] Full E2E flow passes testing agent iteration 2 (after renderStep fix).

## Prioritized backlog
### P0 (next iteration)
- Streaming / progressive results: показувати картки по мірі готовності (UX для множинних активностей).
- Error retry UI для 502/timeout.

### P1
- Збереження профілю студента (MongoDB) — історія згенерованих промтів.
- Поверх Tomorrow/Day3/Day7: персистувати статус checkbox-ів.
- Share button (link або PDF експорт усіх карток).
- Mobile polish — vertical stepper, більші tap targets.

### P2 (roadmap від ТЗ)
- Профіль вчителя: задавати тему групи.
- Аналітика: що студенти вивчають найчастіше.
- Telegram бот-нагадування про spaced repetition.
- Інтеграція з Edvibe / інші LMS.

## Next tasks (if continuing)
1. Revenue/conversion: додати "Save these prompts" → email capture + weekly digest → leadgen для DLI.
2. Streaming SSE для прогресивних результатів.
3. Profile persistence у MongoDB.
