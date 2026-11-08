# AGENT.md — EchoLạc

EchoLạc is a mobile-first web app (installable PWA). Vietnamese high-school students and Da Nang / Hoi An tourism workers use it to practise speaking English with an AI character in local-culture scenarios. The app corrects their pronunciation and grammar and tracks progress on a radar chart with four criteria.

**The PRD is the source of truth for features:** [EchoLac_PRD.md](EchoLac_PRD.md). Requirement IDs (R-01, T-04, E-05, X-03, …) come from it. Cite them in commit messages and in code comments where a rule would otherwise look arbitrary. The PRD decides *what* to build; this file decides *how*.

## The loop

Every feature serves **the loop**: Roleplay → Tutor → Error Radar → "Practise this" → back to Roleplay (PRD §4.2). Build in this order:

1. One scenario through the full loop, using real speech and LLM services.
2. The rest of the Must items in PRD §3. Polish 2–3 scenarios before adding more.
3. Should items, then Could items. Items in the Won't row (PRD §3) stay out of the codebase: leaderboards, payments, native apps, live tutors.

A feature is **done** when all of these hold:

- Its PRD acceptance criterion passes.
- It works at 360px width and on desktop.
- It works in both Vietnamese and English.
- It has loading, empty and error states.
- Lint, typecheck and tests are green.

## Stack

| Layer | Choice |
| :-- | :-- |
| App | Next.js (App Router) + TypeScript (strict) + Tailwind CSS, PWA manifest + service worker |
| Charts | Recharts (radar E-02, progress lines E-06) |
| Auth + DB + storage | Supabase: Postgres with row-level security, email + Google sign-in, class codes (X-01), private audio bucket |
| LLM | Claude API: `claude-haiku-5-5` for live character turns (latency), `claude-sonnet-5-5` for grammar feedback, error classification, tutor explanations and session summaries |
| Speech | Azure AI Speech for ASR with word timings, pronunciation assessment at phoneme and word level, and neural TTS (en-GB, en-US, en-IN, en-AU) |
| Recording | Browser MediaRecorder API, push-to-talk |
| Spaced repetition | `ts-fsrs` (T-06) |
| i18n | `next-intl`, messages in `messages/vi.json` and `messages/en.json` |
| Validation | `zod` at every trust boundary: request bodies, LLM JSON output, speech-service responses |
| Tests | Vitest for `lib/`; Playwright smoke test of the loop |

Suggested layout:

```
app/(auth)/            sign-in, sign-up, class code
app/(app)/home|roleplay|tutor|radar|profile/
app/api/               route handlers (LLM, speech token, scoring)
components/ui/         design-system primitives
components/tutor-companion/   the persistent AI Tutor panel (X-04)
lib/scoring/           pure scoring functions + constants
lib/errors/            taxonomy enum, error-item lifecycle, SRS
lib/ai/                prompts, schemas, model calls
content/scenarios/<slug>.json   scenario, fact sheet, target vocab
messages/              vi.json, en.json
```

## Domain rules

- **Error item**: created automatically (R-10) when a word's pronunciation accuracy falls below `PRON_THRESHOLD` (start at 60) or a sentence has a grammar issue. It carries its category, the word or sentence, and the source session.
- **Category**: always one value of a closed enum matching the taxonomy in PRD §6: `final_consonant`, `s_ed_ending`, `cluster`, `th`, `sibilant`, `vowel_length`, `word_stress`, `rhythm`. Grammar issues get their own small enum (`tense`, `agreement`, `article`, `word_order`, `other`).
- **Mastery** (T-05): a score of 80 or more on two distinct calendar days in `Asia/Ho_Chi_Minh` time. Mastered items then return through FSRS review (T-06).
- **Scoring** (PRD §7):
  - Each criterion is the mean of its sub-criteria.
  - The radar shows the rolling average of the last 5 sessions.
  - Tutor scores feed Pronunciation at lower weight (`TUTOR_WEIGHT`, start at 0.3).
- **CEFR band** (E-04): always labelled as an estimate in the UI, in both languages.
- **Low-confidence speech recognition**: show a "didn't catch that, try again" result and keep the score out of the record (PRD §12). A learner is never blamed for the recogniser's mistake.
- Every threshold and weight lives in `lib/scoring/constants.ts` with a PRD reference beside it. The pilot will recalibrate them.
- Scoring, mastery, CEFR mapping and SRS scheduling are pure functions with unit tests. This is the code the judges will question (objective O4).

## AI behaviour

- **Character prompt** = persona + learner CEFR level + the scenario's **fact sheet** + target vocabulary.
- Facts about landmarks, dates and history come only from the fact sheet. For anything the sheet doesn't cover, the character says it isn't sure (R-04).
- Characters stay on the scenario topic, keep language suitable for under-18 learners, and politely steer unrelated requests back to the scenario while staying in character (PRD §9).
- **Replies**: 1–3 short sentences at the learner's level. Each reply ends with a question so the learner always has something to answer. A session is 6–10 turns.
- **Latency** (target: first audio within about 3 s):
  1. Stream the LLM text.
  2. Show subtitles as soon as text arrives (R-07).
  3. Start TTS sentence by sentence.
- Speech rate (R-05) and accent (R-06) are applied through TTS settings. The prompt stays the same.
- **Structured output**: grammar feedback, error classification and the session summary come back as JSON through tool use, are validated with zod, and only then stored.
- **Fact sheets** live in `content/scenarios/`. Each has a `verified` flag that a teacher sets. Production shows only scenarios with `verified: true`.
- **AI Tutor companion**: one component and one context (learner level, recent error items) shared by all tabs. Its role on each tab is in PRD §4.3.

## Privacy and safety

Most users are minors and the app records their voices. Design for that from the start.

- **Secrets:** API keys (Claude, Azure Speech, Supabase service role) live only in server-side environment variables, listed by name in `.env.example`. A real key never appears in `index.html`, `app.js`, `styles.css`, AGENT.md, a commit, a screenshot, a log or a chat message.
  - Static hosting (GitHub Pages, a Netlify drop) is public. Code that calls Claude or Azure runs in a server function, and the browser calls that function.
  - The browser gets short-lived Azure speech tokens from the server. The only key allowed in browser code is the Supabase `anon` key, with row-level security on.
  - Before every share or push, search the project for key patterns (`sk-ant-`, `AZURE`, `service_role`, `Bearer `).
  - If a key is ever exposed, revoke it in the provider's console first, then replace it. Deleting the file is not enough.
  - Set a monthly spend limit on each provider key (PRD §8.4 cost control).
- Store transcripts and scores. Store raw audio in a private bucket and delete it after 30 days, unless the learner's `keep_audio_for_research` consent flag is set.
- RLS on every table: learners read and write only their own rows. Teacher access (X-05) is scoped to their own class.
- No analytics or advertising SDKs. Research exports are anonymised.
- Enforce the daily AI-minute cap per learner on the server (PRD §8.4).
- Before the browser asks for the microphone, show a short vi/en screen explaining why the app needs it.

## Bilingual UI (X-03)

- Every user-facing string lives in `messages/*.json`. Vietnamese is the default.
- Practice content (what the learner hears and says) is always English.
- Instructions, feedback explanations and Tutor explanations follow the interface-language toggle.

## Design system

**References:** the 22 phone mockups in `c:\Users\HI\Desktop\Nam\Design\`. They come from a generic study app, so take the visual language from them and replace the content with EchoLạc's.

**Logo:** a gold Đông Sơn Lạc bird flying around a bronze globe. The source is `echolac-logo.html`, and the exported files are `assets/logo.svg` (in-app use) and `assets/logo-32.png` / `logo-192.png` / `logo-512.png` (favicon, home-screen icon). It appears on the auth screens, the Welcome screen, the browser tab and as the AI Tutor avatar. The name is always written **EchoLạc**, with the Vietnamese "ạ". In file names and code identifiers use `EchoLac` or `echolac`. The wordmark uses the logo's own colours: "Echo" in bronze `#6B3F1D`, "Lạc" in gold `#C98A1B`. Use these two colours only for the logo and wordmark, not for UI. Re-export after editing the logo by running `logoSVG('x', C.bronze, C.gold)` inside `echolac-logo.html`.

**Colour reference:** `Design\Thiết kế chưa có tên.png`. It is the Home screen recoloured in a warm cream-and-taupe palette, and it overrides the blue of the other mockups. Take layout and components from the 22 mockups and colour from this one.

**Mood:** calm, soft, encouraging, warm like lantern light on old Hoi An walls. A safe place where a nervous 16-year-old dares to speak out loud.

### Tokens

| Token | Value | Use |
| :-- | :-- | :-- |
| `bg-gradient` | `#FFF4E2` → `#FEF6E8` → `#FCF9F3` → `#F1EFEB`, top to bottom | Every screen background |
| `taupe` | `#726958` (`--navy` in `styles.css`) | Headings, primary text, bottom nav, "Lv" badge, skill rings, user chat bubble, active chips and tabs |
| `primary` | `#9C8466` | Progress bars, play buttons, links |
| `primary-soft` | `#F3E6D0` | Soft buttons, highlight tints |
| `cream` | `#FFF4E1` | Skill cards, the "today's practice" hero card, the "Continue" card |
| `surface` | `rgba(255,255,255,0.88)` + `backdrop-blur` | White cards (streak, calendar), inputs, icon buttons |
| `today` | `#F9E9CF` | Today's date in the calendar |
| `text-muted` | `#6E6453` | Secondary text. Darker than the mockup's `#9C917D`, so it meets WCAG AA on cream |
| `text-faint` | `#776C5B` | Day labels, timestamps, placeholders. Still real text, so it must also reach 4.5:1 |
| `line` | `#EFE8DC` | Dividers, empty progress tracks |
| `success` | `#1FAF6E` | Valid input, mastered items, earned achievements (on a `#E6F8EE` tint) |
| `lantern` | `#F59E2B` → `#EF5B2A` | **Signature warm glow**, after Hội An's lanterns: streak flames, XP, celebrations, "needs practice" highlights |
| `gold` | `#F5B400` | XP and level chips |
| `danger` | `#E5484D` | System errors only |

- **Font:** Lexend from Google Fonts, `latin` + `vietnamese` subsets. Headings bold in taupe. Body text is at least 15px on phones and never below 13px.
- **Shape:** cards use a 24px radius. Inputs and buttons use 16px or a full pill. Icon buttons are 44px white circles.
- **Shadow:** soft and taupe-tinted, `0 8px 24px rgba(114,105,88,0.08)`.
- **Primary button:** taupe gradient `#8E8473` → `#7A705F` → `#5E5647`, full width, 56px tall. While the action is unavailable it shows a muted warm grey (`#E6E1D8`).
- **Charts:** use `success`, `lantern-a` (`#F59E2B`), `taupe` and a muted teal `#5E9EA0` for series that must be told apart. Taupe and `primary` are too close to sit side by side.
- **Off-palette exceptions:** the scenario cards keep their pastel gradients, since they act as illustrations. Stat-tile icon badges use gold, orange, caramel (`#E3B47A` → `#C08A4A`) and green.

### Place themes (X-06)

The cream-and-taupe palette above is the default theme (`other`, "Nơi khác"). Picking a place in onboarding step 2, or later in Profile → Settings, repaints the whole app.

**One source:** every theme lives in the `THEMES` object in `app.js`. It holds the colour tokens `c`, the frame pattern `frame`, an optional page `pattern`, the landmark `land()` and the ambient effect `fx()`.
- At start-up, `installThemes()` writes one `:root[data-theme="<id>"]` block per entry. There are no per-theme colour blocks in `styles.css`.
- `applyTheme(id)` sets `data-theme` on `<html>`. The colour tokens are registered with `@property`, so they animate between themes. Scenery, frame and effect crossfade over the same **400 ms**.

| id | Place | Scenery (`land`) | Main `--navy` | `--primary` + `--accent` | Frame pattern | Ambient effect (`fx`) |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| `danang` | Đà Nẵng | Cầu Rồng arches, sun, sea | `#1F4E79` | sea blue `#2E8BC7` + dragon gold `#E2B23A` | blue / gold diagonal stripes | Moving sea waves |
| `hoian` | Hội An | Old-town roofs with lanterns | `#6E3410` | turmeric `#D99A16` + lantern red `#C8372D` | red / yellow lantern dots | Lantern garland swaying at the top |
| `hue` | Huế | Ngọ Môn gate, river | `#4B2A6B` | Huế purple `#8C5CC0` + royal gold `#C9A227` | gold lattice on purple | Faint royal pattern + gentle river waves |
| `hanoi` | Hà Nội | Thê Húc bridge, Tháp Rùa | `#2F4F2A` | moss `#6B8E45` + vermilion `#C0392B` | red / moss stripes | Lake ripples |
| `halong` | Hạ Long | Limestone islands, sea | `#0F5B57` | emerald `#17A08F` + sail red `#C8553D` | emerald gradient | Sailboats drifting across |
| `sapa` | Sa Pa | Rice terraces | `#3B5320` | rice green `#7FA637` + cloud white | green / white terrace bands | Clouds drifting sideways |
| `dalat` | Đà Lạt | Pine hills | `#2F4A40` | cherry pink `#D46A93` + pine `#2F6B4F` | pink dots on pine | Falling petals + light mist |
| `hcm` | TP. Hồ Chí Minh | Skyline, Bitexco, blinking windows | `#2B1F4A` | neon orange `#FF7A2F` + neon purple `#B05CFF` | neon dashes | Blinking city lights |
| `other` | Nơi khác | none | `#726958` | taupe `#9C8466` + logo gold `#C98A1B` | none | none |

Rules:
- **Colours:** use the tokens (`var(--navy)`, `var(--primary)`, `var(--accent)`, `var(--tint)`, …) and `color-mix(in srgb, var(--x) N%, transparent)` for transparent shades. A hard-coded palette hex breaks theming. Only the semantic colours stay fixed: success, lantern streak, gold, danger and the logo wordmark.
- **Text on colour:** white text and icons sit on `--navy` or `--navy-2`, never on `--primary`. `--primary` is too light in several themes.
- **A new place** = one new entry in `THEMES`: `icon`, `name`, `scene`, `c`, `frame`, `land()`, `fx()`. Then open the app with `?test`: `selfTest()` asserts that every theme keeps text contrast ≥ 4.5:1 (navy/muted/faint on `--bg1`, muted on cards, faint on white, white on `--navy-2`).
- **Layers:**
  - `.bg` is absolute and spans the **whole page height**, under every card: gradient, `pattern`, `frame` and `land`. The landmark sits at the end of the page.
  - `.fx-layer` is fixed to the screen and holds the effect.
  - Both use `z-index: -1`, so the frame and scenery never draw over content.
- **Motion:** effects animate only `transform` and `opacity`, so scrolling stays smooth. Under `prefers-reduced-motion` they stop and only the colours change.
- **Gesture:** picking a place fires a short colour "burst" from the tapped card (`.burst`).

### Onboarding (X-01, X-06)

1. **Step 1 · `#signup` "Tạo tài khoản".** Fields: name, Gmail (must end in `@gmail.com`), date of birth, gender (radio group), terms. Under 18, a second, required "parent or guardian agrees" checkbox appears. A valid submit saves the account and goes to step 2.
2. **Step 2 · `#place` "Nơi gắn bó với bạn".**
   - **Toggle:** Quê hương / Điểm đến (`role="radiogroup"`, arrow keys). The subtitle changes with it.
   - **Place grid:** 9 cards (`<button aria-pressed>`), with a live theme preview on tap and a "Giao diện: …" line below.
   - **Navigation:** Back returns to step 1 with everything kept. **Bỏ qua** uses the default theme. **Bắt đầu hành trình**, enabled only once a place is picked, saves and opens Home.
3. **Saved data:** `{ placeType: 'hometown' | 'destination', placeId, themeId }` on the account (`S.user`). The theme id is also kept in `lt:place`, so it applies again on reload. A preview is saved only when the learner presses a step-2 button.
- A progress indicator (`steps(n)`, "Bước 1/2" / "Bước 2/2") sits at the top of both steps.

### Splash (cold start)

- **Where it lives:** `#splash` in `index.html` (markup), the `/* Splash */` block at the end of `styles.css`, and `splash()` in `app.js`. Delete all three to remove it.
- **Colours:** logo colours only: `--echo-cream #FFF4E1`, `--echo-bronze #6B3F1D`, `--echo-gold #C98A1B`, plus their `rgba()` tints. Theme colours never apply here.
- **Timing:** it stays at least 2.4s (1.8s with reduced motion), waits for fonts, and never stays past 4s.
- **Exit:** the first screen renders underneath, then the splash fades out (400ms), so that screen's own entrance plays in view.
- **Reduced motion:** logo and text fade only. No particles, rotation, sheen or pulse.

### Patterns from the references and where they go

| Reference pattern | EchoLạc screen |
| :-- | :-- |
| Floating taupe pill bottom nav; the active tab is a white circle | 5 tabs: **Home, Roleplay, Tutor, Radar, Profile** |
| Auth form: label above the field, icon at the start, inline green check, terms checkbox, gradient CTA enabled once the form is valid | Onboarding step 1 (see **Onboarding** above). **Sign-in:** email + password or class code. Social sign-in is Google only, and a new Google user goes to step 2 |
| "Welcome!" success screen with a check badge and 3 feature rows | Not used. Onboarding goes straight from step 2 to Home |
| Home: avatar + greeting + level/XP chip, hero progress card with an arrow CTA, daily streak row of flame circles, 2×2 ring cards | Hero card = today's "Practise this" recommendation. Ring cards = the 4 criteria. Streak row as in the reference |
| Journey path: winding line, numbered nodes, padlocked locked nodes, "Your Progress" summary card | **Landmark journey**: scenarios as stops across Da Nang and Hoi An; streaks unlock new stops (T-07) |
| Search bar + filter chips + image cards with a duration badge | Scenario library, filtered by landmark / food / hospitality / difficulty (R-01) |
| Course details: header card with progress, "Continue Learning" card, expandable unit list | Scenario detail + vocabulary prep list: word, IPA, play button, Vietnamese meaning (R-02) |
| Lesson screen: media header, summary card with tags, soft full-width CTA | Scenario intro: landmark photo, short fact summary, vocab tags, "Start talking" |
| AI chat: bot avatar + white bubble on the left, taupe bubble on the right, suggestion chips, 2×2 quick-start cards, disclaimer line | Roleplay conversation and the AI Tutor panel. Large push-to-talk mic as the main input, with text input as a fallback. Subtitle toggle, "Help me" chip (R-09), small amber dot on a user bubble that has grammar feedback (R-08) |
| Profile: 2×2 stat tiles with coloured icon badges; achievements list (earned = green tint, locked = muted) | Profile: streak, minutes practised, sessions, items mastered; achievements tied to milestones |
| Leaderboard podium | Not used (Won't in PRD §3) |

The references have no screens for **Tutor** or **Radar**. Build them in the same visual language:

- **Tutor card:** the word in large type, IPA beneath it with the faulty phoneme highlighted in `lantern`, a "Listen" button, a large record button, and an animated 0–100 score ring. The AI explanation appears as a chat bubble below.
- **Radar:** a white card holding the chart.
  - Current scores: taupe polygon at 18% fill. Previous period: dashed outline.
  - Tapping an axis opens a bottom sheet with that axis's sub-criteria (E-03).
  - Each weak criterion gets its own "Practise this" button (E-05).
  - The CEFR estimate chip sits below the chart.

### Friendly UX

- Feedback opens with what went well, then gives exactly one thing to fix. Errors are framed as "words to practise", shown in warm `lantern`; green marks success.
- One primary action per screen.
- Recording is always visible as one of four states: idle → listening (pulsing ring) → processing → scored.
- Loading uses skeleton cards. Each empty state names the next step, e.g. empty Tutor queue: "Nothing to fix yet — go have a conversation!"
- Motion is gentle (150–250 ms, ease-out). Milestones get a short lantern-glow celebration. Honour `prefers-reduced-motion`.
- Touch targets are at least 44px. Text contrast meets WCAG AA. Every icon-only button has an `aria-label` in both languages.
- Illustrations: glossy 3D-style icons like those in the references, showing local subjects (lantern, Dragon Bridge, bowl of mì Quảng, Japanese Covered Bridge). Landmark photos must be licensed, with attribution stored in the scenario's content file.
