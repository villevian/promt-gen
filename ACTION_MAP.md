# ACTION_MAP.md — AI Prompt Bank

Complete user-flow map of every interactive surface in the codebase. Format: **User does X → triggers Y → result Z.** All file/line references are pinned to current code.

---

## 0. App architecture (one paragraph)

- **Frontend**: React 19 + Tailwind, single page, no router. State machine `phase ∈ {intro, wizard, loading, results}` lives in `frontend/src/App.js`.
- **Backend**: FastAPI (`backend/server.py`) with a single user-facing endpoint `POST /api/generate-prompts` plus a health `GET /api/`.
- **LLM**: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via `emergentintegrations.LlmChat` using `EMERGENT_LLM_KEY` from `backend/.env`.
- **Persistence**: MongoDB client is opened (`MONGO_URL`, `DB_NAME`) but **never written to or read from**. No persistence today.
- **Data flow**: every wizard step mutates the local `state` object in `App.js`. On submit, `App.generate()` fans out N parallel POSTs (1 per activity, in chunks of 3), the backend calls Claude per request, parses JSON, returns `GeneratedPrompt`s. Frontend appends them as they arrive into `prompts[]`, rendered by `ResultsView` → `PromptCard`.

---

## 1. Top-level state machine — `App.js`

| State | Set by | Renders |
|---|---|---|
| `phase = "intro"` | initial / `reset()` | `<Intro />` (App.js:37) |
| `phase = "wizard"` | Intro CTA / `back()` from results | `<ProgressIndicator />` + step component |
| `phase = "loading"` | first line of `generate()` (App.js:186) | `<LoadingView />` (currently shadowed — see note in §6) |
| `phase = "results"` | inside `generate()` (App.js:227) | `<ResultsView />` |

Other state in `App.js`:
- `lang` — persisted to `localStorage["pb-lang"]` (App.js:101, 108-111).
- `step` (0–6) — current wizard step.
- `state` — wizard payload (initial value at App.js:22-35).
- `prompts` — array of generated prompts.
- `genProgress` — `{current, total, currentLabel}` for the progress strip.

Side-effect: on mount, body background image is set to `/bg.png` (App.js:113-116).

---

## 2. Header — `components/Header.jsx`

Sticky top bar, mounted on every phase.

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Brand title "AI Prompt Bank" (button) | `brand-reset` | Click | `onReset` prop → `App.reset()` (App.js:120-125) | Sets `phase="intro"`, `step=0`, `state=INITIAL_STATE`, `prompts=[]`. No network. |
| `EN` button | `lang-en` | Click | `setLang("en")` (Header.jsx:28) | Updates `lang` state → `useEffect` writes `localStorage["pb-lang"]="en"` and sets `<html lang="en">` (App.js:108-111). All `t()` calls re-render in EN. |
| `UK` button | `lang-uk` | Click | `setLang("uk")` (Header.jsx:36) | Same as above with `uk`. |

No API calls in header.

---

## 3. Intro screen — `App.js → Intro()` (App.js:37-84)

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| "Build a prompt →" CTA | `intro-start-btn` | Click | `onStart()` → `setPhase("wizard")` (App.js:306) | Renders `<ProgressIndicator />` + wizard step 0 (`AspectStep`). |

The "Methodology" right-rail card is presentational, no interactions.

---

## 4. Wizard navigation — `App.js`

Both buttons sit in the wizard `<nav>` (App.js:314-326).

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| `← Back` | `wizard-back` | Click | `back()` (App.js:166-174) | If `phase==="results"` → returns to wizard step 6. Else `step--`, or `setPhase("intro")` if already at step 0. No network. |
| `Next →` / `Build my prompts →` | `wizard-next` | Click | `next()` (App.js:146-164) | Validates via `canAdvance` (App.js:127-144). On fail: `toast.error()` with the appropriate `error_*` i18n string. On pass: `step++` and smooth-scroll to top, OR if at step 6 → calls `generate()` (the network-firing function — see §6). |

Validation matrix used by `canAdvance`:
- step 0 → `state.aspect` must be set
- step 1 → `topic` non-empty AND (`aspect !== "custom"` OR `aspectCustom` non-empty) AND `prior` set AND (`prior !== "specific_problem"` OR `problem` non-empty)
- step 2 → `state.level`
- step 3 → `state.energy`
- step 4 → `state.bloom`
- step 5 → `state.material`
- step 6 → `activities.length > 0` OR `customActivity` non-empty

---

## 5. Wizard steps (5.0–5.6)

### 5.0 Step 0 — Aspect — `wizard/AspectStep.jsx`

8 cards from `lib/wizardData.js → ASPECTS`.

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Aspect card (×8) | `aspect-card-{id}` where id ∈ `vocabulary, listening, reading, speaking, writing, grammar, translation, custom` | Click | `onChange(a.id)` → `App.update({aspect: id})` (App.js:265) | Sets `state.aspect`. Unblocks Next button. Downstream side-effects: changes `TopicStep` placeholder (`TOPIC_PLACEHOLDERS[aspect]`), `BloomStep` labels (`BLOOM_LABELS[aspect]` + `BLOOM_SYMPTOMS[aspect]`), and `ActivitiesStep` recommendations (`RECOMMENDATIONS[aspect]`). |

### 5.1 Step 1 — Topic & Diagnostic — `wizard/TopicStep.jsx`

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Aspect-custom input (only if `aspect==="custom"`) | `aspect-custom-input` | Types | `setAspectCustom(value)` → `App.update({aspectCustom})` (App.js:272) | Sets `state.aspectCustom`. Sent to backend as `aspect_custom`. |
| Big topic input | `topic-input` | Types | `setTopic(value)` → `App.update({topic})` (App.js:269) | Sets `state.topic`. Sent to backend as `topic`. Auto-focused on mount (TopicStep.jsx:47). |
| Diagnostic card (×4) | `diagnostic-{id}` where id ∈ `first_time, some_gaps, know_not_use, specific_problem` | Click | `setPrior(opt.id)` → `App.update({prior})` (App.js:270) | Sets `state.prior`. Sent as `prior_knowledge`. If `id==="specific_problem"` → reveals problem textarea below. |
| Problem textarea (only if `prior==="specific_problem"`) | `problem-input` | Types | `setProblem(value)` → `App.update({problem})` (App.js:271) | Sets `state.problem`. Sent as `problem_description`. |

### 5.2 Step 2 — CEFR Level — `wizard/LevelStep.jsx`

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Level cell (×8) | `level-{id}` where id ∈ `A1, A2, A2+, B1, B1+, B2, C1, C2` | Click | `onChange(l.id)` → `App.update({level})` (App.js:276) | Sets `state.level`. Used downstream by `MaterialStep` to lock the "search real sources" mode if user is below B2 (`meetsLevel`, MaterialStep.jsx:16-19). Sent to backend as `level`. |

### 5.3 Step 3 — Energy — `wizard/EnergyStep.jsx`

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Energy card (×3) | `energy-{id}` where id ∈ `easy, normal, challenge` | Click | `onChange(e.id)` → `App.update({energy})` (App.js:278) | Sets `state.energy`. Sent as `energy`. Backend feeds `energy_map` into the user prompt to Claude (server.py:171-175). |

### 5.4 Step 4 — Bloom Stage — `wizard/BloomStep.jsx`

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Bloom row (×6) | `bloom-{stage}` where stage ∈ `remember, understand, apply_controlled, apply_free, evaluate, create` | Click | `onChange(stage)` → `App.update({bloom})` (App.js:280) | Sets `state.bloom`. Used by `pick_methodology()` in backend (server.py:91-101) to choose pedagogical school (Lewis/Krashen for vocab; Willis/Swain/Long/etc for others). Also feeds `RECOMMENDATIONS[aspect][bloom]` for the green ring on Step 6 cards. |

### 5.5 Step 5 — Material — `wizard/MaterialStep.jsx`

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| `Yes, I have material` | `material-have` | Click | `onChange("have")` → `App.update({material:"have"})` (App.js:284) | Sets `state.material="have"`. The mode sub-step stays hidden. Sent to backend as `material_status`. |
| `No — I need it` | `material-need` | Click | `onChange("need")` (App.js:284) | Sets `state.material="need"`. **Reveals** the mode sub-grid below. Triggers backend's `needs_prep` branch (server.py:185), but ONLY for activities whose `tool === "notebooklm"`. |
| `Let AI write it` | `material-mode-generate` | Click (always available) | `onChangeMode("generate")` → `App.update({materialMode})` (App.js:287) | Sets `state.materialMode`. Sent as `material_mode`. Backend writes a 400–500 word source-generation prompt (server.py:188-192). |
| `Help me find real sources` | `material-mode-search` | Click — **disabled below B2** | `onChangeMode("search")` if `meetsLevel(level,"B2")` (MaterialStep.jsx:60) | Sets `state.materialMode="search"`. Backend writes a web-search instruction targeting ChatGPT/Gemini (server.py:188-189). If level < B2, button is `disabled` and shows "Available from B2" hint. |

### 5.6 Step 6 — Activities — `wizard/ActivitiesStep.jsx`

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Activity card (×12) | `activity-{id}` where id ∈ `audio_retelling, video_retelling, mind_map, flashcards, test, infographic, study_guide, presentation, roleplay, speak_voice, write_feedback, claude_chat` | Click | `toggle(a.id)` → `App.toggleActivity()` (App.js:176-183) | Toggles membership in `state.activities[]`. Each selected ID becomes ONE separate POST in `generate()`. Cards in `RECOMMENDATIONS[aspect][bloom]` show a green outline (`pb-recommended`). |
| Custom activity textarea | `custom-activity-input` | Types | `setCustomActivity(value)` → `App.update({customActivity})` (App.js:294) | Sets `state.customActivity`. If non-empty, an extra POST with `activities=[]` and `custom_activity=<text>` is fired. Backend treats it as an unregistered activity → tool defaults to `chatgpt_gemini` (server.py:265-268). |

---

## 6. Generation flow — `App.js → generate()` (App.js:185-260)

This is the only network-firing flow in the app.

**6.1 What the user does**: clicks `wizard-next` on step 6 with valid input.

**6.2 Function chain**:
1. `next()` (App.js:146) sees `step === TOTAL_STEPS - 1` → awaits `generate()`.
2. `generate()` builds `activityIds = [...state.activities]` and pushes `"custom"` if `customActivity` is non-empty (App.js:188-189).
3. Sets `phase="loading"` briefly (App.js:186) **and then sets `phase="results"` BEFORE the network calls finish** (App.js:227). Note: this means `<LoadingView />` is mounted but never visible — the results page renders immediately and the `<results-progress>` strip handles the in-flight UX.
4. Builds `basePayload` (App.js:193-206) — full snapshot of `state` mapped to backend field names:
   ```
   { aspect, aspect_custom, topic, prior_knowledge, problem_description,
     level, energy, bloom_stage, material_status, material_mode,
     custom_activity, language, activities: [<one id>] }
   ```
5. `fetchOne(aid)` is called per activity, with up to **2 attempts** (1 retry on any throw, 1500ms back-off, 90s timeout per call) (App.js:208-221).
6. Activities are run in **parallel chunks of 3** with `Promise.allSettled` so partial failures don't kill successes (App.js:223-245).
7. As each chunk resolves, fulfilled prompts are spread into `prompts` state (App.js:237-238) → `<ResultsView>` re-renders with new cards.
8. After all chunks: if all failed → `toast.error(t("error_generate"))` and `setPhase("wizard")` (App.js:254-258). If some failed → `toast.warning(t("error_partial"))` with counts. Else: silent success.

**6.3 Backend handler** — `POST /api/generate-prompts` (server.py:340-354):
- Validates `topic` and `activities` non-empty.
- `asyncio.gather(*[generate_for_activity(req, aid) for aid in activity_ids])` → one Claude call per activity in parallel.

**6.4 Per-activity backend logic** — `generate_for_activity()` (server.py:263-332):
1. Look up the activity in `ACTIVITY_REGISTRY` (server.py:75-88) for `label`, `tool`, `where`. Falls back to `chatgpt_gemini`/custom_activity if id is `"custom"`.
2. `pick_methodology(aspect, bloom_stage)` (server.py:91-101) selects the methodology string (Krashen / Lewis / Long / Willis / Swain / etc.).
3. `needs_prep = material_status=="need" AND tool=="notebooklm"` (server.py:270).
4. Build `LlmChat(EMERGENT_LLM_KEY, session_id="prompt-bank-<uuid>", system_message=SYSTEM_PROMPT).with_model("anthropic", "claude-haiku-4-5-20251001")` (server.py:275-279).
5. Send `UserMessage(build_user_prompt(...))` (server.py:158-211) — context block listing every wizard answer + prep instructions.
6. **Retry loop (max 2 attempts)** (server.py:288-314): send → `extract_json(raw)` (server.py:214-228, with `_repair_json_strings` fallback at 231-260) → check that all 3 variations have non-empty before/during/after AND `role_context` is non-empty. If incomplete, retry once.
7. Returns `GeneratedPrompt` (Pydantic model at server.py:57-68): `id, activity_id, activity_label, tool, methodology, where_to_paste, role_context, needs_preparation, preparation_prompt, preparation_tool, variations[]`.

**6.5 Failure paths**:
- `EMERGENT_LLM_KEY` missing → `HTTPException 500` (server.py:272-273).
- Claude raises → `HTTPException 502 "LLM call failed: …"` (server.py:291-293).
- JSON un-parsable after 2 attempts → `HTTPException 502 "Could not parse LLM output: …"` (server.py:316-318).
- Frontend retries the whole call once (App.js:211); on second failure, the activity is recorded as failed in `Promise.allSettled` results.

**6.6 No persistence**: response is returned to the client and never written to MongoDB.

---

## 7. Results view — `components/ResultsView.jsx`

Mounts as soon as `phase==="results"`.

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| `<results-progress>` strip (only while `prompts.length < progress.total`) | `results-progress` | — | Pure presentational, driven by `genProgress` state | Shows "Generating X / Y" + animated bar. Hidden once all activities settled. |
| `Print / Save as PDF` button | `results-print` | Click | `window.print()` (ResultsView.jsx:22) | Browser print dialog. CSS uses `print:hidden` on nav/share/checkboxes/copy buttons so only prompt content prints. |
| `← Back` | `results-back` | Click | `App.back()` | Returns to wizard step 6 with all state intact (App.js:167-170). |
| `Start over →` | `results-start-over` | Click | `App.reset()` | Clears everything → intro screen (App.js:120-125). No network. |

Each prompt in `prompts[]` renders one `<PromptCard>` (ResultsView.jsx:52-54). See §8.

---

## 8. Prompt card — `components/PromptCard.jsx`

Per card, indexed `0..N-1`. All testids prefixed `prompt-{index}`.

### 8.1 Card-level interactions

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Card root | `prompt-card-{i}` | — | — | Container article. |
| Tool badge ("NotebookLM Studio" / "ChatGPT/Gemini" / "Claude AI") | `prompt-{i}-tool-badge` | — | — | Color-coded by `prompt.tool` (PromptCard.jsx:12-16). Read-only. |
| `Share link` button | `prompt-{i}-share` | Click | `handleShare()` (PromptCard.jsx:155-164) | If `navigator.share` exists (mobile/HTTPS) → opens system share sheet with title + full prompt text. Else → copies the same string to clipboard via `useCopier()` (state-shows "Link copied" for 1.5s). The shared payload is `buildFullPrompt(variation, prompt.preparation_prompt, prompt.role_context)` (PromptCard.jsx:24-33) — concatenates STEP 1 prep + STEP 2 (ROLE & CONTEXT + BEFORE + DURING + AFTER). |

### 8.2 How-to-use block — `<HowToUseBlock>` (PromptCard.jsx:100-119)

Read-only ordered list. Steps come from `lib/wizardData.js → PASTE_STEPS[activity_id][lang]`. Renders nothing if activity has no entry (e.g. `custom`).

### 8.3 Preparation block — `<PreparationBlock>` (PromptCard.jsx:73-98) — only when `prompt.needs_preparation && prompt.preparation_prompt`

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| `Copy` button | `prompt-{i}-copy-prep` | Click | `useCopier().copy(prompt.preparation_prompt)` (PromptCard.jsx:93) | `navigator.clipboard.writeText()` of the prep prompt text. Button flips to "Copied" with check icon for 1.5s (PromptCard.jsx:35-47). |

### 8.4 Role-context block — `<RoleContextBlock>` (PromptCard.jsx:121-141) — only when `prompt.role_context` truthy

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| `Copy` button | `prompt-{i}-copy-role` | Click | `useCopier().copy(prompt.role_context)` (PromptCard.jsx:136) | Clipboard copy of the role-and-context paragraph. |

### 8.5 Variation tabs (PromptCard.jsx:217-229)

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Tab `MAIN` | `prompt-{i}-variation-main` | Click | `setActiveVariation(0)` | Re-renders the three sections below using `prompt.variations[0]`. |
| Tab `EASIER` | `prompt-{i}-variation-easier` | Click | `setActiveVariation(1)` | Same with index 1. |
| Tab `HARDER` | `prompt-{i}-variation-harder` | Click | `setActiveVariation(2)` | Same with index 2. |

### 8.6 Section blocks — `<Section>` ×3 (PromptCard.jsx:60-71, 232-236)

For each kind ∈ `before, during, after`:

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| Section container | `prompt-{i}-{kind}` | — | — | Left border 4px in section color (purple/blue/green). |
| `Copy` button | `prompt-{i}-copy-{kind}` | Click | `useCopier().copy(variation[kind])` | Clipboard copy of just that section's body. Local "Copied" state for 1.5s. |

### 8.7 Spaced repetition checkboxes (PromptCard.jsx:239-258)

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| `Tomorrow` checkbox | `prompt-{i}-return-tomorrow` | Click | `toggleReturn("tomorrow")` (PromptCard.jsx:153) | Flips local `returns.tomorrow`. Strikes through the label. **Purely client-state — not persisted, not synced, no reminders.** |
| `Day 3` checkbox | `prompt-{i}-return-day_3` | Click | `toggleReturn("day_3")` | Same. |
| `Day 7` checkbox | `prompt-{i}-return-day_7` | Click | `toggleReturn("day_7")` | Same. |

### 8.8 Copy-full button (PromptCard.jsx:260-269)

| Element | testid | User does | Triggers | Result |
|---|---|---|---|---|
| `Copy full prompt` | `prompt-{i}-copy-full` | Click | `copyFull(buildFullPrompt(variation, prep, role_context))` | Concatenates: `=== STEP 1 — PREPARATION PROMPT === <prep>` (if any) + `=== STEP 2 — LEARNING PROMPT === --- ROLE & CONTEXT --- ... --- BEFORE --- ... --- DURING --- ... --- AFTER --- ...` and writes to clipboard (PromptCard.jsx:24-33). Local "Copied" state for 1.5s. |

---

## 9. ProgressIndicator — `components/ProgressIndicator.jsx`

Read-only bar shown only during `phase==="wizard"`. Renders 7 segments, the first `step+1` are filled with `var(--pb-text)`. No interactions.

---

## 10. Footer — `App.js` (App.js:342-347)

Static byline + powered-by line. No interactions.

---

## 11. Backend endpoints — `backend/server.py`

| Method | Path | Body | Purpose | Called by |
|---|---|---|---|---|
| GET | `/api/` | — | Health probe; returns `{message, model}` (server.py:336-337). | Not called by frontend. Useful for `curl` smoke-test. |
| POST | `/api/generate-prompts` | `GeneratePromptsRequest` (server.py:34-47) | Generates prompt cards. Fires N Claude calls in parallel (one per activity). Returns `{prompts: GeneratedPrompt[]}`. | Frontend `App.generate() → fetchOne()` (App.js:213). |

CORS: wide-open per `CORS_ORIGINS=*` in `backend/.env` (server.py:359-364).

---

## 12. Side-effects & I/O at a glance

| Side-effect | Where | When |
|---|---|---|
| `localStorage` set `pb-lang` | App.js:109 | Whenever `lang` changes. |
| `document.body.style.backgroundImage` | App.js:114-115 | Once on App mount. |
| `document.documentElement.lang` | App.js:110 | On `lang` change. |
| `navigator.clipboard.writeText` | PromptCard.jsx:39, all `useCopier` callers | On every Copy / Copy-full / Share-fallback click. |
| `navigator.share` | PromptCard.jsx:157 | On Share click if browser supports it. |
| `window.scrollTo` | App.js:160, 259 | On Next, after generation completes. |
| `window.print` | ResultsView.jsx:22 | On Print button click. |
| `toast.error / .warning` (sonner) | App.js:149-153, 253, 255 | Validation errors and partial/total generation failures. |
| `axios.post` to backend | App.js:213 | Inside `fetchOne`, once per activity (×2 max with retry). |
| `LlmChat.send_message` (Anthropic) | server.py:290 | Once per activity per attempt (max 2). |
| `motor.AsyncIOMotorClient` open / close | server.py:22, 372-373 | Open at import; closed on FastAPI `shutdown`. **Never queried.** |

---

## 13. Things that DO NOT happen (gotchas)

- **Nothing is saved to MongoDB.** The Mongo client is allocated and closed but no collection is touched.
- **Spaced-repetition checkboxes don't notify anyone.** They are local React state, unmounted with the card.
- **No auth, no sessions, no cookies.** The backend is fully anonymous.
- **No URL state.** A page reload returns the user to the intro and erases the wizard.
- **`<LoadingView>` is dead UI.** `phase` is flipped to `"results"` synchronously inside `generate()` before the first network call resolves (App.js:227), so `LoadingView` (App.js:86-98) is mounted only for the synchronous tick that lives between line 186 and line 227 — i.e., effectively never visible. The in-flight UX is delivered by the `<results-progress>` strip in `ResultsView` (ResultsView.jsx:31-49).
- **Activities `infographic`, `study_guide`, `presentation` have no `PASTE_STEPS` translation for `custom`** — fine because activity ids are fixed.
- **`custom` activity has no `PASTE_STEPS` entry** → its prompt card simply hides the How-to-use block (`HowToUseBlock` returns `null`, PromptCard.jsx:102).
