// Source data for the AI Prompt Bank wizard.

export const ASPECTS = [
    { id: "vocabulary",  emoji: "Aa", labelEn: "Vocabulary", labelUk: "Лексика",
      descEn: "Words, collocations, business phrases.",     descUk: "Слова, колокації, фрази." },
    { id: "listening",   emoji: "(()", labelEn: "Listening", labelUk: "Аудіювання",
      descEn: "Understanding spoken English.",              descUk: "Розуміння на слух." },
    { id: "reading",     emoji: "¶", labelEn: "Reading",    labelUk: "Читання",
      descEn: "Comprehending texts and reports.",           descUk: "Читання й розуміння текстів." },
    { id: "speaking",    emoji: "“ ”", labelEn: "Speaking", labelUk: "Говоріння",
      descEn: "Saying it out loud — in calls, in meetings.", descUk: "Усне мовлення." },
    { id: "writing",     emoji: "✎", labelEn: "Writing",    labelUk: "Письмо",
      descEn: "Emails, messages, structured text.",         descUk: "Листи, повідомлення, тексти." },
    { id: "grammar",     emoji: "[ ]", labelEn: "Grammar",  labelUk: "Граматика",
      descEn: "Tenses, conditionals, structures in context.", descUk: "Граматичні структури." },
    { id: "translation", emoji: "↹", labelEn: "Translation", labelUk: "Переклад",
      descEn: "Compare L1 ↔ L2, notice differences.",       descUk: "Порівняння L1 ↔ L2." },
    { id: "custom",      emoji: "?", labelEn: "Something else", labelUk: "Своє",
      descEn: "Describe what you want to train.",           descUk: "Опиши, що хочеш тренувати." },
];

export const TOPIC_PLACEHOLDERS = {
    vocabulary: { en: "e.g. Phrases for giving feedback, collocations for client calls",
                  uk: "напр. Фрази для фідбеку, колокації для дзвінків з клієнтами" },
    listening:  { en: "e.g. Following a fast-paced product demo",
                  uk: "напр. Слухати швидкі демо продуктів" },
    reading:    { en: "e.g. Skimming a tech research paper",
                  uk: "напр. Швидко читати технічну статтю" },
    speaking:   { en: "e.g. Running a client call, presenting quarterly results",
                  uk: "напр. Вести дзвінок з клієнтом, презентувати квартальні результати" },
    writing:    { en: "e.g. Writing escalation emails, polite refusals",
                  uk: "напр. Писати ескалаційні листи, ввічливі відмови" },
    grammar:    { en: "e.g. Present Perfect in emails, conditionals for requests",
                  uk: "напр. Present Perfect у листах, умовні для запитів" },
    translation:{ en: "e.g. How «зручно» maps to English",
                  uk: "напр. Як «зручно» перекладається англійською" },
    custom:     { en: "e.g. Pronouncing TH sounds when stressed",
                  uk: "напр. Вимовляти TH під стрес" },
};

export const LEVELS = [
    { id: "A1",  label: "A1",  descEn: "Beginner",   descUk: "Початковий" },
    { id: "A2",  label: "A2",  descEn: "Elementary", descUk: "Основи" },
    { id: "A2+", label: "A2+", descEn: "Pre-Int",    descUk: "До-середній" },
    { id: "B1",  label: "B1",  descEn: "Intermediate", descUk: "Середній" },
    { id: "B1+", label: "B1+", descEn: "Upper-Int",  descUk: "Вище середнього" },
    { id: "B2",  label: "B2",  descEn: "Advanced",   descUk: "Просунутий" },
    { id: "C1",  label: "C1",  descEn: "Proficient", descUk: "Майстерний" },
    { id: "C2",  label: "C2",  descEn: "Mastery",    descUk: "Володіння" },
];

export const ENERGIES = [
    { id: "easy",      glyph: "○" },
    { id: "normal",    glyph: "◐" },
    { id: "challenge", glyph: "●" },
];

// Bloom labels adapt per aspect.
export const BLOOM_STAGES = ["remember", "understand", "apply_controlled", "apply_free", "evaluate", "create"];

export const BLOOM_LABELS = {
    vocabulary: {
        remember:         { en: "Meet new words",                uk: "Познайомитись зі словами" },
        understand:       { en: "Understand how to use them",    uk: "Зрозуміти, як їх вживати" },
        apply_controlled: { en: "Practise with support",         uk: "Практика з підтримкою" },
        apply_free:       { en: "Use them on my own",            uk: "Вживати самостійно" },
        evaluate:         { en: "Check what I remember",         uk: "Перевірити, що памʼятаю" },
        create:           { en: "Use in a real situation",       uk: "Застосувати в реальній ситуації" },
    },
    listening: {
        remember:         { en: "Tune my ear to the topic",       uk: "Налаштувати слух на тему" },
        understand:       { en: "Catch the gist and key points",  uk: "Схопити суть і ключові моменти" },
        apply_controlled: { en: "Listen and notice with prompts", uk: "Слухати і помічати з підказками" },
        apply_free:       { en: "Follow without subtitles",       uk: "Слухати без субтитрів" },
        evaluate:         { en: "Check what I missed",            uk: "Перевірити, що пропустив" },
        create:           { en: "Engage live in a conversation",  uk: "Реагувати наживо в розмові" },
    },
    reading: {
        remember:         { en: "Skim and recognise structure",   uk: "Перегляд і впізнавання структури" },
        understand:       { en: "Understand the argument",        uk: "Зрозуміти аргумент" },
        apply_controlled: { en: "Read with guided questions",     uk: "Читання з питаннями" },
        apply_free:       { en: "Read independently",             uk: "Читати самостійно" },
        evaluate:         { en: "Find what I misunderstood",      uk: "Знайти, що зрозумів не так" },
        create:           { en: "Use the text in my work",        uk: "Використати текст у роботі" },
    },
    speaking: {
        remember:         { en: "Hear how it sounds first",       uk: "Спершу почути, як це звучить" },
        understand:       { en: "Understand what to say and when", uk: "Зрозуміти, що й коли казати" },
        apply_controlled: { en: "Rehearse phrases with guidance", uk: "Репетирувати фрази з підказками" },
        apply_free:       { en: "Speak freely without a script",  uk: "Говорити вільно, без скрипту" },
        evaluate:         { en: "Find what sounds unnatural",     uk: "Помітити, що звучить неприродно" },
        create:           { en: "Have a real conversation",       uk: "Провести реальну розмову" },
    },
    writing: {
        remember:         { en: "See examples of the genre",      uk: "Побачити приклади жанру" },
        understand:       { en: "Understand the moves",           uk: "Зрозуміти структуру ходів" },
        apply_controlled: { en: "Write with a template",          uk: "Писати за шаблоном" },
        apply_free:       { en: "Write on my own",                uk: "Писати самостійно" },
        evaluate:         { en: "Find weak spots in my draft",    uk: "Знайти слабкі місця в чернетці" },
        create:           { en: "Send it for real",               uk: "Надіслати по-справжньому" },
    },
    grammar: {
        remember:         { en: "See the structure in context",   uk: "Побачити структуру в контексті" },
        understand:       { en: "Understand when to use it",      uk: "Зрозуміти, коли вживати" },
        apply_controlled: { en: "Practise with controlled drills", uk: "Тренуватись на контрольованих вправах" },
        apply_free:       { en: "Use it in my own sentences",     uk: "Вживати у власних реченнях" },
        evaluate:         { en: "Spot my own mistakes",           uk: "Помітити свої помилки" },
        create:           { en: "Apply it in real writing/speech", uk: "Застосувати у листах/мовленні" },
    },
    translation: {
        remember:         { en: "See L1 ↔ L2 pairs",              uk: "Побачити L1 ↔ L2 пари" },
        understand:       { en: "Understand why they differ",     uk: "Зрозуміти, чому різниця" },
        apply_controlled: { en: "Translate with hints",           uk: "Перекладати з підказками" },
        apply_free:       { en: "Translate on my own",            uk: "Перекладати самостійно" },
        evaluate:         { en: "Find translation traps",         uk: "Помітити пастки перекладу" },
        create:           { en: "Translate something I'll use",   uk: "Перекласти те, що використаю" },
    },
    custom: {
        remember:         { en: "Discover the material",          uk: "Познайомитись із матеріалом" },
        understand:       { en: "Understand it in context",       uk: "Зрозуміти в контексті" },
        apply_controlled: { en: "Practise with support",          uk: "Практика з підтримкою" },
        apply_free:       { en: "Apply on my own",                uk: "Застосувати самостійно" },
        evaluate:         { en: "Check what's still weak",        uk: "Перевірити слабкі місця" },
        create:           { en: "Use it in a real situation",     uk: "Використати в реальній ситуації" },
    },
};

// Each activity has:
//   what — what it actually is (the AI-tool feature)
//   how  — how it serves English learning specifically
export const ACTIVITIES = [
    {
        id: "audio_retelling", glyph: "♪", tool: "notebooklm",
        labelEn: "Audio Overview (podcast)", labelUk: "Audio Overview (подкаст)",
        whatEn: "NotebookLM Studio generates an interactive AI podcast on your sources — you can even join live and ask questions.",
        whatUk: "NotebookLM Studio робить інтерактивний AI-подкаст за твоїми джерелами — можна підключитись наживо й питати.",
        howEn: "Listen with subtitles off, then retell using your own phrases. Strongest for listening + speaking.",
        howUk: "Слухай без субтитрів, потім перекажи своїми словами. Найкраще для аудіювання + говоріння.",
    },
    {
        id: "video_retelling", glyph: "▷", tool: "notebooklm",
        labelEn: "Video Overview (visual explainer)", labelUk: "Video Overview (відео-пояснення)",
        whatEn: "A narrated AI video that explains the topic with diagrams and on-screen text.",
        whatUk: "AI-відео з діаграмами та підписами, яке візуально пояснює тему.",
        howEn: "First watch without subtitles for gist; second pass with subtitles to notice phrases. Then explain back.",
        howUk: "Спершу без субтитрів — для суті; потім із субтитрами — помічаєш фрази. Потім поясни тему своїми словами.",
    },
    {
        id: "mind_map", glyph: "◯", tool: "notebooklm",
        labelEn: "Mind Map", labelUk: "Mind Map",
        whatEn: "Clickable concept map: central topic + branches with connected ideas, vocabulary, and sub-questions.",
        whatUk: "Клікабельна мапа концепту: центральна тема + гілки зі звʼязаними ідеями, лексикою, під-питаннями.",
        howEn: "Organise vocabulary by meaning groups; turn each branch into a 60-second speaking prompt.",
        howUk: "Групуй лексику за значенням; перетвори кожну гілку на 60-секундну тему для говоріння.",
    },
    {
        id: "flashcards", glyph: "▭", tool: "notebooklm",
        labelEn: "Flashcards (term · translation · example)", labelUk: "Flashcards (слово · переклад · приклад)",
        whatEn: "Auto-generated cards. Pick the format: term ↔ translation, term ↔ definition, or term ↔ example sentence with a gap.",
        whatUk: "Авто-картки. Обери формат: слово ↔ переклад, слово ↔ означення, або речення з пропуском.",
        howEn: "Active recall — front in your L1, back in English (or reverse). Best for vocabulary + collocations.",
        howUk: "Активне пригадування — перед українською, зворот англійською (або навпаки). Топ для лексики + колокацій.",
    },
    {
        id: "test", glyph: "?", tool: "notebooklm",
        labelEn: "Quiz / Test", labelUk: "Тест / Quiz",
        whatEn: "Auto-generated quiz — mix of multiple-choice and open questions tied to your sources.",
        whatUk: "Авто-тест — мікс з вибором відповіді й відкритих питань на матеріалі твоїх джерел.",
        howEn: "Take it after study with no notes (retrieval practice — Roediger). Identifies what hasn't stuck yet.",
        howUk: "Пиши без нотаток (retrieval practice — Roediger). Покаже, що ще не закріпилось.",
    },
    {
        id: "infographic", glyph: "▤", tool: "notebooklm",
        labelEn: "Infographic", labelUk: "Інфографіка",
        whatEn: "A single-page visual summary — vocabulary, structure, examples on one screen.",
        whatUk: "Одна сторінка візуального підсумку — лексика, структура, приклади на одному екрані.",
        howEn: "Pin to your desktop. Use as a 30-second 'before-the-meeting' refresher.",
        howUk: "Закріпи на робочому столі. Юзай як 30-секундне нагадування перед зустріччю.",
    },
    {
        id: "study_guide", glyph: "≡", tool: "notebooklm",
        labelEn: "Study Guide", labelUk: "Study Guide",
        whatEn: "Structured guide (Q&A or chapter format) — your personal textbook on the topic.",
        whatUk: "Структурований посібник (Q&A або розділи) — твій персональний підручник з теми.",
        howEn: "Read-through then close it and try to reproduce key phrases out loud.",
        howUk: "Прочитай, закрий і спробуй вголос відтворити ключові фрази.",
    },
    {
        id: "presentation", glyph: "▥", tool: "notebooklm",
        labelEn: "Presentation", labelUk: "Презентація",
        whatEn: "Slide deck explaining the topic — built from your sources.",
        whatUk: "Слайд-презентація теми — за твоїми джерелами.",
        howEn: "Present it aloud as if pitching to a colleague. Record yourself, then ask AI to grade tone & clarity.",
        howUk: "Презентуй уголос, наче колезі. Запиши себе, попроси AI оцінити тон і ясність.",
    },
    {
        id: "roleplay", glyph: "▲", tool: "chatgpt_gemini",
        labelEn: "Roleplay / Dialogue", labelUk: "Роуплей / діалог",
        whatEn: "AI plays one role (client, manager, customer), you play another. Real-life business scenarios.",
        whatUk: "AI грає одну роль (клієнт, менеджер, замовник), ти — іншу. Реальні бізнес-сценарії.",
        howEn: "Paste target phrases from NotebookLM so AI uses ONLY them. Best for Speaking + Business English.",
        howUk: "Встав цільові фрази з NotebookLM, щоб AI вживав ТІЛЬКИ їх. Топ для Speaking + Business English.",
    },
    {
        id: "speak_voice", glyph: "✦", tool: "chatgpt_gemini",
        labelEn: "Voice chat (live)", labelUk: "Голосовий чат (наживо)",
        whatEn: "Real-time voice conversation with ChatGPT Voice or Gemini Live — speak, AI replies in audio.",
        whatUk: "Голосова розмова з ChatGPT Voice або Gemini Live — говориш, AI відповідає голосом.",
        howEn: "Train pronunciation + fluency + live reaction. Ask AI to gently recast your errors.",
        howUk: "Тренуй вимову + побіжність + живу реакцію. Попроси AI мʼяко переформульовувати помилки.",
    },
    {
        id: "write_feedback", glyph: "✎", tool: "chatgpt_gemini",
        labelEn: "Write + feedback", labelUk: "Письмо + фідбек",
        whatEn: "Write a short text (email, paragraph, post) — AI gives line-by-line corrections + clean rewrite.",
        whatUk: "Напиши короткий текст (лист, абзац, пост) — AI дає правки рядок-за-рядком + чисту переписану версію.",
        howEn: "Best for emails, business writing, posts. Compare your version vs. clean rewrite — note 3 patterns.",
        howUk: "Топ для листів, бізнес-письма, постів. Порівняй свій варіант з чистим — виділи 3 патерни.",
    },
    {
        id: "claude_chat", glyph: "✶", tool: "claude",
        labelEn: "Claude — tasks & explanations", labelUk: "Claude — завдання й пояснення",
        whatEn: "Claude.ai chat — strong at nuanced grammar explanations, structured drills, and pedagogical scaffolding.",
        whatUk: "Чат Claude.ai — сильний у нюансах граматики, структурованих вправах і педагогічному скаффолдингу.",
        howEn: "Ask Claude to teach in steps, with examples + tests + answer keys. Great for grammar deep-dives.",
        howUk: "Попроси Claude навчати поетапно — з прикладами, тестами й відповідями. Топ для глибокого розбору граматики.",
    },
];

// Student-voice problems for each Bloom stage — recognisable without knowing the taxonomy.
export const BLOOM_SYMPTOMS = {
    remember: {
        en: "\"I haven't met this topic yet.\" · \"I want to see and hear what it looks like first.\"",
        uk: "«ще не знайомий з темою» · «хочу спершу побачити й почути, як це звучить»",
    },
    understand: {
        en: "\"I see the words but don't know when to use them.\" · \"I get the rule but the logic isn't clear.\"",
        uk: "«бачу слова, але не знаю, коли їх вживати» · «правило знаю, але логіка незрозуміла»",
    },
    apply_controlled: {
        en: "\"I can do it with prompts but freeze without a template.\" · \"I forget without support.\"",
        uk: "«можу за шаблоном, але без нього губуся» · «без підказки забуваю»",
    },
    apply_free: {
        en: "\"I know the words but I can't speak.\" · \"Need to move from theory to actual use.\"",
        uk: "«знаю слова, але не можу говорити» · «треба перейти від теорії до практики»",
    },
    evaluate: {
        en: "\"I keep forgetting.\" · \"I don't notice my own mistakes.\" · \"Something sounds off but I can't tell what.\"",
        uk: "«постійно забуваю» · «не помічаю своїх помилок» · «щось звучить не так, але не знаю що»",
    },
    create: {
        en: "\"I want to use it in a real meeting/email tomorrow.\" · \"Ready for the real situation.\"",
        uk: "«хочу використати в реальній зустрічі/листі завтра» · «готовий до справжньої ситуації»",
    },
};

// Recommendations: aspect+stage -> array of activity ids highlighted in green.
export const RECOMMENDATIONS = {
    vocabulary: {
        remember: ["flashcards", "audio_retelling"],
        understand: ["audio_retelling", "mind_map", "claude_chat"],
        apply_controlled: ["flashcards", "claude_chat", "write_feedback"],
        apply_free: ["roleplay", "write_feedback"],
        evaluate: ["test", "claude_chat"],
        create: ["roleplay", "speak_voice"],
    },
    listening: {
        remember: ["audio_retelling", "video_retelling"],
        understand: ["audio_retelling", "video_retelling", "mind_map"],
        apply_controlled: ["audio_retelling", "claude_chat"],
        apply_free: ["video_retelling", "speak_voice"],
        evaluate: ["test", "claude_chat"],
        create: ["speak_voice", "roleplay"],
    },
    reading: {
        remember: ["mind_map", "study_guide"],
        understand: ["study_guide", "mind_map", "claude_chat"],
        apply_controlled: ["claude_chat", "test"],
        apply_free: ["write_feedback", "presentation"],
        evaluate: ["test", "claude_chat"],
        create: ["presentation", "infographic"],
    },
    speaking: {
        remember: ["audio_retelling", "video_retelling"],
        understand: ["video_retelling", "claude_chat"],
        apply_controlled: ["roleplay", "claude_chat"],
        apply_free: ["speak_voice", "roleplay"],
        evaluate: ["roleplay", "speak_voice"],
        create: ["speak_voice", "roleplay"],
    },
    writing: {
        remember: ["study_guide", "claude_chat"],
        understand: ["study_guide", "claude_chat"],
        apply_controlled: ["write_feedback", "claude_chat"],
        apply_free: ["write_feedback", "presentation"],
        evaluate: ["write_feedback", "claude_chat"],
        create: ["write_feedback", "presentation"],
    },
    grammar: {
        remember: ["claude_chat", "flashcards"],
        understand: ["claude_chat", "study_guide"],
        apply_controlled: ["claude_chat", "test"],
        apply_free: ["write_feedback", "roleplay"],
        evaluate: ["test", "claude_chat"],
        create: ["write_feedback", "speak_voice"],
    },
    translation: {
        remember: ["flashcards", "claude_chat"],
        understand: ["claude_chat", "study_guide"],
        apply_controlled: ["claude_chat", "write_feedback"],
        apply_free: ["write_feedback", "claude_chat"],
        evaluate: ["claude_chat", "test"],
        create: ["write_feedback", "presentation"],
    },
    custom: {
        remember: ["claude_chat"],
        understand: ["claude_chat", "study_guide"],
        apply_controlled: ["claude_chat", "write_feedback"],
        apply_free: ["claude_chat", "speak_voice"],
        evaluate: ["claude_chat", "test"],
        create: ["claude_chat", "presentation"],
    },
};
