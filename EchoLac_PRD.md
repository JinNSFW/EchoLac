**PRODUCT REQUIREMENTS DOCUMENT**

**EchoLạc**

*An AI-powered English speaking platform for telling the story of our hometown*

*Slogan: “Nói tiếng Anh tự tin, vươn ra thế giới” (Speak English with confidence, reach the world). See Section 1.4 for the name and logo.*

| Item | Detail |
| :---- | :---- |
| Document version | 1.0 (competition submission draft) |
| Date | 26 October 2026 |
| Submission deadline | 21:00, 28 October 2026 |
| Idea pitch | 30 October 2026 |
| Context | National-level science and engineering research competition |
| Pilot site | Phan Chau Trinh High School, Da Nang |
| Team / authors | \[To be completed by the team\] |
| Supervisor | \[To be completed by the team\] |

# **1\. Purpose and Context**

## **1.1 Problem Statement**

Many Vietnamese high school students learn English mainly through grammar, reading and written exam practice. They rarely get the chance to speak with fluent speakers, so they lack confidence even when their vocabulary and grammar knowledge are adequate. Pronunciation errors typical of Vietnamese speakers, such as dropped final consonants, are rarely corrected individually because one teacher cannot listen to every student.

At the same time, Da Nang and Hoi An welcome large numbers of international visitors. Local students and tourism workers are well placed to introduce their hometown’s culture and landmarks, yet most general-purpose English apps teach generic content (airports, offices, Western restaurants) rather than the conversations they actually need to have.

## **1.2 Product Vision**

A web-based learning platform where learners practise speaking English in realistic local situations with an AI conversation partner, receive personalised correction of their pronunciation and grammar, and see their progress clearly, using content rooted in Vietnamese culture and the landmarks of Da Nang and Hoi An.

## **1.3 Product Objectives**

The following objectives are proposed so that the project has measurable outcomes the judges can evaluate. Targets in Section 10 are proposals to be confirmed after the pilot design is finalised.

| ID | Objective | How it is measured |
| :---- | :---- | :---- |
| O1 | Increase learners’ speaking confidence in everyday and tourism conversations. | Pre/post self-confidence questionnaire (5-point Likert scale). |
| O2 | Reduce pronunciation errors that are typical of Vietnamese speakers. | Change in pronunciation score on items logged in the Tutor module. |
| O3 | Enable learners to introduce local culture and landmarks in English. | Teacher-rated storytelling task before and after the pilot. |
| O4 | Demonstrate that AI scoring is reliable enough to guide learners. | Agreement between AI scores and human teacher ratings. |
| O5 | Sustain regular voluntary practice. | Weekly active learners, sessions per learner, streak length. |

## **1.4 Product Name and Logo**

**Final name: EchoLạc.** “Echo” is the learner’s voice: listening, repeating and being heard, the core of speaking practice. “Lạc” is the Lạc bird of the Đông Sơn bronze drums, a symbol of the Lạc Việt ancestors and of Vietnamese cultural identity. Together they mean a Vietnamese voice that carries out into the world.

**Logo:** a Đông Sơn Lạc bird in gold (`#C98A1B`) flying around a bronze globe (`#6B3F1D`), on a cream background (`#FFF4E1`). The wordmark sets “Echo” in bronze and “Lạc” in gold. The source file is `echolac-logo.html`, and the exported app files are in `assets/logo.svg` and `assets/logo-*.png`.

Names considered earlier:

| Name | Idea behind it |
| :---- | :---- |
| LanternTalk (earlier working name) | Hoi An’s lanterns as a symbol of local culture; easy for foreigners to say and remember. |
| HeriTalk | “Heritage” \+ “talk”: speaking about heritage. |
| SpeakQuê | “Quê” means hometown in Vietnamese; bilingual and memorable for local users. |
| Hometown Voice | Plain English, directly states the mission. |

## **1.5 Scientific Contribution and Novelty**

For a national-level science and engineering competition, the project’s contribution goes beyond assembling existing AI services. The points below are the ones the team should emphasise to the judges:

* **Closed-loop remediation pipeline.** Errors made in free conversation are captured automatically and turned into targeted pronunciation exercises, whose results feed a diagnostic profile that in turn recommends the next practice session. Most apps treat conversation and pronunciation drills as separate tools.

* **Vietnamese-learner error taxonomy.** The pronunciation and grammar feedback is organised around error patterns specific to Vietnamese speakers (Section 6\) rather than generic scores.

* **Culturally grounded content.** Scenarios are built on verified information about local landmarks, food and traditions, so learners practise the conversations they will really have.

* **Measured validity.** The AI scores are compared against human teacher ratings, and learning gains are measured in a pilot study (Sections 7.4 and 10).

# **2\. Target Users**

## **2.1 User Groups**

| Group | Description | Main need |
| :---- | :---- | :---- |
| Primary: high school students | Students aged roughly 15–18, pilot at Phan Chau Trinh High School. Beginner to intermediate English. Struggle with speaking confidence and have no native-speaker practice environment. | A safe, private space to practise speaking without fear of being judged, with clear guidance on what to fix. |
| Extended: local tourism workers | Homestay staff and local vendors in Da Nang and Hoi An. | Short, practical conversations they can use with guests the same day. |
| Supporting: English teachers | Teachers at the pilot school who supervise students and help validate scoring. | A view of class progress and common errors (later phase). |

## **2.2 Personas**

**Persona A – Lan, 16, Grade 11 student.** Lan scores well on written English tests but freezes when a foreign tourist asks her a question at the Dragon Bridge. She wants to practise at home in the evening, on her phone, for 10–15 minutes at a time. She often drops final sounds (“nice” becomes “nai”) without noticing.

**Persona B – Minh, 34, homestay owner in Hoi An.** Minh speaks basic English learned on the job. He wants to explain check-in rules, recommend local food such as cao lầu, and tell guests the history of the Japanese Covered Bridge. He has little time and needs practical phrases, not grammar lessons.

## **2.3 Proficiency Level and Learning Goal**

* **Level:** beginner to intermediate, approximately CEFR A1 to B1.

* **Goal:** confident everyday conversation, and the ability to introduce and tell stories about hometown culture and landmarks to international visitors.

* **Interface language:** English practice content with a Vietnamese/English toggle for instructions and explanations, since beginners may not understand feedback written only in English.

# **3\. Scope and Priorities**

Priorities use the MoSCoW method: Must (required for the competition prototype), Should (important, build if time allows), Could (extended features for a later phase), Won’t (explicitly out of scope for this version).

| Priority | Features |
| :---- | :---- |
| Must (MVP) | Scenario cards (at least 8 local scenarios); vocabulary preparation; two-way voice conversation with AI; speech-rate setting; real-time subtitles; grammar feedback; automatic error logging into Tutor; pronunciation scoring with native sample audio; 4-criteria radar chart; “Practise this” link from radar back to practice; basic learner accounts. |
| Should | Accent selection (British, American, Indian, Australian); phoneme-level error breakdown with Vietnamese explanations; spaced-repetition review of error items; practice streaks; progress history over time; placement test at onboarding. |
| Could | Camera-based cultural learning at supported landmarks (Section 5.5); learner avatars inside scenarios; unlockable conversation characters as rewards; teacher dashboard; lightweight offline mode. |
| Won’t (this version) | Native iOS/Android apps; live human tutors; payments; social features such as leaderboards between strangers; languages other than English. |

*Recommendation: given the submission deadline, the team should demonstrate the full loop (Roleplay → Tutor → Radar → back to Roleplay) on two or three polished scenarios rather than many half-finished features. The loop is the project’s main idea, and judges will want to see it work end to end.*

# **4\. System Overview**

## **4.1 The Three Modules**

| Module | Vietnamese name | Role in the loop |
| :---- | :---- | :---- |
| Tab 1 – Roleplay | Nhập vai & Trò chuyện | Where learners practise freely and where errors are detected. |
| Tab 2 – Tutor | Gia sư phát âm | Where detected errors are corrected through focused repetition. |
| Tab 3 – Error Radar | Bản đồ lỗi / Biểu đồ mạng nhện | Where progress is diagnosed and the next practice is recommended. |

## **4.2 Closed-Loop Learning Flow**

1. The learner picks a scenario card in Roleplay (for example, “Guiding a tourist through Hoi An Ancient Town”) and reviews the target vocabulary.

2. The learner speaks with the AI character. Each spoken turn is transcribed and assessed for pronunciation, grammar, vocabulary and fluency.

3. Mispronounced words and incorrect sentences are saved automatically as error items, tagged with their error category and the scenario they came from.

4. In Tutor, the learner works through the queue of error items: listening to a native sample, hearing the AI explanation, re-recording and receiving a score.

5. Scores from Roleplay and Tutor are aggregated into the four criteria and displayed in Error Radar.

6. Error Radar highlights the weakest criterion and offers a “Practise this” action that opens a scenario or Tutor set targeting that weakness, which starts the loop again.

## **4.3 AI Tutor Companion**

The AI Tutor is a single persistent assistant that appears across all three tabs, rather than a separate tool in each. It keeps context about the learner’s level and recent errors.

| Tab | What the AI Tutor does |
| :---- | :---- |
| Roleplay | Gives a hint when the learner is stuck, offers a model answer on request, and summarises the session at the end. |
| Tutor | Explains how to produce the sound (e.g., “Put your tongue between your teeth for /θ/”), models the correct pronunciation, and encourages another attempt. |
| Error Radar | Interprets the chart in plain language (“Your grammar is improving; final sounds are still your biggest issue”) and recommends the next activity. |
| All tabs | Motivates the learner with short, encouraging messages and celebrates streaks and milestones. |

## **4.4 Core Data Objects**

| Object | Key fields |
| :---- | :---- |
| Learner | id, display name, role (student / tourism worker), estimated level, interface language, voice settings |
| Scenario | id, title, landmark or theme, difficulty, AI character persona, verified fact sheet, target vocabulary |
| Session | learner, scenario, start/end time, turns, four criteria scores |
| Turn | audio reference, transcript, AI reply, grammar issues, pronunciation results per word |
| Supported location | id, Vietnamese and English names, description, coordinates, recognition radius, reference images, permitted Street View reference, visual keywords, cultural background, historical significance, interesting facts, vocabulary, conversation topics, verified sources |
| Error item | learner, word or sentence, error category, source session, attempts, best score, next review date, status |
| Skill profile | learner, current score for each criterion and sub-criterion, history |

# **5\. Functional Requirements**

## **5.1 Tab 1 – Roleplay and Interactive Chatbot**

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| R-01 | Cultural scenario cards: learners choose a situation tied to local culture or landmarks. | Must | At least 8 scenarios at launch, each with title, image, difficulty and short description. Example set: Hoi An Ancient Town, Japanese Covered Bridge, Dragon Bridge, My Khe Beach, Marble Mountains, Han Market, local food (cao lầu, mì Quảng), homestay check-in, giving directions, lantern making. |
| R-02 | Vocabulary preparation before speaking. | Must | 8–12 target words or phrases per scenario, each with IPA, audio, Vietnamese meaning and an example sentence. Learner can skip or start. |
| R-03 | Two-way voice conversation with an AI character. | Must | Learner speaks (push-to-talk); AI replies in voice and text in character. A session lasts about 6–10 turns. AI keeps language at the learner’s level and stays on the scenario topic. |
| R-04 | Factual grounding for cultural content. | Must | AI answers about landmarks are based on the scenario’s verified fact sheet; the AI does not invent dates, names or history. |
| R-05 | Speech-rate setting. | Must | Slow, medium and fast options; change takes effect on the next AI reply. |
| R-06 | Accent selection. | Should | British, American, Indian and Australian voices available; selection saved per learner. |
| R-07 | Real-time subtitles. | Must | AI speech is shown as text while it plays; learner can turn subtitles off. |
| R-08 | Grammar feedback on spoken turns. | Must | After each turn, a non-intrusive indicator shows if errors were found; tapping shows the corrected sentence and a one-line explanation (Vietnamese or English). End-of-session summary lists the main errors. |
| R-09 | Hint and model answer. | Should | A “Help me” button gives a starter phrase or full model answer. |
| R-10 | Automatic error capture. | Must | Words scoring below the pronunciation threshold and sentences with grammar errors are saved as error items in Tutor without any action from the learner. |
| R-11 | Camera-based cultural learning. | Could | Learner points the camera at a supported landmark and opens a location-specific English lesson. This is not general object recognition. Full requirements are in Section 5.5. |
| R-12 | Learner avatar in scenarios. | Could | Learner can choose or create an avatar shown in the conversation scene. |

## **5.2 Tab 2 – Pronunciation Tutor**

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| T-01 | Error queue from Roleplay. | Must | Tutor lists all open error items, newest and most frequent first, each linked to its source scenario. |
| T-02 | Phonetic error breakdown. | Should | For each word, the specific problem is identified using the categories in Section 6 (e.g., missing final /t/, cluster /str/ broken into syllables) and the faulty sound is highlighted. |
| T-03 | AI-guided correction. | Must | AI explains how to produce the correct sound in simple language, gives an example (“You should say…”), and prompts the learner to repeat. |
| T-04 | Native sample and instant scoring. | Must | Learner plays native audio, records an attempt and receives a 0–100 score with feedback within about 3 seconds. |
| T-05 | Mastery rule. | Should | An item is marked mastered after scoring 80 or more on two separate days; until then it stays in the queue. |
| T-06 | Spaced-repetition review. | Should | Mastered items return for review on a schedule set by an SRS algorithm (FSRS or SM-2). |
| T-07 | Streaks and rewards. | Should | Daily practice streak shown; streak milestones unlock extra AI characters or scenarios. |

## **5.3 Tab 3 – Error Map and Diagnostic Radar Chart**

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| E-01 | Four-criteria assessment. | Must | Fluency, Vocabulary, Grammar and Pronunciation are each scored 0–100% using the method in Section 7\. |
| E-02 | Radar chart. | Must | Four-axis radar chart showing current scores, with the previous period overlaid for comparison. |
| E-03 | Sub-criteria drill-down. | Should | Tapping an axis shows its sub-criteria (e.g., Pronunciation: final sounds, word stress, consonant clusters) without cluttering the main chart. |
| E-04 | Estimated CEFR band. | Should | An indicative CEFR band is shown with a clear note that it is an estimate, not an official certification. |
| E-05 | Practise from the radar. | Must | Each weak criterion has a “Practise this” button that opens a Tutor set or scenario targeting it. |
| E-06 | Progress history. | Should | Line chart of each criterion over time, plus totals for sessions and minutes practised. |

## **5.4 Cross-Cutting Features**

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| X-01 | Learner accounts. | Must | Two-step onboarding. **Step 1** collects name, Gmail, date of birth and gender. A date of birth under 18 adds a required guardian-consent checkbox (Section 9). **Step 2** collects the learner's place (X-06). Sign-in with email or Google, or a class code issued by the school for students. |
| X-02 | Onboarding and placement. | Should | A 2–3 minute speaking task estimates the starting level and sets AI language difficulty. |
| X-03 | Bilingual interface. | Must | All instructions and feedback available in Vietnamese and English. |
| X-04 | Persistent AI Tutor. | Should | AI Tutor panel available on all tabs with context of the learner’s recent errors. |
| X-05 | Teacher dashboard. | Could | Teacher sees class-level radar averages and the most common error categories. |
| X-06 | Place-themed interface. | Should | Onboarding step 2, "Nơi gắn bó với bạn", has a Hometown / Destination toggle and 9 place cards: Đà Nẵng, Hội An, Huế, Hà Nội, Hạ Long, Sa Pa, Đà Lạt, TP. Hồ Chí Minh, or "somewhere else". Picking one instantly repaints the whole interface with that place's scenery (~400 ms crossfade): main colours, a patterned frame, a background illustration covering the full page height, and a light ambient animation. Back keeps step-1 data; Skip uses the default theme; "Bắt đầu hành trình" saves `{placeType, placeId, themeId}` and the theme persists after reload. The learner can change it later in Profile. Text contrast is ≥ 4.5:1 in every theme, and motion stops under reduced-motion settings. |

## **5.5 Camera-Based Cultural Learning**

Learners point their phone camera at a supported cultural landmark, historical building or tourist attraction. The app identifies the likely location and opens an English lesson built on verified cultural information. **This is not a general-purpose object recognition feature:** only locations configured by administrators are supported, and the app does not create lessons for arbitrary objects.

Location detection, image matching, the cultural database, lesson generation and AI conversation are separate components. GPS alone never proves what the camera is pointing at, and Google Street View does not recognise the learner's photo.

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| C-01 | Location detection. | Could | GPS permission is requested only when the feature is opened. Recognition starts only within the configured radius of a supported location. If several locations are nearby, the learner chooses from a list. |
| C-02 | Manual location selection. | Could | Available when GPS or camera permission is denied, GPS is inaccurate, or recognition confidence is too low. |
| C-03 | Camera capture. | Could | Full-screen live preview with framing guide, capture, retake, close, GPS status, nearby-location indicator and a flash toggle when supported. Footage is not uploaded or stored continuously. |
| C-04 | Image matching. | Could | GPS narrows the candidates, the photo is compared with reference images, and the image result is combined with proximity. A location is shown only above the confidence threshold; otherwise the learner selects it manually. A confidence value appears only when it comes from a real recognition result. |
| C-05 | Supported-location management. | Could | Administrators can add, edit and remove locations without changing application code, using the Supported location fields in Section 4.4. Street View references are used only where the Google Maps Platform terms permit. |
| C-06 | Location lesson. | Could | After identification, a lesson shows the photo, Vietnamese and English names, short introduction, historical background, 3–5 interesting facts, vocabulary, pronunciation guidance, example sentences and conversation questions, organised as Discover, Learn English and Practice, with a progress indicator. |
| C-07 | Contextual vocabulary. | Could | Word and phrase cards show the English definition, Vietnamese translation, example sentence and pronunciation help. |
| C-08 | AI conversation about the location. | Could | The AI acts as a friendly tutor, asks about the location, encourages the learner to explain local culture, corrects important mistakes, suggests more natural expressions and adapts to the learner's level. It separates verified cultural information from generated language examples, and says so when verified information is insufficient. |
| C-09 | Demo Mode. | Could | The journey works without paid services, using a small set of sample locations and manual selection. Sample data and simulated recognition are clearly labelled. The app never shows fake API success messages or implies that an unconfigured service is working. |

# **6\. Vietnamese-Learner Pronunciation Error Taxonomy**

Because Vietnamese is a tonal language whose syllables rarely end in clusters or released consonants, Vietnamese speakers of English show predictable error patterns. The Tutor module classifies errors using the categories below, which makes feedback more specific and gives the project a clear research focus.

| Category | Typical example | Detection signal |
| :---- | :---- | :---- |
| Dropped or unreleased final consonants | “nice” → /naɪ/; “bike” → /baɪ/ | Low accuracy or omission of the final phoneme |
| Missing \-s / \-ed endings | “three ticket”; “I visit yesterday” | Phoneme omission plus grammar check on the transcript |
| Consonant clusters | “street” → /səˈtriːt/; “clean” → /kəˈliːn/ | Inserted vowel or dropped consonant inside the cluster |
| “th” sounds /θ/ and /ð/ | “think” → /tɪŋk/; “this” → /zɪs/ or /dɪs/ | Substitution of /θ/, /ð/ with /t/, /d/, /z/ |
| /ʃ/, /ʒ/, /dʒ/ and /z/ | “ship” → /sɪp/; “job” → /zɒb/ | Substitution between sibilants |
| Vowel length | “sheep” vs “ship”; “full” vs “fool” | Confusion of /iː/–/ɪ/, /uː/–/ʊ/ |
| Word stress | “hotel” stressed on the first syllable | Prosody / stress score on multi-syllable words |
| Flat or syllable-by-syllable rhythm | Every syllable given equal weight | Prosody score, speech rate and pause pattern |

*Validation of this taxonomy: the team can collect a small sample of student recordings at the pilot school and have an English teacher label the errors, then report how often each category occurs and how accurately the system detects it.*

# **7\. Scoring and Assessment Method**

## **7.1 Criteria and Sub-Criteria**

The four criteria follow the qualitative aspects of spoken language described in the Common European Framework of Reference for Languages (CEFR).

| Criterion | Sub-criteria (analysed in the background) | Source of the signal |
| :---- | :---- | :---- |
| Fluency | Speech rate (words per minute); number and length of long pauses; hesitations and self-corrections; ability to keep the conversation going | Audio timing from speech recognition; pronunciation-assessment fluency score |
| Vocabulary | Range of words used; use of the scenario’s target words; appropriateness of word choice | LLM analysis of the transcript against the target word list |
| Grammar | Errors per 100 words; tense and agreement accuracy; sentence complexity | LLM grammar analysis of the transcript |
| Pronunciation | Phoneme accuracy; final sounds; consonant clusters; word stress; intonation | Pronunciation assessment at phoneme and word level |

## **7.2 Score Calculation**

* Each criterion is scored 0–100% per session as the average of its sub-criteria.

* The radar chart shows a rolling average of the learner’s last 5 sessions, so one bad session does not swing the chart.

* Tutor scores contribute to the Pronunciation criterion with lower weight than Roleplay scores, because repeating an isolated word is easier than pronouncing it in conversation.

## **7.3 Indicative CEFR Mapping**

| Average score | Indicative band | Description |
| :---- | :---- | :---- |
| 0–39% | A1 | Can handle very simple, rehearsed exchanges |
| 40–59% | A2 | Can manage short social exchanges on familiar topics |
| 60–74% | B1 | Can describe experiences and places with reasonable fluency |
| 75–89% | B2 | Can interact with fluency and spontaneity on a range of topics |
| 90–100% | C1+ | Above the target range of this product |

*These cut-off points are initial assumptions. They must be calibrated against teacher ratings during the pilot and should never be presented to learners as an official certificate.*

## **7.4 Validity Check**

To show the judges that the AI scoring is trustworthy, the team should run a simple reliability study:

1. Collect 30–50 short recordings from pilot students across several scenarios.

2. Have two English teachers rate each recording on the four criteria independently, using the same 0–100 rubric.

3. Compute agreement between the two teachers, then between the teachers’ average and the AI score (e.g., Pearson correlation).

4. Report the results honestly, including criteria where the AI is less reliable, and adjust weights or thresholds accordingly.

# **8\. Technology Direction**

## **8.1 Platform Decision**

**Recommendation: responsive web application (installable as a Progressive Web App) for the competition prototype and pilot.** The project concept describes a web-based platform, while an earlier draft mentioned a dedicated mobile app. A web app is recommended for this phase because it runs on students’ phones and school computers without app-store approval, modern browsers support microphone and camera access, and the team ships one codebase. A native mobile app can be considered after the pilot if needed.

## **8.2 Proposed Architecture**

| Layer | Purpose | Candidate technologies |
| :---- | :---- | :---- |
| Front end | Three-tab interface, recording, playback, charts | React / Next.js as a PWA; Chart.js or Recharts for the radar chart; browser MediaRecorder API |
| Back end | Accounts, sessions, error items, scoring logic | Node.js or Python (FastAPI); hosted on a cloud platform |
| Large language model | AI characters, grammar feedback, error classification, AI Tutor explanations | A cloud LLM API (e.g., Claude, GPT or Gemini) with scenario fact sheets supplied in the prompt for grounding |
| Speech recognition (ASR) | Transcribe the learner’s speech with timing | Whisper or a cloud speech-to-text service |
| Pronunciation assessment | Phoneme- and word-level accuracy, fluency and prosody scores | A cloud pronunciation-assessment service (e.g., Azure AI Speech), or an open phoneme-recognition model as a research alternative |
| Text-to-speech (TTS) | AI voice with adjustable rate and accent | Neural TTS with en-GB, en-US, en-IN and en-AU voices |
| Camera and location | Live preview, photo capture and proximity check for camera-based learning | Browser MediaDevices API; Browser Geolocation API |
| Image matching | Compare the learner's photo with reference images of supported locations | An existing image similarity or visual recognition service; no large model trained from scratch |
| Map and reference data | Location references for supported landmarks | Google Maps Platform, including Street View, within its licensing, attribution and caching terms |
| Database | Learners, sessions, error items, scores, supported locations | PostgreSQL (e.g., Supabase) or Firebase |
| Spaced repetition | Review scheduling for error items and vocabulary | FSRS or SM-2 |

## **8.3 Current Prototype Status**

\[To be completed by the team: what is already built, which services are connected, and what will be shown at the pitch.\]

## **8.4 Non-Functional Requirements**

| Area | Requirement |
| :---- | :---- |
| Response time | AI voice reply starts within about 3 seconds of the learner finishing a turn; pronunciation score within about 3 seconds. |
| Connectivity | Internet connection required in this version; a lightweight offline mode (vocabulary review only) is on the long-term roadmap. |
| Devices | Works on recent Android and iOS phone browsers and on desktop Chrome/Edge; usable on a 360px-wide screen. |
| Cost control | Per-learner daily limit on AI minutes during the pilot to keep API costs predictable. |
| Accessibility | Subtitles, adjustable speech rate, readable font sizes and sufficient colour contrast. |

# **9\. Data Privacy and Safety**

Most primary users are under 18, and the product records their voices, so privacy and safety must be designed in from the start.

* **Consent:** obtain approval from the school and consent from parents or guardians before students take part in the pilot, in line with Vietnam’s personal data protection regulations.

* **Data minimisation:** store transcripts and scores; delete raw audio after a short retention period (e.g., 30 days) unless the learner and guardian agree to keep it for the research study.

* **No advertising or data sale:** learner data is used only to provide the service and, with consent, for the anonymised research analysis.

* **Camera and location:** request permissions only when needed and explain why. Do not store precise location history by default, upload photos without consent or collect continuous footage. Do not expose a learner's location to other users through this feature. Learners can delete their learning history.

* **AI guardrails:** AI characters stay on the scenario topic, keep language age-appropriate and decline unrelated or inappropriate requests.

* **Anonymised reporting:** results presented at the competition use aggregated or anonymised data only.

# **10\. Success Metrics and Pilot Evaluation Plan**

## **10.1 Pilot Design (Proposed)**

* **Participants:** about 40 volunteer students at Phan Chau Trinh High School; if possible, a comparison group of similar size who continue normal lessons only.

* **Duration:** 4 weeks, with a suggested 15 minutes of practice at least 4 days per week.

* **Before and after:** a 2-minute speaking task (introduce a local landmark) rated by teachers, plus a confidence questionnaire.

* **Ongoing:** usage data and score trends from the platform.

## **10.2 Key Metrics and Proposed Targets**

| Metric | Linked objective | Proposed target |
| :---- | :---- | :---- |
| Change in self-reported speaking confidence | O1 | Average increase of at least 1 point on a 5-point scale |
| Pronunciation score on logged error items | O2 | Average increase of 15 points or more between first and last attempt |
| Teacher-rated landmark storytelling task | O3 | Statistically meaningful improvement versus the comparison group |
| Agreement between AI and teacher scores | O4 | Correlation of 0.7 or higher on at least Pronunciation and Fluency |
| Learners practising at least 3 days per week | O5 | 60% or more of participants in week 4 |

*These targets are proposals for planning. The team should present whatever results the pilot actually produces, including any targets that were not met and why.*

# **11\. Social Impact and Sustainability**

## **11.1 Social Impact**

The platform gives local students and tourism workers a digital tool to introduce their heritage and cultural identity confidently to international visitors. It aims to improve foreign-language confidence among young people and contribute to the quality of local tourism services, while encouraging pride in local culture.

## **11.2 Implementation and Sustainability Model**

* **Phase 1 – free for education:** free access for students at the pilot school to encourage adoption and collect research data.

* **Phase 2 – freemium:** core features free; advanced features (more scenarios, unlimited AI minutes, additional characters) paid.

* **Phase 2 – sponsored deployment:** schools, local tourism associations or the city’s tourism department sponsor access for students and workers.

# **12\. Risks and Mitigation**

| Risk | Impact | Mitigation |
| :---- | :---- | :---- |
| Speech recognition misreads accented speech and blames the learner for its own error | Unfair scores; learner frustration | Use pronunciation assessment against the expected text where possible; flag low-confidence results instead of scoring them; validate with teacher ratings |
| AI gives wrong facts about landmarks or history | Learners repeat misinformation to tourists | Ground every scenario in a teacher-verified fact sheet; instruct the AI to stay within it |
| Camera recognition identifies the wrong landmark | Learner studies the wrong content | Narrow candidates by GPS; apply a confidence threshold; fall back to manual selection |
| Reference imagery is used outside its licence | Legal and attribution problems | Use supported APIs and permitted references; do not scrape or permanently copy Street View imagery; use team-owned photographs where possible |
| AI response delay breaks the conversation | Poor experience | Stream replies; show subtitles as soon as text arrives; choose fast models |
| API costs exceed budget | Service limits during pilot | Daily usage caps; cache TTS for fixed sentences such as vocabulary audio |
| Privacy concerns about recording minors | Pilot not approved | Consent process, short audio retention, anonymised reporting (Section 9\) |
| Learners lose motivation after the first week | Weak pilot data | Short sessions, streaks, unlockable characters, teacher encouragement |
| Scope too large for the deadline | Unfinished demo | Focus the demo on the full loop with 2–3 polished scenarios (Section 3\) |

# **13\. Roadmap**

| Phase | Timing | Deliverables |
| :---- | :---- | :---- |
| 0 – Proposal | By 28 Oct 2026 | This PRD submitted |
| 0 – Pitch | 30 Oct 2026 | Idea pitch with demo or clickable prototype of the full loop |
| 1 – MVP | \[Team to set\] | All Must requirements; 8 scenarios; working radar chart |
| 2 – Pilot | \[Team to set\] | 4-week pilot at Phan Chau Trinh High School; scoring validity study |
| 3 – Extension | After pilot | Should and Could features; tourism-worker scenarios; teacher dashboard |

# **14\. Open Questions**

1. ~~Final product name.~~ Resolved: **EchoLạc** (Section 1.4).

2. Current prototype status and what will be demonstrated on 30 October.

3. Team members and their roles (front end, back end, AI, content, research).

4. The competition’s official report template, if one exists, so this document can be adapted to it.

5. Whether the pilot school has approved the study, and how many students can participate.

6. Budget available for AI and speech API usage during development and the pilot.

7. Who will verify the cultural fact sheets for each scenario.

# **Appendix A. Pitch Slide Outline (30 October 2026\)**

A suggested 12-slide structure for a 5–7 minute pitch. Adjust to the time limit set by the organisers.

| \# | Slide | Key message |
| :---- | :---- | :---- |
| 1 | Title | EchoLạc logo and name, slogan “Nói tiếng Anh tự tin, vươn ra thế giới”, team names, school |
| 2 | The problem | Students know English on paper but cannot speak it confidently; no practice environment |
| 3 | The opportunity | International visitors in Da Nang and Hoi An; local people are the best storytellers of their hometown |
| 4 | Our solution | AI speaking partner with local-culture scenarios, personalised correction and progress tracking |
| 5 | The closed loop | Diagram: Roleplay → Tutor → Error Radar → back to practice (main innovation) |
| 6 | Demo: Roleplay | Short live or recorded conversation at a Hoi An landmark |
| 7 | Demo: Tutor and Radar | An error being captured, corrected and reflected in the radar chart |
| 8 | Vietnamese-learner focus | Error taxonomy: final sounds, clusters, “th”, word stress |
| 9 | Technology | LLM \+ speech recognition \+ pronunciation assessment \+ TTS \+ spaced repetition |
| 10 | Evaluation plan | Pilot at Phan Chau Trinh; AI vs teacher scoring validity; target metrics |
| 11 | Impact and sustainability | Students, tourism workers, local tourism; free for education, then freemium or sponsorship |
| 12 | Next steps and thank you | Roadmap; what support the team needs |

# **Appendix B. Glossary**

| Term | Meaning |
| :---- | :---- |
| ASR | Automatic speech recognition: converting speech to text |
| CEFR | Common European Framework of Reference for Languages: levels A1 (beginner) to C2 (mastery) |
| FSRS / SM-2 | Spaced-repetition algorithms that schedule reviews just before an item is likely to be forgotten |
| IPA | International Phonetic Alphabet |
| LLM | Large language model, the AI that generates conversation and feedback |
| MVP | Minimum viable product: the smallest version that demonstrates the core idea |
| PWA | Progressive Web App: a website that can be installed and used like an app |
| TTS | Text-to-speech: converting text to spoken audio |

