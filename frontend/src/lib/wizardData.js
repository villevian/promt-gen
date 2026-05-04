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

export const ACTIVITIES = [
    { id: "audio_retelling", glyph: "♪", labelEn: "Audio retelling", labelUk: "Аудіо переказ", tool: "notebooklm" },
    { id: "video_retelling", glyph: "▷", labelEn: "Video retelling", labelUk: "Відео переказ", tool: "notebooklm" },
    { id: "mind_map",        glyph: "◯", labelEn: "Mind map",        labelUk: "Mind map",      tool: "notebooklm" },
    { id: "flashcards",      glyph: "▭", labelEn: "Flashcards",      labelUk: "Flashcards",    tool: "notebooklm" },
    { id: "test",            glyph: "?", labelEn: "Test / Quiz",     labelUk: "Тест",           tool: "notebooklm" },
    { id: "infographic",     glyph: "▤", labelEn: "Infographic",     labelUk: "Інфографіка",   tool: "notebooklm" },
    { id: "study_guide",     glyph: "≡", labelEn: "Study guide",     labelUk: "Study guide",   tool: "notebooklm" },
    { id: "presentation",    glyph: "▥", labelEn: "Presentation",    labelUk: "Презентація",   tool: "notebooklm" },
    { id: "roleplay",        glyph: "▲", labelEn: "Roleplay / dialogue", labelUk: "Роуплей / діалог", tool: "chatgpt_gemini" },
    { id: "speak_voice",     glyph: "✦", labelEn: "Speak / voice chat", labelUk: "Голосовий чат",     tool: "chatgpt_gemini" },
    { id: "write_feedback",  glyph: "✎", labelEn: "Write + feedback",   labelUk: "Письмо + фідбек",  tool: "chatgpt_gemini" },
    { id: "claude_chat",     glyph: "✶", labelEn: "Claude — tasks & explanations", labelUk: "Claude — завдання й пояснення", tool: "claude" },
];

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
