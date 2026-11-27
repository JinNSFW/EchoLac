**PRODUCT REQUIREMENTS DOCUMENT**

**EchoLạc**

*An AI-powered English speaking platform for telling the story of our hometown*

*Slogan: “Nói tiếng Anh tự tin, vươn ra thế giới” (Speak English with confidence, reach the world). See Section 1.4 for the name and logo.*

| Item | Detail |
| :---- | :---- |
| Document version | 1.6 (Local Guide Connect, server-backed pilot) |
| Date | 26 October 2026 (original draft) |
| Last revised | 27 November 2026 — Local Guide Connect drops schools and the teacher/school_admin roles: global admins verify learners and supervise group sessions from a local admin console (R-14 to R-18, migration 0008). 26 November 2026 — adds Local Guide Connect (Section 5.9, R-14 to R-18), role-based navigation (C.6), prototype-only safety simulation (Section 9) and new risks (Section 12). 26 November 2026 — Roleplay tab opens a three-option menu; Home drops the practice buttons and the Continue/mission cards; mission moves to Notifications; journey map gets a Continue card. 24 November 2026 — defines the directions pilot slice, its acceptance criteria and the separate validation gates for speech feedback and learning transfer |
| Submission deadline | 21:00, 28 October 2026 |
| Idea pitch | 30 October 2026 |
| Context | National-level science and engineering research competition |
| Pilot site | Phan Chau Trinh High School, Da Nang |
| Team / authors | \[To be completed by the team\] |
| Supervisor | \[To be completed by the team\] |

# Document Purpose and Ownership

This Product Requirements Document is the source of truth for **what EchoLạc is intended to provide**: users, problems, objectives, scope, functionality, product behaviour, acceptance criteria, design, technical direction, research evaluation and roadmap.

[AGENTS.md](AGENTS.md) governs how development agents work: model assignment, tools, coding practices, checks and reporting. [README.md](README.md) explains how the current code runs. Developer-agent model assignments are separate from the in-app AI configuration in Section 8.2.

Requirements describe intended behaviour, not proof that a feature has been implemented. Current implementation status is stated in Section 8.3. Pilot targets and historical milestone dates remain plans unless supported by recorded evidence. This revision updates the camera specification using the owner's model description and reported small-data experiment. It does not promote Should/Could items to Must, certify those results or authorise a stack migration. Revision 1.3 extends the target proficiency range to CEFR A1–C1 and adds the leveled cultural curriculum (R-13, Section 5.7); it does not raise the priority of existing items or mark any curriculum content as verified.

# **1\. Purpose and Context**

## **1.1 Problem Statement**

Many Vietnamese high school students learn English mainly through grammar, reading and written exam practice. They rarely get the chance to speak with fluent speakers, so they lack confidence even when their vocabulary and grammar knowledge are adequate. Pronunciation errors typical of Vietnamese speakers, such as dropped final consonants, are rarely corrected individually because one teacher cannot listen to every student.

At the same time, Da Nang and Hoi An welcome large numbers of international visitors. Local students and tourism workers are well placed to introduce their hometown’s culture and landmarks, yet most general-purpose English apps teach generic content (airports, offices, Western restaurants) rather than the conversations they actually need to have.

## **1.2 Product Vision**

A web-based learning platform where learners practise speaking English in realistic local situations with an AI conversation partner, receive personalised correction of their pronunciation and grammar, and see their progress clearly, using content rooted in Vietnamese culture and the landmarks of Da Nang and Hoi An.

The first check of that vision is whether a listener can act on the learner's English in a new local task after practice. In the Da Nang directions slice, the listener must identify a turn, a landmark and a destination. Section 5.8 defines the slice and Section 10.3 defines the study proposal.

## **1.3 Product Objectives**

The following objectives are proposed so that the project has measurable outcomes the judges can evaluate. Targets in Section 10 are proposals to be confirmed after the pilot design is finalised.

| ID | Objective | How it is measured |
| :---- | :---- | :---- |
| O1 | Increase learners’ speaking confidence in everyday and tourism conversations. | Pre/post self-confidence questionnaire (5-point Likert scale). |
| O2 | Reduce pronunciation errors that are typical of Vietnamese speakers. | Change in pronunciation score on items logged in the Tutor module. |
| O3 | Enable learners to introduce local culture and landmarks in English. | Teacher-rated storytelling task before and after the pilot. |
| O4 | Demonstrate that AI scoring is reliable enough to guide learners. | Agreement between AI scores and human teacher ratings. |
| O5 | Sustain regular voluntary practice. | Weekly active learners, sessions per learner, streak length. |
| O6 | Transfer targeted speaking practice to a new local communication task. | Number of turn, landmark and destination details understood independently at day 7, compared with fixed-schedule practice (Section 10.3). |

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

The proposed research contribution is to test whether practice selected from a learner's observed error improves a new local speaking task. Roleplay, feedback and pronunciation exercises provide the teaching mechanism. Sections 5.8 and 10.3 define the first test and the evidence needed to support the claim.

* **Closed-loop remediation pipeline.** In the target product, verified errors in conversation lead to focused exercises and a new speaking task, with results informing the next recommendation. The first slice uses listener judgement for this step.

* **Vietnamese-learner error taxonomy.** The pronunciation and grammar feedback is organised around error patterns specific to Vietnamese speakers (Section 6\) rather than generic scores.

* **Culturally grounded tasks.** Local information determines what a listener should understand or do. Real landmark, food and tradition facts used in a released lesson must pass R-04.

* **Separate validation.** Compare automated feedback with human ratings before relying on it. Measure learning transfer on a new task with a listener who does not know the learner's study assignment (Sections 7.4 and 10).

# **2\. Target Users**

## **2.1 User Groups**

| Group | Description | Main need |
| :---- | :---- | :---- |
| Primary: high school students | Students aged roughly 15–18, pilot at Phan Chau Trinh High School. English levels from beginner (A1) to advanced (C1). Struggle with speaking confidence and have no native-speaker practice environment. | A safe, private space to practise speaking without fear of being judged, with clear guidance on what to fix. |
| Extended: local tourism workers | Homestay staff and local vendors in Da Nang and Hoi An. | Short, practical conversations they can use with guests the same day. |
| Supporting: English teachers | Teachers at the pilot school who supervise students and help validate scoring. | A view of class progress and common errors (later phase). |

## **2.2 Personas**

**Persona A – Lan, 16, Grade 11 student.** Lan scores well on written English tests but freezes when a foreign tourist asks her a question at the Dragon Bridge. She wants to practise at home in the evening, on her phone, for 10–15 minutes at a time. She often drops final sounds (“nice” becomes “nai”) without noticing.

**Persona B – Minh, 34, homestay owner in Hoi An.** Minh speaks basic English learned on the job. He wants to explain check-in rules, recommend local food such as cao lầu, and tell guests the history of the Japanese Covered Bridge. He has little time and needs practical phrases, not grammar lessons.

**Persona C – Huy, 17, Grade 12 student in an English-specialised class.** Huy already handles everyday conversation at around B2. He wants to explain to visitors why Da Nang has long been a gateway port, discuss how the city balances growth with conservation, and give a short talk on what local food says about the region. He needs feedback on fluency, precise vocabulary and natural phrasing rather than basic sentence patterns.

## **2.3 Proficiency Level and Learning Goal**

* **Level:** CEFR A1 (beginner) to C1 (advanced). C2 is outside this version. Each band has a different practice focus and AI conversation style:

| Band | What learners practise | AI conversation style |
| :---- | :---- | :---- |
| A1 | Name places, dishes and weather; very short rehearsed sentences (“It is…”, “I like…”) | Very short, slow, simple sentences; one question per reply |
| A2 | Give simple directions, times, steps and visitor rules; describe familiar routines | Short sentences on familiar topics; offers choices when the learner is stuck |
| B1 | Describe, compare and explain the meaning of landmarks, dishes and festivals | Connected sentences; asks for reasons and examples |
| B2 | Explain causes and effects, summarise history briefly, argue for a recommendation | Natural pace; follow-up “why” questions; some idiomatic language |
| C1 | Interpret heritage, weigh trade-offs and give extended explanations to visitors | Extended, nuanced replies; politely challenges ideas; expects precise vocabulary |

* **Goal:** confident everyday conversation, and the ability to introduce and tell stories about hometown culture and landmarks to international visitors.

* **Interface language:** English practice content with a Vietnamese/English toggle for instructions and explanations, since beginners may not understand feedback written only in English.

<a id="product-scope"></a>

# **3\. Scope and Priorities**

Priorities use the MoSCoW method: Must (required for the competition prototype), Should (important, build if time allows), Could (extended features for a later phase), Won’t (explicitly out of scope for this version).

| Priority | Features |
| :---- | :---- |
| Must (MVP) | Scenario cards (at least 8 local scenarios); vocabulary preparation; two-way voice conversation with AI; speech-rate setting; real-time subtitles; grammar feedback; automatic error logging into Tutor; pronunciation scoring with native sample audio; 4-criteria radar chart; “Practise this” link from radar back to practice; basic learner accounts. |
| Should | Accent selection (British, American, Indian, Australian); phoneme-level error breakdown with Vietnamese explanations; spaced-repetition review of error items; practice streaks; progress history over time; placement test at onboarding; leveled A1–C1 cultural curriculum (R-13). |
| Could | Camera-based cultural learning at supported landmarks (Section 5.5); learner avatars inside scenarios; unlockable conversation characters as rewards; teacher dashboard; lightweight offline mode. |
| Won’t (this version) | Native iOS/Android apps; live human tutors; payments; social features such as leaderboards between strangers; languages other than English. |

*Recommendation: given the submission deadline, the team should demonstrate the full loop (Roleplay → Tutor → Radar → back to Roleplay) on two or three polished scenarios rather than many half-finished features. The loop is the project’s main idea, and judges will want to see it work end to end.*

## Delivery Sequence

0. Run the limited Da Nang directions slice in Section 5.8. Use live listener feedback and the existing static PWA to test the teaching sequence and usability. This slice precedes the full speech and LLM integration.
1. Prove one scenario through the entire Roleplay → Tutor → Error Radar → Practise this loop with real speech and LLM services.
2. Polish two or three scenarios for an end-to-end demonstration, then complete the remaining Must items, including the launch scenario count in R-01.
3. Add Should items, then Could items as time and evidence allow. Won't items remain outside this version. A clickable demo or an existing camera experiment does not change these priorities.

# **4\. System Overview**

## **4.1 The Three Modules**

| Module | Vietnamese name | Role in the loop |
| :---- | :---- | :---- |
| Module 1 – Roleplay | Nhập vai & Trò chuyện | Where learners practise freely and where errors are detected. |
| Module 2 – Tutor | Gia sư phát âm | Where detected errors are corrected through focused repetition. |
| Module 3 – Error Radar | Bản đồ lỗi / Biểu đồ mạng nhện | Where progress is diagnosed and the next practice is recommended. |

The three modules above are learning functions. Navigation has **five tabs: Home, Roleplay, Tutor, Radar and Profile**. Home and Profile support the learning loop; they are not additional assessment modules. Detailed screen requirements are in Appendix C.

## **4.2 Closed-Loop Learning Flow**

1. The learner picks a scenario card in Roleplay (for example, “Guiding a tourist through Hoi An Ancient Town”) and reviews the target vocabulary.

2. The learner speaks with the AI character. Each spoken turn is transcribed and assessed for pronunciation, grammar, vocabulary and fluency.

3. Mispronounced words and incorrect sentences are saved automatically as error items, tagged with their error category and the scenario they came from.

4. In Tutor, the learner works through the queue of error items: listening to a native sample, hearing the AI explanation, re-recording and receiving a score.

5. Scores from Roleplay and Tutor are aggregated into the four criteria and displayed in Error Radar.

6. Error Radar highlights the weakest criterion and offers a “Practise this” action that opens a scenario or Tutor set targeting that weakness, which starts the loop again.

## **4.3 AI Tutor Companion**

The AI Tutor is a single persistent assistant that appears across the interface, including the three learning modules, rather than a separate tool in each. It keeps context about the learner’s level and recent errors.

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
| Scenario | id, title, landmark or theme, CEFR level (A1–C1), topic strand, can-do objective, AI character persona, fact sheet with sources and “as of” dates, verified flag, target vocabulary, pronunciation focus |
| Session | learner, scenario, start/end time, turns, four criteria scores |
| Turn | audio reference, transcript, AI reply, grammar issues, pronunciation results per word |
| Supported location | id, Vietnamese and English names, description, enabled status, cultural background, historical significance, interesting facts, vocabulary, conversation topics, verified sources, licensed reference images; optional coordinates and proximity radius for supplementary GPS use; optional permitted Street View reference |
| Camera model release | version, backbone, artifact format and paths, weight shards, labels.txt in exact output order, output class count, preprocessing specification, confidence threshold, frame-smoothing configuration, class-to-location mapping, dataset/split version, training configuration, evaluation report and artifact checksums |
| Camera prediction | transient image/frame reference, model version, top-1 label, softmax score, decision (supported / uncertain / khac / unavailable), optional smoothed prediction; not stored by default and not a speaking-assessment score |
| Error item | learner, word or sentence, error category, source session, attempts, best score, next review date, status |
| Skill profile | learner, current score for each criterion and sub-criterion, history |

<a id="functional-requirements"></a>

# **5\. Functional Requirements**

## **5.1 Module 1 – Roleplay and Interactive Chatbot**

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| R-01 | Cultural scenario cards: learners choose a situation tied to local culture or landmarks. | Must | At least 8 scenarios at launch, each with title, image, CEFR level (A1–C1) as its difficulty and short description. A landmark or theme may have versions at several levels (R-13). Example set: Hoi An Ancient Town, Japanese Covered Bridge, Dragon Bridge, My Khe Beach, Marble Mountains, Han Market, local food (cao lầu, mì Quảng), homestay check-in, giving directions, lantern making. |
| R-02 | Vocabulary preparation before speaking. | Must | 8–12 target words or phrases per scenario, suited to the scenario's CEFR level, each with IPA, audio, Vietnamese meaning and an example sentence. Learner can skip or start. |
| R-03 | Two-way voice conversation with an AI character. | Must | Learner speaks (push-to-talk); AI replies in voice and text in character. A session lasts about 6–10 turns. AI keeps language at the learner’s CEFR level (A1–C1, Section 2.3) and stays on the scenario topic. |
| R-04 | Factual grounding for cultural content. | Must | AI answers about landmarks are based on the scenario’s verified fact sheet; the AI does not invent dates, names or history. Time-sensitive facts (opening hours, show times, prices, visitor rules, administrative statistics) carry an “as of” date and source. Contested or hypothetical explanations, such as place-name origins, are presented as such. |
| R-05 | Speech-rate setting. | Must | Slow, medium and fast options; change takes effect on the next AI reply. |
| R-06 | Accent selection. | Should | British, American, Indian and Australian voices available; selection saved per learner. |
| R-07 | Real-time subtitles. | Must | AI speech is shown as text while it plays; learner can turn subtitles off. |
| R-08 | Grammar feedback on spoken turns. | Must | After each turn, a non-intrusive indicator shows if errors were found; tapping shows the corrected sentence and a one-line explanation (Vietnamese or English). End-of-session summary lists the main errors. |
| R-09 | Hint and model answer. | Should | A “Help me” button gives a starter phrase or full model answer. |
| R-10 | Automatic error capture. | Must | Words scoring below the pronunciation threshold and sentences with grammar errors are saved as error items in Tutor without any action from the learner. |
| R-11 | Camera-based cultural learning. | Could | Classify a camera image into one of 25 planned landmark classes or khac; accept a supported landmark only under the confidence and frame-stability rules, then offer its verified English lesson. GPS is optional. This is single-label image classification, not general object detection or proof of the learner's physical location. Full requirements are in Section 5.5. |
| R-12 | Learner avatar in scenarios. | Could | Learner can choose or create an avatar shown in the conversation scene. |
| R-13 | Leveled cultural curriculum. | Should | Scenarios are organised by CEFR level (A1–C1) and topic strand (Section 5.7). Each curriculum-derived scenario has a can-do objective, level, strand, target vocabulary (R-02), a roleplay task (R-03), a pronunciation focus (Section 6) and a sourced fact sheet (R-04). It stays hidden until its verified flag is true. |

## **5.2 Module 2 – Pronunciation Tutor**

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| T-01 | Error queue from Roleplay. | Must | Tutor lists all open error items, newest and most frequent first, each linked to its source scenario. |
| T-02 | Phonetic error breakdown. | Should | For each word or sentence, the specific problem is identified using the categories in Section 6 (e.g., missing final /t/, cluster /str/ broken into syllables, /eɪ/ reduced to [e]) and the faulty sound is highlighted. Categories with low detection confidence appear as practice tips, not errors. Explanations and drills come from the pronunciation lesson plan (`docs/giao-an-phat-am.md`; data in `content/pronunciation/`). |
| T-03 | AI-guided correction. | Must | AI explains how to produce the correct sound in simple language, gives an example (“You should say…”), and prompts the learner to repeat. |
| T-04 | Native sample and instant scoring. | Must | Learner plays native audio, records an attempt and receives a 0–100 score with feedback within about 3 seconds. |
| T-05 | Mastery rule. | Should | An item is marked mastered after scoring 80 or more on two distinct calendar days in Asia/Ho_Chi_Minh time; until then it stays in the queue. Mastered items return through scheduled review (T-06). |
| T-06 | Spaced-repetition review. | Should | Mastered items return for review on a schedule set by an SRS algorithm (FSRS or SM-2). |
| T-07 | Streaks and rewards. | Should | Daily practice streak shown; streak milestones unlock extra AI characters or scenarios. |

## **5.3 Module 3 – Error Map and Diagnostic Radar Chart**

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| E-01 | Four-criteria assessment. | Must | Fluency, Vocabulary, Grammar and Pronunciation are each scored 0–100% using the method in Section 7\. |
| E-02 | Radar chart. | Must | Four-axis radar chart showing current scores, with the previous period overlaid for comparison. |
| E-03 | Sub-criteria drill-down. | Should | Tapping an axis shows its sub-criteria without cluttering the main chart. Pronunciation shows the six groups of Section 6 (Endings, Clusters, Consonants, Vowels, Word stress, Speech flow). Only categories with high or medium detection confidence contribute to a group score; a group without such data shows practice suggestions instead of a number. |
| E-04 | Estimated CEFR band. | Should | An indicative CEFR band from A1 to C1 (Section 7.3) is shown with a clear note that it is an estimate, not an official certification. |
| E-05 | Practise from the radar. | Must | Each weak criterion has a “Practise this” button that opens a Tutor set or scenario targeting it. |
| E-06 | Progress history. | Should | Line chart of each criterion over time, plus totals for sessions and minutes practised. |

## **5.4 Cross-Cutting Features**

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| X-01 | Learner accounts. | Must | Two-step onboarding. **Step 1** collects name, date of birth and optional gender; no email is required. A date of birth under 18 adds a required guardian-consent checkbox (Section 9). **Step 2** collects the learner's place (X-06). **Testing stage (decision 22 November 2026):** each device gets an anonymous Supabase account created in the background; progress is saved on the device first and synced when online. Changing device or clearing browser data loses the link to that progress, and the app says so. Email, Google sign-in and class codes are not offered in this stage; upgrading an anonymous account to email is a later option. Detailed validation and navigation are in Appendix C.4. |
| X-02 | Onboarding and placement. | Should | A 2–3 minute speaking task estimates the starting CEFR level (A1–C1), sets AI language difficulty and selects the default curriculum level; learners may still browse other levels. |
| X-03 | Bilingual interface. | Must | Vietnamese is the default. Instructions, feedback explanations and Tutor explanations follow the Vietnamese/English interface toggle. What learners hear and say during English practice remains English. |
| X-04 | Persistent AI Tutor. | Should | AI Tutor panel available on all tabs with context of the learner’s recent errors. |
| X-05 | Teacher dashboard. | Won't (this version) | Out of scope: EchoLạc is used by individual learners, with no classes. "Teacher" means the reviewer who verifies content (R-13, Section 6 lesson plan). |
| X-06 | Place-themed interface. | Should | Onboarding step 2, "Nơi gắn bó với bạn", has a Hometown / Destination toggle and 9 place cards: Đà Nẵng, Hội An, Huế, Hà Nội, Hạ Long, Sa Pa, Đà Lạt, TP. Hồ Chí Minh, or "somewhere else". Picking one instantly repaints the whole interface with that place's scenery (~400 ms crossfade): main colours, a patterned frame, a background illustration covering the full page height, and a light ambient animation. Back keeps step-1 data; Skip uses the default theme; "Bắt đầu hành trình" saves `{placeType, placeId, themeId}` and the theme persists after reload. The learner can change it later in Profile. Text contrast is ≥ 4.5:1 in every theme, and motion stops under reduced-motion settings. Theme designs and detailed interaction rules are in Appendix C.3. |

## **5.5 Camera-Based Cultural Learning**

### 5.5.1 Goal and Scope

Learners photograph a famous landmark with their phone camera and receive a likely landmark name, then access its English-learning content. The target is **25 landmark classes plus one `khac` class, 26 classes in total**. The full list of 25 landmarks is **to be supplied by the team**; the two trial classes in Section 8.3 are not the full release scope.

This is **multi-class, single-label image classification**: one RGB image produces a probability vector and exactly one top-1 class. The application can decline to accept that class. It does not draw object-detection boxes, identify every landmark in a scene, recognise arbitrary objects or establish the learner's physical location. `khac` represents images outside the supported landmark classes, not another destination.

Image classification is the primary recognition mechanism. **GPS is not required**, does not gate camera use, and does not override an uncertain or `khac` prediction. If retained, GPS is separately consented, optional context for browsing nearby places. The classifier does not require runtime comparison against a reference-image database. Location content, classification, optional GPS and AI conversation remain separate components. Street View is not a recognition service.

### 5.5.2 Functional Acceptance Criteria

| ID | Requirement | Priority | Acceptance criteria |
| :---- | :---- | :---- | :---- |
| C-01 | Landmark image classification. | Could | The release classifier targets 25 landmarks plus khac. Each image returns one top-1 label and its softmax score, indexed by the paired labels.txt. Classification works without GPS permission. Partial experimental models are explicitly labelled with their actual class coverage. |
| C-02 | Manual location selection and retry. | Could | Retake and manual browsing are available for uncertain, khac, model-loading failure or denied/unavailable camera access. Browsing does not imply successful recognition. GPS denial does not disable classification. |
| C-03 | Camera capture. | Could | Explain camera use before requesting permission. Provide live preview, framing guide, capture, retake, close and a flash toggle where supported. Show processing and permission/error states in Vietnamese and English. If GPS is offered, show it as optional context. Do not upload or retain footage by default. |
| C-04 | Confidence rejection and stable predictions. | Could | Apply the decision rules in Section 5.5.3. Initially reject landmark predictions below 0.7 as uncertain; reject khac at any score. A top-1 minus top-2 margin (provisionally 20 percentage points, as used in the team's v3 test) may be added as a second uncertainty condition; calibrate the threshold and margin together on validation data. For live recognition, smooth predictions over consecutive frames before accepting a landmark. Record and validate the smoothing window/rule per release. Display only real prediction scores, describe them as model confidence rather than verified correctness, and never auto-open a lesson for a rejected result. |
| C-05 | Supported-location and model-release management. | Could | Edit cultural content without changing application code. A new recognition class requires training data, retraining/fine-tuning, evaluation and a versioned model/labels release; editing the location database alone does not teach the classifier. Validate label count/order, preprocessing and label-to-location mapping before enabling a release. Disabled or unverified locations do not open lessons. Licensed references, including any optional Street View use, retain attribution and usage restrictions. |
| C-06 | Location lesson. | Could | After identification, a lesson shows the photo, Vietnamese and English names, short introduction, historical background, 3–5 interesting facts, vocabulary, pronunciation guidance, example sentences and conversation questions, organised as Discover, Learn English and Practice, with a progress indicator. |
| C-07 | Contextual vocabulary. | Could | Word and phrase cards show the English definition, Vietnamese translation, example sentence and pronunciation help. |
| C-08 | AI conversation about the location. | Could | The AI acts as a friendly tutor, asks about the location, encourages the learner to explain local culture, corrects important mistakes, suggests more natural expressions and adapts to the learner's level. It separates verified cultural information from generated language examples, and says so when verified information is insufficient. |
| C-09 | Demo Mode. | Could | Demonstrate the journey without paid recognition services using manual selection, labelled sample data or an actual available local model. Distinguish simulated output from real inference and state the model's actual class coverage/version. Do not present the two-class trial or the existing Teachable Machine model as a trained 26-class release. |

### 5.5.3 Recognition Decisions and Interface States

| Model/application result | Learner-facing behaviour | Lesson access |
| --- | --- | --- |
| Top-1 is a supported landmark, score ≥0.7 and live-frame stability rule passes | Show the proposed landmark, actual model confidence and an action to start its lesson | Offer only the enabled location's teacher-verified content |
| Top-1 landmark score <0.7, or live result is not stable yet | “Không chắc chắn” / “Not sure”; ask for another view or offer manual selection | Do not open a lesson automatically |
| Top-1 is khac, including at high confidence | “Không thuộc địa điểm được hỗ trợ” / “Not a supported landmark”; offer retake or manual selection | No recognised-landmark lesson |
| Label is unmapped, location disabled/unverified, or model/labels contract is invalid | Explain that recognition/content is unavailable; offer retry/manual browsing as appropriate | Do not guess a class mapping or open unverified content |
| Camera denied/unavailable, model failed to load or inference failed | A specific recoverable error and next step, without fabricated prediction scores | Manual browsing remains available |

**0.7 is a proposed starting threshold**, not a calibrated correctness guarantee. A softmax score is relative to the model's known classes; it is not proof that an unfamiliar image belongs to one of them. Live-frame smoothing may average probability vectors over a rolling window, but the window length, sampling interval, stability test and allowable delay remain **to be measured and specified**. A still photo uses the single-image rule; it must not claim multi-frame validation.

**Prototype status (16 November 2026).** With model v4, both camera paths use a 0.85 threshold plus the 20-point top-1/top-2 margin; live scan also requires 800 ms of stable frames. The owner chose 0.85 because at 0.75 v4 confidently mistook distant photos of Cầu Rồng for Cầu Sông Hàn; on 41 test photos 0.85 accepted 19, all correct. The value was chosen on the same photos it was reported on, so its zero false acceptances are optimistic until re-checked on an independent validation set (`docs/camera-v4-diagnosis.md`). The two paths differ: the photo path cross-checks GPS (Section 5.5 cases A–F), but live scan does not, so a confident wrong class in live scan is only caught by the learner (it now shows “Looks like …” with a “Not this place” action). See `docs/camera-review.md`.

The camera flow visibly distinguishes explanation/permission, model loading, ready preview, processing, stable supported result, uncertain result, `khac` and recoverable error. Instructions follow the interface language (X-03). Neither GPS nor a high score bypasses content verification (R-04).

## **5.6 Conversation and Feedback Behaviour (R-03, R-04, R-08, R-10, X-04)**

- Each character uses its persona, the learner's estimated CEFR level, the scenario's verified fact sheet and target vocabulary.
- Reply length and complexity follow the learner's CEFR band (Section 2.3): 1–3 short sentences at A1–B1 and longer connected replies at B2–C1. Replies end with a question so the learner has something to answer. Session length follows R-03.
- Landmark facts, dates, names and history come only from the fact sheet. If the sheet does not cover a question, the character says it is not sure. Production exposes only scenarios whose teacher-controlled verified flag is true.
- Characters stay on topic, use language appropriate for under-18 learners and politely steer unrelated requests back to the scenario while remaining in character.
- Pronunciation below the initial threshold in Section 7.2 and sentences with grammar issues create error items automatically. Each item retains its category, word or sentence and source session; no learner action is required.
- Low-confidence speech recognition shows a retry message such as “Didn't catch that, try again” and contributes no score to the learner's record. Feedback never blames learners for recognition errors.
- Grammar feedback, error classification and session summaries must have validated structured fields before being stored. The persistent Tutor shares learner-level and recent-error context across screens (Section 4.3).
- Friendly feedback and recording states follow Appendix C.7; all proposed timing and scoring targets still require measurement.

## **5.7 Leveled Cultural Curriculum (R-13)**

The first curriculum module is Đà Nẵng. Its draft lesson plan is `Giáo án văn hoá Đà Nẵng - Học văn hoá Việt Nam bằng tiếng Anh (A1-C1).pdf` (30 lessons, six per level), derived from the source notes `phôi giáo án.txt`. Both files are drafts, not verified fact sheets. The lesson list lives in those files, not in this PRD.

- **Strands.** Lessons follow six topic strands that recur at higher levels with more depth: landmarks; food; weather and climate; culture and heritage; history and place names (context for culture, with key dates only at B2–C1); location, people and present-day life.
- **Intake rule.** A lesson becomes a scenario only after: (1) each fact has been matched to its source and copied into the fact sheet with that source; (2) time-sensitive facts carry an “as of” date (R-04); (3) the lesson has been reframed as a conversation in which the learner explains, recommends or interprets for a visitor (Objective O3); (4) it has R-02 vocabulary and a pronunciation focus whose category is a Section 6 id, linked where possible to the matching unit of the pronunciation lesson plan; and (5) a teacher has set its verified flag.
- **App activities.** Classroom activities that the app cannot deliver, such as tasting food, are replaced with an app interaction: describing a photo, roleplay with an AI character or a Tutor drill.
- **Sensitive topics.** War, colonial history and administrative or political decisions are presented factually and neutrally as background to culture. Activities ask learners to describe and explain, not to judge political decisions.
- **Level selection.** Placement (X-02) and the estimated band (E-04) choose the default level; learners can open other levels.

## **5.8 Da Nang Directions and Speaking Transfer**

The first slice is for a Da Nang high school learner practising at A2. A2 describes task difficulty. The task uses a clearly labelled fictional map near the Dragon Bridge, with no live directions, GPS or verified claims about streets. Real routes or cultural facts need R-04 verification before being used for a school study. This slice connects R-03, T-03, E-05 and X-03 and has a separate acceptance boundary from the full Must MVP.

| Behaviour | Slice acceptance criteria |
| :---- | :---- |
| First speaking task | Learner sees a map, meeting point and English visitor question with no model answer. The learner can speak to a listener or record on an explicit action after a mic explanation. Unsupported, denied or interrupted microphone access leaves the live speaking path available. |
| Listener checks what they understood | The listener sees no route map or answer key and submits the heard turn, landmark and destination, including an option for unclear answers. Display the number of correct details over three. Solo practice can skip this step, which records no score. |
| One focused follow-up | After the baseline listener choices are submitted, the listener can classify the target word's final /t/ as present or acceptable, clearly missing, or uncertain. An observed omission offers a short U01-based model and retry. An uncertain, absent or skipped observation offers general practice without a diagnosis. No automatic phoneme classification is enabled in the slice. |
| Immediate and delayed transfer | A third map is used immediately after the follow-up. The delayed task uses the unused map from the baseline/delayed pair and is available seven days after completing the immediate task. Each run keeps the pair order on reload. Neither transfer map shows a model answer before speaking. Future research must predefine balanced assignment and comparable tasks. |
| Data and progress | Keep only the versioned map order, listener choices, drill state and delayed unlock time on the device. Local recording is replayable while completing the current task. Stop capture and release audio on leaving or hiding the view, and release it when the current assessment is finished. Persist or transmit neither audio nor transcripts. Keep listener task scores separate from the existing demo Radar, CEFR and XP. |
| Interface | Vietnamese and English controls and explanations, with English for the practice prompt and model words. The map and listener form are keyboard accessible and usable on a 360px viewport. |

The local prototype does not satisfy the broader requirements for automatic error capture (R-10), timed automated scoring (T-04), four-axis assessment (E-01), real AI conversation (R-03) or the launch count (R-01). Those requirements keep their existing priority and acceptance criteria.

## **5.9 Local Guide Connect (R-14 to R-18)**

Local Guide Connect lets a visiting tourist find a Da Nang student who can talk about an approved landmark, and lets the student practise English with that visitor. Slogan: "Learn Locally. Connect Globally." There is no demo, mock or simulated data: every screen reads Supabase (RLS and RPCs in `0003_connect.sql` and `0008_admin.sql`, Edge Functions `connect-request` / `connect-respond`), and a part that is not built yet shows **"Chưa mở / Not open yet"** with the reason. Offline or without an account, Connect only explains that it needs both. No chat or payments. Priority is Could and does not change the Must MVP. Contract details for developers are in `docs/connect-plan.md`.

**Roles (R-14).** The role comes from the server profile (`profiles.role` = `student` or `tourist`, `verification_status`, `level`, `age_group`); no local flag grants anything. A learner picks Student or Tourist once in Profile, which the database allows only while unverified. There are no schools, invite codes or teacher accounts (owner decision 27/11/2026). **Admins** are global: an admin account is created by the project owner in the Supabase dashboard and promoted with server-set `app_metadata.role = 'admin'` (never `user_metadata`); there is no admin signup anywhere. Admins work only from a local admin console that is never deployed, sign in with email and password plus TOTP MFA, and see nothing until the session is at `aal2`. An admin verifies learners (verification, level, age group), creates and closes supervised group sessions at approved places (the creating admin is the supervisor), reviews connection requests and blocks, and resolves reports. Security lives in the database: RLS and admin RPCs refuse anyone who is not an admin on an `aal2` session, even through the public API, and every admin action writes an append-only audit row. The public app has no admin, school or teacher screens.

- **Student:** tabs Học/Home, Nhập vai/Roleplay (existing popup menu), Kết nối/Connect, Hồ sơ/Profile. Tutor and Radar stay reachable from Home shortcuts.
- **Tourist:** tabs Khám phá/Discover, Kết nối/Connections, Hồ sơ/Profile. A tourist never sees lessons, the Tutor or learning progress; any view outside the tourist set redirects to Discover. A student opening a tourist view is redirected to Connect.

**Journey (R-15).** Tourist: Discover (approved places, large image cards) → place detail → list of matched students → send request → track, cancel, block or report on Connections. Student: Connect shows the safety status, availability per approved place and time slot, and incoming requests to accept or decline. The interface keeps four ideas apart: viewing a public place, finding users, sending a request, and being eligible to meet offline.

**Safety rule (R-16).** A connection is allowed only when: the place is approved AND the tourist is eligible AND the student is eligible AND supervision or approval exists where required. Missing or unverifiable data counts as **not allowed**. Hiding a button is not protection: every action re-runs the check at the moment it happens, including accepting a request that was sent earlier.

- **Approved places** are the existing location list only; none is added.
- **Account status:** *eligible* = adult and verified (students also need level A2 or higher). *Awaiting approval* = student under 18, verified; the adults-only pilot (Section 9, migration 0007) has no approval path for minors, so they cannot connect until guardian consent and an approval flow exist. *Not eligible* = everything else (unverified, age unknown, tourist under 18).
- **Under 18 (R-17).** A student under 18 never has a one-to-one connection. If minors are admitted later, only a supervised group session that matches the place and whose supervisor is an admin may include them, and such a student appears to tourists only as "supervised group session". In this pilot every request involving a student under 18 is refused (`student-awaiting-approval`). A tourist under 18 is not eligible.
- **Supervision (R-17).** A group session is valid only while the admin who created it is still an admin; demoting the admin stops new accepts in their sessions (`session-invalid`).
- **One-to-one** needs an eligible student with availability at that place. **Blocking** by either side stops the connection. **Minimum level** is A2.
- **Reason codes:** `location-not-approved`, `tourist-not-eligible`, `student-not-eligible`, `student-awaiting-approval`, `minor-one-to-one-blocked`, `session-invalid`, `not-available`, `blocked`, `level-below-minimum`, `unverifiable`. Any error during the check returns `unverifiable` (not allowed). Reasons are shown in plain language.

**Matching (R-18).** Ranked by 3 × shared interests + 2 × availability at the place + 1 × nearby area; ties by id. Only pairs that pass the safety rule appear. Ranking never favours the highest English level. Distance is an approximate label (under 2 km, 2–5 km, over 5 km) from the district centre, never coordinates.

**Privacy.** No exact location, phone number or email is stored or shown. Verification, level and age group are set by an admin on the server and shown read-only. **Chưa mở (pilot v1):** tourist connections (tourist identity verification is not built; group sessions are visible to admins only, so a place shows "Kết nối với du khách: Chưa mở"), one-to-one meetings, students under 18, and guardian consent (needs the email phase). Profile lists blocked users; block and report write `public.blocks` / `public.reports`.

| Behaviour | Slice acceptance criteria |
| :---- | :---- |
| Roles and navigation | Default role is Student; Profile switches role with a Demo label. Each role shows only its tab set (R-14); a tourist reaching a lesson, Tutor or progress view is redirected to Discover. Works at 360px, in Vietnamese and English, by keyboard |
| Approved places only | Discover and place detail list only approved places with existing name, description and image; an unapproved id shows a notice and returns to Discover (R-16) |
| Safety rule at action time | Every send and every accept re-runs the check. Changing the role, place or verification after sending cannot bypass it: an accept after the student's or tourist's eligibility changed is blocked with a reason (R-16) |
| Under 18 | One-to-one is blocked for any student under 18; in the pilot every request with a student under 18 is refused; a tourist under 18 cannot connect (R-17) |
| Admin | Admin actions exist only in the local admin console, never in the deployed site or service worker cache. The database refuses anon users, learners, admins without `aal2`, demoted admins and signed-out sessions on every admin read and RPC; each admin action leaves one audit row that nobody can update or delete (R-14, R-17) |
| Reasons | Each blocked action shows a plain-language reason mapped from the reason codes; missing data is treated as not allowed |
| Matching | Results contain no blocked or ineligible person, are ordered by the R-18 score then id, and show name, level, shared interests, approximate distance and a status label |
| Privacy and labels | No coordinates, phone or email anywhere; no simulated toggle or sample person exists; anything not built shows "Chưa mở" with a reason; blocked users can be listed and requests cancelled (via `connect-respond`), blocked or reported |
| Tests | Truth-table tests cover each reason code at least once, minor one-to-one always blocked, role change cannot send requests as student, accept re-checks, and stable match order |

This slice does not provide real identity verification, messaging, scheduling, payments, moderation staff or server enforcement; see Section 9 and Section 12.

# **6\. Vietnamese-Learner Pronunciation Error Taxonomy**

Vietnamese is a tonal, syllable-timed language. A syllable has at most one final consonant, final /p t k/ are unreleased, there are no consonant clusters and there is no native /θ ð ʃ ʒ tʃ dʒ/. Vietnamese speakers of English therefore show predictable error patterns. The Tutor classifies each pronunciation error into exactly one of the closed categories below. The stored ids are in code font; the app's Vietnamese and English labels live in `ERR_CAT`. Priority follows intelligibility: P1 errors most often cause misunderstanding, while P3 errors mainly affect naturalness or listening. Evidence, examples and practice items for every category are in the pronunciation lesson plan `docs/giao-an-phat-am.md`; its data is in `content/pronunciation/`.

| Category | Group (E-03) | Typical Vietnamese realisation | Detection signal | Detection confidence | Priority |
| :---- | :---- | :---- | :---- | :---- | :---- |
| `final_consonant` — Dropped, unreleased or glottalised final consonant (including final /l/) | Endings | “cat” → [kæ] or [kæʔ]; “nice” → [naɪ]; “ball” → [bɔː] | Expected final consonant missing, or heard as a glottal stop | High | P1 |
| `s_ed_ending` — Missing or wrong -s/-es/-’s and -ed endings | Endings | “books” → [bʊk]; “played” → [pleɪ]; “liked” → [laɪkɪd] | Expected suffix sounds missing when the target text is known (overlap rule below) | High | P1 |
| `final_voicing` — Final voiced consonant devoiced | Endings | “bed” → [bɛt]; “bag” → [bæk]; “eyes” → [aɪs] | Final /b d ɡ v z ʒ dʒ/ heard as its voiceless pair | Medium | P2 |
| `cluster` — Consonant cluster broken by an extra vowel or simplified | Clusters | “street” → [sə.tɹiːt] or [tɹiːt]; “first” → [fɜːs] | Inserted vowel inside or before the cluster, or one cluster consonant missing | High | P1 |
| `th` — “th” sounds /θ/ and /ð/ | Consonants | “think” → [tɪŋk]; “this” → [zɪs] or [dɪs] | /θ/ heard as /t s f/; /ð/ heard as /d z/ | High | P3 |
| `sibilant` — /ʃ ʒ tʃ dʒ/ versus /s z/ | Consonants | “ship” → [sɪp]; “she” → [siː]; “job” → [zɑːp] | Substitution among /s z ʃ ʒ tʃ dʒ/ | High | P1 |
| `consonant_sub` — Other substitutions: /v w j b/, /z j dʒ/, /l n ɹ/, initial /p/ | Consonants | “very” → [jɛɹi]; “yes” → [zɛs]; “light” → [naɪt]; “pig” → [bɪk] | Substitution within these sets (a trilled r is accepted) | Medium | P2 |
| `vowel_length` — Tense/lax pairs /iː–ɪ/ and /uː–ʊ/ | Vowels | “ship” and “sheep” both [ʃiːp]; “full” → [fuːl] | Vowel heard as the other member of the pair (by quality; duration is not judged) | Medium | P1 |
| `vowel_quality` — /æ ɛ ʌ/ and diphthongs /eɪ oʊ aɪ aʊ/ | Vowels | “cat” → [kɛt]; “cut” → [kɑːt]; “day” → [de]; “go” → [ɡo] | Vowel substitution, or a diphthong heard as a single vowel | Medium | P2 |
| `word_stress` — Wrong stressed syllable, including compounds, suffix shifts and noun/verb pairs | Word stress | “hotel” stressed on the first syllable; “photography” stressed like “photograph” | Relative length, loudness and pitch of each syllable versus the expected stress | Medium | P2 |
| `rhythm` — Syllable-by-syllable rhythm | Speech flow | Every syllable given equal length; a pause after each word | Variation of vowel lengths and pauses between words | Low | P3 |
| `weak_form` — Unstressed syllables and function words not reduced | Speech flow | “to” → [tuː]; “and” → [æn]; “a cup of tea” with full vowels | Strong vowel heard where a schwa or weak form is expected | Low | P3 |
| `linking` — Words not linked; glottal stop or pause before a vowel-initial word | Speech flow | “pick it up” → [pɪk ʔɪt ʔʌp] | Glottal stop, pause or inserted vowel at an expected linking point | Low | P3 |
| `intonation` — Tone-like pitch, wrong final rise or fall, or nucleus on the wrong word | Speech flow | A yes/no question ending in a fall; a high rise on every stressed word | Pitch direction at the end of the phrase; position of the main pitch movement | Medium (final rise/fall); Low (nucleus) | P2 |

**Detection confidence.** These ratings are design estimates and must be measured (Section 7.4).
- *High* and *Medium* categories may label error items (R-10) and lower the pronunciation score; Medium feedback is worded as a likely, not a certain, error.
- *Low* categories show a clearly labelled **reference score** and practice tips. They never become the category of an automatic error item, never count towards the radar or a unit pass, and their score is stored separately as a reference score.
- A category is moved to a lower confidence level if its agreement with teacher labels is below the pilot target (Section 14).

**Overlap rules.**
- Each mismatched sound gets one category. Precedence: `s_ed_ending` > `cluster` > `final_consonant` > `final_voicing` > the other categories.
- When the target text is known (Tutor, read-aloud), a missing ending is `s_ed_ending`. In free Roleplay speech, a transcript without the inflection (“three ticket”, “I visit yesterday”) is a grammar error, and no pronunciation error is logged for that word. A word never receives both.

**Accent and dialect.**
- Reference IPA is American (CMUdict). Non-rhotic, British, Australian and other accepted variants listed with each practice item are not errors. The aim is intelligibility, not a native accent.
- Vietnamese dialects differ. Northern speakers may say d/gi/r as [z]; Southern speakers may say v/d/gi as [j]. Central speakers, including Đà Nẵng, are reported to keep more of these distinctions; this report is unverified.
- The app does not detect or label dialect; it reports only the categories above.

*Validation of this taxonomy: collect a sample of student recordings at the pilot school and have an English teacher label the errors. Then report, per category, how often it occurs and how well the system detects it (precision and recall against the teacher's labels).*

Grammar issues use a separate closed set: `tense`, `agreement`, `article`, `word_order`, `other`. These are distinct from the pronunciation categories; a generic grammar label is not a pronunciation category.

<a id="assessment"></a>

# **7\. Scoring and Assessment Method**

## **7.1 Criteria and Sub-Criteria**

The four criteria follow the qualitative aspects of spoken language described in the Common European Framework of Reference for Languages (CEFR).

| Criterion | Sub-criteria (analysed in the background) | Source of the signal |
| :---- | :---- | :---- |
| Fluency | Speech rate (words per minute); number and length of long pauses; hesitations and self-corrections; ability to keep the conversation going | Audio timing from speech recognition; pronunciation-assessment fluency score |
| Vocabulary | Range of words used; use of the scenario’s target words; appropriateness of word choice | LLM analysis of the transcript against the target word list |
| Grammar | Errors per 100 words; tense and agreement accuracy; sentence complexity | LLM grammar analysis of the transcript |
| Pronunciation | Phoneme accuracy grouped as in Section 6: endings, clusters, consonants, vowels, word stress and speech flow (intonation). Low-confidence categories (rhythm, weak forms, linking) give a reference score and feedback only | Pronunciation assessment at phoneme and word level against the expected text; syllable length, loudness and pitch for stress and intonation |

## **7.2 Score Calculation**

* Each criterion is scored 0–100% per session as the average of its sub-criteria.

* The radar chart shows a rolling average of the learner’s last 5 sessions, so one bad session does not swing the chart.

* Tutor scores contribute to the Pronunciation criterion with lower weight than Roleplay scores, because repeating an isolated word is easier than pronouncing it in conversation. The initial Tutor contribution weight is **0.3** (`TUTOR_WEIGHT`).

* The initial pronunciation error-capture threshold is **60/100** (`PRON_THRESHOLD`): a word below this threshold creates an error item under R-10.

* These weights and thresholds are pilot starting assumptions, not validated findings. Recalibrate them using teacher-rated evidence (Section 7.4). Mastery uses the separate rule in T-05.

## **7.3 Indicative CEFR Mapping**

| Average score | Indicative band | Description |
| :---- | :---- | :---- |
| 0–39% | A1 | Can handle very simple, rehearsed exchanges |
| 40–59% | A2 | Can manage short social exchanges on familiar topics |
| 60–74% | B1 | Can describe experiences and places with reasonable fluency |
| 75–89% | B2 | Can interact with fluency and spontaneity on a range of topics |
| 90–100% | C1 | Can explain and interpret cultural topics fluently and precisely, sustaining extended talk |

*These cut-off points are initial assumptions. They must be calibrated against teacher ratings during the pilot and should never be presented to learners as an official certificate. C2 is outside this version. The B2 and C1 bands have the least evidence: automatic scores may not separate them reliably, so they need validation with advanced learners (Section 7.4) before being shown with the same confidence as lower bands.*

## **7.4 Validity Check**

To show the judges that the AI scoring is trustworthy, the team should run a simple reliability study:

1. Collect 30–50 short recordings from pilot students across several scenarios and CEFR levels, including some B2–C1 learners.

2. Have two English teachers rate each recording on the four criteria independently, using the same 0–100 rubric.

3. Compute agreement between the two teachers, then between the teachers’ average and the AI score (e.g., Pearson correlation).

4. Report the results honestly, including criteria where the AI is less reliable, and adjust weights or thresholds accordingly.

<a id="technology"></a>

# **8\. Technology Direction**

## **8.1 Platform Decision**

**Recommendation: responsive web application (installable as a Progressive Web App) for the competition prototype and pilot.** The project concept describes a web-based platform, while an earlier draft mentioned a dedicated mobile app. A web app is recommended for this phase because it runs on students’ phones and school computers without app-store approval, modern browsers support microphone and camera access, and the team ships one codebase. A native mobile app can be considered after the pilot if needed.

## **8.2 Target Architecture**

The following target choices consolidate the specific stack previously recorded in AGENTS.md. They describe the intended implementation, not services already connected. Model identifiers are project configuration targets; verify provider availability before integration and report any necessary change explicitly. They do not choose the coding agent's model.

| Layer | Choice |
| :-- | :-- |
| App | Next.js (App Router) + TypeScript (strict) + Tailwind CSS, PWA manifest + service worker |
| Charts | Recharts (radar E-02, progress lines E-06) |
| Auth + DB + storage | Supabase: Postgres with row-level security; anonymous sign-in in the testing stage (X-01); no audio storage |
| LLM | Claude API: `claude-haiku-5-5` for live character turns (latency), `claude-sonnet-5-5` for grammar feedback, error classification, tutor explanations and session summaries |
| Speech | Azure AI Speech for ASR with word timings, pronunciation assessment at phoneme and word level, and neural TTS (en-GB, en-US, en-IN, en-AU) |
| Recording | Browser MediaRecorder API, push-to-talk |
| Spaced repetition | `ts-fsrs` (T-06) |
| i18n | `next-intl`, messages in `messages/vi.json` and `messages/en.json` |
| Validation | `zod` at every trust boundary: request bodies, LLM JSON output, speech-service responses |
| Tests | Vitest for `lib/`; Playwright smoke test of the loop |

**Testing-stage build path (decision 22 November 2026).** Until a budget and a larger pilot exist, the build follows these choices instead of the matching target rows above. They are free, need no payment card and are sized for a few testers:

| Layer | Testing-stage choice |
| :-- | :-- |
| App | Existing static HTML/CSS/JavaScript prototype plus a PWA manifest and service worker; Next.js migration is postponed |
| Auth + DB | Supabase anonymous sign-in, Postgres tables with row-level security, local-first sync from `lt:` storage; publishable key only in the browser |
| Pronunciation scoring | Phoneme recogniser `wav2vec2-lv-60-espeak-cv-ft` (ONNX, Apache-2.0) run in the browser when the device can load it; otherwise, with the learner's consent, a free Hugging Face ZeroGPU Space; otherwise no automatic score (self-check). One scoring interface keeps the engine swappable (paid CPU Space or a school machine later) |
| Model audio (T-04) | Kokoro-82M (Apache-2.0) audio pre-rendered for every lesson-plan item in several en-US and en-GB voices and served as static files |
| ASR (Roleplay) | `whisper-tiny.en` in the browser for learner turns; character replies stay scripted until an LLM is added |
| Spaced repetition | `ts-fsrs` |
| LLM | The Supabase Edge Function `converse` uses **Groq** (`llama-3.1-8b-instant`, with Zero Data Retention enabled by the owner) with **Cloudflare Workers AI** (`@cf/google/gemma-4-26b-a4b-it`) as fallback. Live roleplay and Tutor explanations require a signed-in, online account whose adult status was verified and recorded by the server. Current signup provides no age verification, so those accounts use scripted practice. The provider receives the scenario and a screened current input. The app validates the full reply before displaying it. Quota exhaustion and service failure return the learner to scripted practice. |

The camera target uses **MobileNetV3Large image classification with TensorFlow.js inference in the browser**, specified in Section 8.5. Browser MediaDevices supplies camera frames; Geolocation is optional supplementary context, not a prerequisite for recognition. Map or Street View references, if used, must respect licensing, attribution and caching terms. An open phoneme-recognition model remains a research alternative for speech, separate from the landmark classifier.

## **8.3 Current Prototype Status**

The original repository inspection was on **12 November 2026**. The table includes the 22 November testing-stage source updates and the 24 November directions slice. Source checks and local tests do not establish a deployed release or device acceptance.

| Area | Current status | What this does not establish |
| --- | --- | --- |
| Application source | Static HTML/CSS/JavaScript prototype with separate screen, component, data and logic files. The Netlify build copies public app files to `dist/` and generates public configuration and security headers. PWA manifest and service worker are implemented; installation precaches HTML/scripts/styles/icons through the generated shell manifest, while other public resources are cached on demand. Runtime config and API traffic are excluded. CSP permits inline event attributes, blocks inline script elements/eval, and pins allowed CDN script paths; libraries also use integrity hashes | Completion of the Next.js/TypeScript target, deployed PWA installation, offline coverage for unvisited large resources, or phone acceptance |
| Learner journey | Clickable screens, two-step onboarding, place themes, sample conversations, Tutor and radar templates | Production authentication, measured speech scores or a connected LLM |
| Curriculum content (R-13) | As of 14 November 2026, the library holds the 10 original scenarios plus 15 lesson-derived scenarios (A1–C1) from the Đà Nẵng lesson plan. Each has a can-do goal, 9–10 words with IPA, a pronunciation focus word, scripted model turns and source line references, and every one is unverified. Since 16 November 2026, four A1–A2 camera landmark scenarios (Cầu Sông Hàn, Công viên APEC, Tượng Quan Âm, Tượng Cá chép hoá Rồng) give each camera class its own lesson; their facts cite lesson B1-05 or `docs/research-quan-am-ca-chep.md` and are unverified | Teacher verification, the other 15 lessons, journey placement (the journey still shows the original 10 stops) or a level filter in the library |
| Persistence | Local-first anonymous Supabase client, profile synchronization, error-row helpers and five RLS-controlled table definitions. Migration 0002 restricts table privileges to RLS-controlled CRUD. Two-identity SQL checks pass locally on embedded PostgreSQL; the hosted 0001 setup is reported in Claude's handoff, while 0002 has not been applied there in this turn | Hosted revalidation after 0002, complete pronunciation-progress integration, cross-device recovery, or research retention automation. No audio storage is implemented |
| Speech | Browser speech playback and simulated scores in the original Roleplay and Tutor. The separate directions slice uses browser mic capture and temporary local replay. | Azure ASR, automated phoneme assessment, neural TTS integration or validated accuracy |
| Directions slice (Section 5.8) | Fictional A2 directions maps, live listener form and local task outcomes. The follow-up selects a final /t/ activity after a human observation and gives an immediate and delayed new-map task. | Accuracy of automated feedback, effectiveness of the activity, or school pilot approval |
| Camera — repository integration | Since 16 November 2026: model v4 (MobileNetV3Large, 5 classes: Cá chép rồng, Cầu Rồng, Cầu Sông Hàn, Công viên APEC, Tượng Quan Âm – Chùa Linh Ứng) exported to a TensorFlow.js graph model in `model/` (float16, about 6 MB), run with TensorFlow.js 4.22. Live scan and photo matching both apply a 0.85 threshold and the 20-point top-1/top-2 margin (C-04); classes are mapped by name only, and each opens its own lesson. Four matching location records were added (unverified). Separate labelled simulation modes remain | A trained khac class, 25-landmark coverage, a field test on phones, measured latency or teacher-verified facts for the new places |
| Verification | Automated checks cover templates, existing diagnostics, saved state and navigation recommendations | Device permissions, measured latency, a completed pilot or visual approval at every supported size |

The ignored Next.js sandbox is separate from the configured static deployment. See README.md for current run commands. Historical proposal/pitch dates below are planning records; this status update does not certify what was demonstrated at those events.

### Camera Experiment Reported by the Owner

The owner provided the following experiment status for this revision. It is **user-reported evidence, not an independently reproduced result** and not the same artifact as the Teachable Machine bundle inspected above.

| Item | Reported status | Interpretation / missing evidence |
| --- | --- | --- |
| Classes | 2: Cầu Rồng and Hội An | Does not cover the planned 25 landmarks plus khac; a trained khac class has not been reported |
| Dataset | 26 training images and 23 validation images | Very small sample; class counts, session-based split and near-duplicate audit still need documentation |
| Validation accuracy | Approximately 83% | Preliminary figure on the 23-image validation set; insufficient to establish field accuracy, per-class quality, reliable unknown rejection or 26-class performance |
| Pipeline | Training through prediction has run end to end | Notebook, training logs, classification report, confusion matrix and matched export/labels artifacts have not been supplied for verification in this revision |
| Web deployment | Owner describes SavedModel → tensorflowjs_converter → browser inference on Netlify as the current deployment route | Does not establish that the new MobileNetV3Large artifact has replaced the repository model or has been tested on the hosted site and target phones |

**Teachable Machine v3, reported 14 November 2026.** The team reports that model v3 is more accurate than v2 on a batch test, and that the uncertain-result rate fell after adding a rule requiring the top-1 class to exceed the top-2 class by at least 20 percentage points. On 36 test images, 32 were correct (88.9%; the 95% Wilson interval is roughly 75–96% at this sample size). Two of the four errors confused Cầu Rồng with the Han River Swing Bridge. EchoLạc reproduced this result from the supplied `landmarks.keras` and test set (labels assigned by Claude from the images, pending team confirmation): 32/36 top-1, with all four errors on Cầu Rồng photos taken from far away or the air; Grad-CAM shows the model reading river-and-skyline context instead of the arches. See `docs/camera-v3-diagnosis.md`. The training set and session split were not supplied, so train/test leakage is unchecked.

No full 26-class training, independent field-test result, phone latency/memory measurement or final release package is claimed. Attach the actual artifacts and reports before changing these entries to verified implementation or measured findings.

## **8.4 Non-Functional Requirements**

| Area | Requirement |
| :---- | :---- |
| Response time | AI voice reply starts within about 3 seconds of the learner finishing a turn; pronunciation score within about 3 seconds. |
| Connectivity | First installation, anonymous account enrollment and cloud synchronization require internet. After successful service-worker installation, the static shell is available offline and changes stay local until reconnection. Large images/models and lesson resources are not all precached; remote scoring always needs internet. Full offline learning remains deferred. |
| Devices | Works on recent Android and iOS phone browsers and on desktop Chrome/Edge; usable on a 360px-wide screen. |
| Cost control | Testing uses free plans. The `converse` Edge Function reserves up to 40 AI turns per eligible account and 100 turns across the project per UTC day (migrations 0004 and 0006). A reservation counts even if the provider fails. Each reply has an output cap of 180 tokens. The app falls back to scripted practice when the daily quota is exhausted or the providers are unavailable. The app's caps are independent of the provider quotas, which may change. |
| Accessibility | Subtitles, adjustable speech rate, touch targets ≥44px, text contrast ≥4.5:1, readable font sizes and reduced-motion support. Detailed visual and interaction requirements are in Appendix C. |
| Interface states | Relevant screens provide loading, empty and error states. Recording always visibly distinguishes idle, listening, processing and scored. |
| Camera performance | Measure cold model-download/load time, warm inference latency, live sampling rate and peak memory on named target phones/browsers, with model version and network conditions. Acceptance budgets remain to be set; the speech-response target above is not a measured camera result. |

<a id="camera-model"></a>

## **8.5 Camera Model, Data, Training and Deployment Specification**

This specification implements the intended behaviour of R-11 and C-01–C-09. Architecture and training values below are the owner's proposed configuration. They are not a validated optimum or evidence of a completed 26-class release. Section 8.3 records the smaller reported trial and the separate repository integration.

### 8.5.1 Architecture and Input/Output Contract

| Element | Target specification |
| --- | --- |
| Task | Multi-class, single-label classification; final release has 26 outputs: 25 landmarks plus khac |
| Backbone | MobileNetV3Large, ImageNet-pretrained, original classification head removed (`include_top=False`) |
| New head | Global average pooling → Dropout 0.3 → Dense(K, softmax), where K equals the exact class count in that model release |
| Input | RGB, 224×224; float32 pixels in the 0–255 range, normally supplied as a batch of one image for browser inference |
| Preprocessing | Retain MobileNetV3's internal normalization (`include_preprocessing=True`). Do not divide pixels by 255 again. Verify that the exported graph includes the same preprocessing and that RGB conversion, crop/resize, channel order and input signature match training |
| Output | K softmax scores; label at index i is exactly line i of the paired labels.txt. Return top-1 label and score to the application, which may reject the result under Section 5.5.3 |
| Package size | Approximately 25 MB for .keras is the owner's estimate, not a measured release size. Measure the training artifact and the complete web bundle separately, including all weight shards |

The 0–255 input contract is conditional on internal preprocessing actually being present; Keras documents that behaviour for MobileNetV3 with preprocessing enabled. An export that changes it requires an explicit contract update and parity check. [Keras MobileNet documentation](https://keras.io/api/applications/mobilenet/mobilenet_models/).

Training-only augmentation: horizontal flip, rotation factor approximately ±0.05 of a full turn, zoom around 15%, contrast variation around 20% and brightness variation around 20%. Record exact layer parameters and pixel ranges in the training configuration. In Keras, rotation factor 0.05 means up to approximately **±18°**, not ±5°; confirm whether that matches the intended “±5%” setting. Do not silently reinterpret it as five degrees. Validation and inference must be deterministic with augmentation disabled. [Keras RandomRotation documentation](https://keras.io/api/layers/preprocessing_layers/image_augmentation/random_rotation/).

### 8.5.2 Dataset Requirements

- Organise labelled data as `train/<class-name>/` and `val/<class-name>/`. Preserve one explicit class-index order across training, validation, export and labels.txt; do not independently infer incompatible directory orders.
- Aim for **150–300 training images per landmark** and at least **20–30 validation images per landmark**. The proposed `khac` collection is **300–500 images**; its training/validation allocation and an independent test set still need to be specified.
- Cover different viewpoints, distances, times of day, weather, lighting, devices and partial occlusions. Include plausible unsupported landmarks and ordinary non-landmark scenes in khac rather than treating a narrow background set as representative of every unknown input.
- Split by **capture day/session**, keeping near-duplicate photographs, adjacent video frames and derivatives of one source in the same split. Do not randomly split nearly identical frames between training and validation. Apply augmentation only after assigning source images to the training split.
- Log per-class counts, capture-session grouping, image provenance/permission, dataset version and duplicate checks. Location content and image labels require review; historical/cultural fact verification remains separate from image-classification accuracy.
- Collect fresh real-world images on different capture sessions for an independent field-test set. Do not use that set to choose thresholds, checkpoints or augmentation settings.

### 8.5.3 Proposed Training Procedure

Run training on a Google Colab GPU, record framework versions, dataset/split version, random seed, model settings and training history. Use sparse categorical crossentropy with integer class labels. Initial batch size is **32**; consider **8–16** for the very small-data trial or resource constraints, and measure the effect rather than assuming smaller batches improve accuracy.

| Stage | Trainable components | Optimizer / learning rate | Proposed limit and callbacks |
| --- | --- | --- | --- |
| 1 — Train the new head | Backbone frozen; pooling/classification head attached | Adam, 1e-3 | Up to 10 epochs; EarlyStopping monitors val_loss and restores best weights |
| 2 — Optional fine-tuning | Unfreeze roughly the final 30 backbone layers while keeping BatchNorm frozen | Adam, 1e-5; recompile after changing trainable layers | Up to 20 epochs; EarlyStopping on val_loss plus ReduceLROnPlateau |

The initial sample workflow monitored val_accuracy; the revised proposal uses **val_loss** for early stopping. Patience, learning-rate reduction settings and the exact trainable-layer list remain to be recorded. Skip stage 2 when data is insufficient or validation does not justify fine-tuning; do not infer that it was run for the reported experiment. The 26-image trial is a pipeline check, not evidence that either schedule generalises.

### 8.5.4 Evaluation and Release Evidence

- On validation data, report `classification_report` (precision, recall, F1 and support per class), macro/weighted summaries, top-1 accuracy and a confusion matrix. Keep prediction order aligned with ground-truth labels and labels.txt.
- Use validation to select the checkpoint, confidence threshold and live-smoothing configuration. Report **0.7 as provisional** until selected and documented; do not tune on the independent field-test set.
- Test the frozen release on fresh real-world images captured on different days/sessions from development data, including varied views of wide locations such as Hội An Ancient Town.
- Include supported-landmark accuracy, acceptance coverage, uncertain/rejected cases, khac recall and false acceptance of unsupported images as a landmark. A high aggregate accuracy alone does not establish reliable unknown rejection.
- Evaluate live-frame stability and delay on phones, and report failures separately from still-image accuracy. Repeat evaluation after conversion or quantization; compare label order and predictions against the original model on the same fixed fixtures within a documented tolerance.
- Attach dataset/split identifiers, per-class counts, reports, training logs and the tested artifact version. Numeric release targets, tolerances and minimum field-test sample sizes remain **to be agreed by the team**; do not invent passing results.

### 8.5.5 Browser Deployment and Versioned Artifacts

The current web delivery target remains static hosting on **Netlify with HTTPS**. Export the trained model to SavedModel, then use `tensorflowjs_converter` to produce a TensorFlow.js model.json and weight files for **on-device browser inference**. Record the export signature, runtime/converter versions and output format; a converted GraphModel must be loaded through the matching graph-model API rather than the existing Teachable Machine-specific loader. Conversion must check supported operations, and a successful conversion alone does not prove prediction parity or phone compatibility. [TensorFlow.js conversion guide](https://www.tensorflow.org/js/guide/conversion).

Each release is an inseparable versioned package: **model + all weights + labels.txt + metadata**. Metadata records the input contract, output class count/order, class-to-location mapping, confidence threshold, smoothing settings, dataset/split version, metrics and checksums. A two-class experimental package must declare K=2; the final package must declare K=26 including khac. Do not label one as the other.

Load the model and labels from the same release path and deploy them together. Check artifact versions, label count, unique labels, required khac coverage for the final release and mapping to enabled location records. Fail safely if validation fails; do not guess label indices or mix cached weights with a newer labels file. Train again only with a new documented release and repeat the conversion/parity checks.

Measure bundle size, cold loading time, warm latency and peak memory on the supported phone/browser matrix. Quantized or float16 artifacts may reduce download size, but file-size savings, runtime speed, memory use and accuracy must be measured for each export; float16 storage does not guarantee float16 execution or a faster browser. Future LiteRT/TFLite export should follow the tooling's then-current quantization path. [Google AI Edge float16 guidance](https://developers.google.com/edge/litert/conversion/tensorflow/quantization/post_training_float16_quant).

### 8.5.6 Future Mobile and Class Expansion Options

The immediate phone target is the web app in a mobile browser. TFLite/LiteRT or Core ML on iOS is a **future research/export option** if a native-app phase is separately approved; native apps remain excluded from the present version (Section 3).

Adding a recognition class requires labelled data, classifier retraining/fine-tuning, evaluation and a new paired model/labels release. For frequent catalogue expansion, embedding-based retrieval with a model such as CLIP or DINOv2 may be researched later. It is not the current architecture or evidence of better performance on this dataset.

<a id="privacy"></a>

# **9\. Data Privacy and Safety**

Most primary users are under 18, and the product records their voices, so privacy and safety must be designed in from the start.

> **Owner decision, 26/11/2026: adults only for the public launch.** Signup keeps the guardian-consent box for under-18 test accounts, and the server marks every account adult (`app_metadata.echolac_verified_adult`, migration 0007), so live AI (Groq, Cloudflare) is open to all accounts within the quota. The under-18 rules below (guardian consent, R-17 supervision) stay in the code and apply again if minors are admitted later; that requires real age verification and an approval flow first.

* **Consent:** obtain approval from the school and consent from parents or guardians before students take part in the pilot, in line with Vietnam’s personal data protection regulations.

* **Data minimisation:** store transcripts, scores and error categories. **In the testing stage no raw audio is stored anywhere.** Pronunciation scoring runs in the browser where possible. Sending a recording to the remote scoring server (Section 8.2) requires the learner's explicit consent, shown before the first upload and revocable in Profile; the recording is used only to compute the score and is not stored or logged by EchoLạc. The server is a Hugging Face Space hosted outside Vietnam. A later `keep_audio_for_research` flow needs separate guardian consent and is not part of this stage.

* **No advertising or data sale:** learner data is used only to provide the service and, with consent, for anonymised research analysis. Do not include advertising or analytics SDKs.

* **Camera and location:** explain the purpose before requesting camera permission, and request it only when the learner opens capture. Run landmark inference locally; do not upload or retain photographs, probability vectors or continuous footage by default. GPS is separately consented and optional; denying it does not block image recognition. Do not store precise location history or expose the learner's location to others. Learners can delete their learning history. A separate, explicit contribution/research consent is required before reusing learner photographs as training data; document image rights and handling of identifiable people.

* **AI guardrails:** AI characters stay on the scenario topic, keep language age-appropriate and decline unrelated or inappropriate requests. The current signup route does not verify age. Learners under 18 and accounts of unverified age use scripted practice without sending their speech or typed replies to an AI provider. The server checks current eligibility before processing a live turn, screens current input and the complete reply for recognised contact details and unsafe requests, and discards client-supplied conversation history before the provider call. Screening is limited to recognised patterns.

* **Anonymised reporting:** results presented at the competition use aggregated or anonymised data only.

* **Access control:** row-level security applies to every learner-data table. Learners, including anonymous accounts, read and write only their own rows. There is no teacher or class access in this version (X-05). Global admins (R-14) read only the Local Guide Connect tables, through RLS that requires an MFA (`aal2`) session; learner progress tables have no admin access.

* **Local Guide Connect (R-14 to R-18):** role, verification, level, age group (set by an admin) and the connection check come from the server only (no on-device simulation); tourist identity verification and guardian consent are not built and show "Chưa mở". The checks run on the server (Supabase RLS policies and an Edge Function re-evaluating the R-16 rule on every request and acceptance), with real identity and age verification, guardian approval records, an admin audit log, and admin moderation of blocks and reports. Share no exact location, phone number or email; students under 18 never get one-to-one contact. Without those controls the feature must not be used with real tourists or students.

* **Microphone explanation:** before the browser permission prompt, show a short Vietnamese/English explanation of why audio access is needed.

* **Service access and cost:** private service credentials stay on the server. In the testing stage the browser receives only the Supabase publishable key (or legacy anon key), with RLS enabled; it never receives a service-role key. In the target speech architecture it receives short-lived speech tokens. Server-side AI-minute and monthly-spend limits follow Section 8.4 when those services are implemented; they are not evidence of controls already deployed.

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

## **10.3 Directions Slice Feasibility and Study**

1. Check the task first with a small group after school approval and the applicable permissions in Section 9. Check whether a final /t/ omission is observable and useful to address in this task. Revisit the target if vocabulary or map comprehension causes most difficulty.
2. Before enabling automatic error reports, have two teachers independently label acceptable variants, confirmed omissions and unclear tokens. Keep validation speakers separate from calibration speakers. Predefine tolerances and report false error flags, recall of labelled omissions, abstentions, and device latency with denominators. Assess on target Android/iOS devices and keep human feedback or self-practice available if the automatic option fails the gate.
3. For the learning study, use parallel map forms, counterbalanced order and group assignment after baseline where practical. Match speaking opportunities, practice time and vocabulary exposure between arms. The intervention selects a drill using the learner's error, and the active control follows a fixed drill schedule. Study administration is external to the first slice. It uses Section 9's approval and consent process and a live listener procedure compatible with no retained audio.
4. Primary outcome is the count of three instruction details independently understood on a new map at day 7. A reader of the map who does not know the study assignment marks turn, landmark and destination. Secondary outcomes include immediate transfer, production of previously unpractised target words and learner confidence. Predefine a useful effect and how missing results will be handled. Report counts, listener agreement, between-group change, uncertainty, dropouts and feasibility limits. Without a comparison arm, report feasibility and observed change.
5. Expand scenarios and calibrated error categories once there is credible new-task improvement and the feedback is usable on target devices. Rework the drill if gains appear only in practised words. Camera recognition and its contribution to finding a lesson have a separate evidence track.

# **11\. Social Impact and Sustainability**

## **11.1 Social Impact**

The platform gives local students and tourism workers a digital tool to introduce their heritage and cultural identity confidently to international visitors. It aims to improve foreign-language confidence among young people and contribute to the quality of local tourism services, while encouraging pride in local culture.

## **11.2 Implementation and Sustainability Model**

* **Phase 1 – free for education:** free access for students at the pilot school to encourage adoption and collect research data.

* **Phase 2 – freemium:** core features free; advanced features (more scenarios, unlimited AI minutes, additional characters) paid.

* **Phase 2 – sponsored deployment:** schools, local tourism associations or the city’s tourism department sponsor access for students and workers.

Phase 2 funding options are future directions requiring a later scope decision. They do not authorise payments or paid-feature implementation in the current version, whose exclusions remain in Section 3.

# **12\. Risks and Mitigation**

| Risk | Impact | Mitigation |
| :---- | :---- | :---- |
| Speech recognition misreads accented speech and blames the learner for its own error | Unfair scores; learner frustration | Use pronunciation assessment against the expected text where possible; flag low-confidence results instead of scoring them; validate with teacher ratings |
| Automatic detection mislabels stress, rhythm or connected-speech errors, or flags acceptable accent and dialect variants as errors | Wrong feedback; learners practise the wrong thing or lose trust | Give every Section 6 category a detection confidence; low-confidence categories give a labelled reference score and tips only, never error items or radar points; accept listed accent variants; measure per-category agreement with teacher labels (Section 7.4) before raising a category's confidence |
| Pronunciation lesson content contains wrong IPA, false minimal pairs or unsuitable explanations | Learners practise wrong models | Generate IPA from CMUdict, check minimal pairs automatically, and keep every unit unverified until an English teacher reviews it with the checklist in `docs/giao-an-phat-am.md` |
| Free remote scoring (Hugging Face ZeroGPU) runs out of daily quota, sleeps or changes terms; its endpoint is public in the testing stage | Learners on weak phones get no score; strangers could use the quota | Try on-device scoring first; fall back to self-check without a score and say why; keep the scoring interface swappable; add authentication and rate limits, or a paid CPU Space, before a wider pilot |
| AI gives wrong facts about landmarks or history | Learners repeat misinformation to tourists | Ground every scenario in a teacher-verified fact sheet; instruct the AI to stay within it |
| Curriculum source material mixes outdated and current facts or contains errors (for example, wrong compass directions, or pre- and post-2025 administrative data) | Learners study wrong or outdated facts | Match each fact to its source, add “as of” dates and require teacher verification before release (R-04, R-13) |
| Scores for advanced learners (B2–C1) are less reliable than for lower bands | Misleading level estimates for advanced learners | Present bands as estimates; include advanced learners in the validity study (Section 7.4) |
| Camera recognition identifies the wrong landmark | Learner studies the wrong content | Apply provisional confidence rejection and measured frame-stability rules; show the proposed label and let learners retake or browse manually. GPS is optional context, never proof that the image is correctly classified |
| Small or leaking image dataset inflates validation accuracy | Misleading claims; poor field performance | Separate capture sessions and near-duplicate groups, report per-class support and evaluate on fresh independent field images. Treat the reported 83% on 23 validation images as preliminary |
| Closed-set softmax confidently assigns an unsupported image to a landmark | Wrong lessons even when the displayed score is high. Measured on 14 November 2026: 5 of 10 CC-licensed photos of the Cá chép hoá Rồng statue beside Dragon Bridge were accepted as the Lady Buddha (scores 0.79–0.97) even under the 0.75 + margin rule. Model v4 (16 November 2026) adds that statue as a class and recognises all 5 distinct photos, but unrelated places still have no khac class | Train a diverse khac class (including look-alike statues and the other Han River bridges near supported places), calibrate rejection using validation data and measure unknown false-acceptance rate. Neither khac nor a fixed threshold guarantees rejection of every unfamiliar image |
| A broad location has many visually different scenes, such as Hội An Ancient Town | Low recall or confusion with similar places | Collect varied views and occlusions, inspect per-class confusion and document the recognisable coverage; avoid extrapolating from distinctive structures to every scene |
| Conversion, preprocessing or model/labels versions do not match | Silent class swaps, wrong confidence or failed inference | Version artifacts together, validate input range and label order, use the correct TensorFlow.js loader and run fixed-fixture parity tests after conversion/quantization |
| Model is slow or memory-heavy on phones | Camera stalls or model fails to load | Measure the complete download, cold loading, warm latency and peak memory on target devices; adjust sampling and export settings only with measured accuracy/performance evidence |
| Location catalogue grows without retraining the classifier | New destinations appear selectable but cannot be recognised | Separate content management from recognition coverage; retrain and publish a paired model/labels release for new classes. Keep embedding retrieval as a future research option |
| Reference imagery is used outside its licence | Legal and attribution problems | Use supported APIs and permitted references; do not scrape or permanently copy Street View imagery; use team-owned photographs where possible |
| Local Guide Connect puts a minor in contact with an adult stranger (R-14 to R-18) | Child-safety harm; pilot and school approval withdrawn | Under-18 students: supervised group sessions only, never one-to-one; adult-and-verified rule for tourists; check re-run at every action; missing data means not allowed; server enforcement, real verification and moderation required before real use (Section 9) |
| An unbuilt check is mistaken for a real one | False sense of safety; unsafe real-world meetings | No simulated checks in the app; eligibility comes only from the server; unbuilt parts (tourist verification, guardian consent, one-to-one) show "Chưa mở" and stay off |
| Matching or place detail leaks exact location or contact details | Privacy harm to students | Distance as approximate band only; no coordinates, phone or email stored or shown; approved places only |
| AI response delay breaks the conversation | Poor experience | Stream replies; show subtitles as soon as text arrives; choose fast models |
| API costs exceed budget | Service limits during pilot | Daily usage caps; cache TTS for fixed sentences such as vocabulary audio |
| Privacy concerns about recording minors | Pilot not approved | Consent process, short audio retention, anonymised reporting (Section 9\) |
| Learners lose motivation after the first week | Weak pilot data | Short sessions, streaks, unlockable characters, teacher encouragement |
| Scope too large for the deadline | Unfinished demo | Focus the demo on the full loop with 2–3 polished scenarios (Section 3\) |

<a id="roadmap"></a>

# **13\. Roadmap**

| Phase | Timing | Deliverables |
| :---- | :---- | :---- |
| 0 – Proposal | By 28 Oct 2026 | This PRD submitted |
| 0 – Pitch | 30 Oct 2026 | Idea pitch with demo or clickable prototype of the full loop |
| Testing-stage directions slice | Before full service integration | Working learner/listener flow, one targeted follow-up, immediate and day-7 maps. Study readiness and automated feedback have separate gates in §10.3. |
| 1 – MVP | \[Team to set\] | All Must requirements; 8 scenarios; working radar chart |
| 2 – Pilot | \[Team to set\] | 4-week pilot at Phan Chau Trinh High School; scoring validity study |
| 3 – Extension | After pilot | Should and Could features; remaining A1–C1 curriculum scenarios (R-13); tourism-worker scenarios; teacher dashboard |

## Camera Extension Track (Could; Proposed Gates)

This track elaborates the existing optional camera feature; it does not displace the Must learning loop or claim completion from a written plan.

| Gate | Deliverable / exit evidence | Current status |
| --- | --- | --- |
| Small pipeline experiment | Record the actual classes, dataset counts, training configuration and predictions | Owner reports a 2-class trial; reproducible artifacts still needed (Section 8.3) |
| Dataset and class contract | Confirm 25 landmarks plus khac, session-separated datasets, labels order and licensed image sources | Planned; full class list and dataset coverage not supplied |
| Model and independent evaluation | Train the intended class coverage, publish class-level reports and freeze threshold/smoothing before the independent field test | Planned; no full 26-class result claimed |
| Browser/phone release | Deploy matching TensorFlow.js artifacts and labels on Netlify; verify conversion parity, permission/error flows, resource budgets and real-phone behaviour | Planned; new MobileNetV3Large integration not verified in the repository |
| Optional later export research | Evaluate TFLite/LiteRT or Core ML only if a later mobile phase is approved | Future option; native-app development is outside this version |

# **14\. Open Questions**

1. ~~Final product name.~~ Resolved: **EchoLạc** (Section 1.4).

2. Current prototype status and what will be demonstrated on 30 October.

3. Team members and their roles (front end, back end, AI, content, research).

4. The competition’s official report template, if one exists, so this document can be adapted to it.

5. Whether the pilot school has approved the study, and how many students can participate.

6. Budget available for AI and speech API usage during development and the pilot.

7. Who will verify the cultural fact sheets for each scenario.

8. The exact 25-landmark class list, the stable labels.txt order and the mapping from each class to an enabled, verified lesson.

9. The khac training/validation allocation, independent field-test size and capture-session provenance for the existing 26/23-image trial.

10. The training notebook/logs and matched MobileNetV3Large model/labels artifacts needed to reproduce the reported approximately 83% validation accuracy.

11. The intended rotation range (±5% of a full turn versus ±5°), exact augmentation settings and whether stage-2 fine-tuning was actually run in the trial.

12. The release confidence threshold, live-smoothing window/interval/stability rule, evaluation tolerances and acceptable unknown false-acceptance rate.

13. Target phone/browser versions, model download/load/latency/memory budgets and evidence that the new artifact is running on the hosted Netlify site.

14. Which Đà Nẵng curriculum lessons enter the first release, and who verifies facts that the source notes cannot confirm (Section 5.7).

15. How B2–C1 learners will be recruited for the scoring validity study (Section 7.4).

16. Which English teacher reviews the pronunciation lesson plan (`docs/giao-an-phat-am.md`) and sets each unit's verified flag, and which reference accent the review uses (the data is American CMUdict; R-06 also offers British, Indian and Australian voices).

17. The per-category detection accuracy required before a Section 6 category may label error items or count towards scores, and the size of the teacher-labelled sample used to measure it (Section 7.4).

18. Which dialect features (Section 6) Đà Nẵng pilot students actually show, so pronunciation units can be prioritised for that group.

19. Budget for reliable remote scoring before a wider pilot (for example Hugging Face PRO at about 9 USD per month, or a school machine), and who holds the account.

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
| Single-label multi-class image classification | Assigning one top-1 class to an image from a fixed class set; the application can still reject that prediction |
| khac | The explicit “other / not a supported landmark” class; it is not a destination and does not cover every possible unfamiliar image perfectly |
| Softmax confidence | A model score relative to its known classes, not automatically an empirically calibrated probability that its answer is correct |

<a id="product-ui"></a>

# Appendix C. Product Design and Interaction Requirements

These detailed specifications were transferred from AGENTS.md. They refine existing requirements and do not change their MoSCoW priority. Implementation mechanics remain in AGENTS.md.

## C.1 Visual Language and References

**References:** the 22 phone mockups in `c:\Users\HI\Desktop\Nam\Design\`. They come from a generic study app, so take the visual language from them and replace the content with EchoLạc's.

**Logo:** a gold Đông Sơn Lạc bird flying around a bronze globe. The source is `echolac-logo.html`, and the exported files are `assets/logo.svg` (in-app use) and `assets/logo-32.png` / `logo-192.png` / `logo-512.png` (favicon, home-screen icon). It appears on the auth screens, the splash, the browser tab and as the AI Tutor avatar. The name is always written **EchoLạc**, with the Vietnamese "ạ". In file names and code identifiers use `EchoLac` or `echolac`. The wordmark uses the logo's own colours: "Echo" in bronze `#6B3F1D`, "Lạc" in gold `#C98A1B`. Use these two colours only for the logo and wordmark, not for UI.

**Colour reference:** `Design\Thiết kế chưa có tên.png`. It is the Home screen recoloured in a warm cream-and-taupe palette, and it overrides the blue of the other mockups. Take layout and components from the 22 mockups and colour from this one.

**Mood:** calm, soft, encouraging, warm like lantern light on old Hoi An walls. A safe place where a nervous 16-year-old dares to speak out loud.

## C.2 Design Tokens

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

## C.3 Place Themes (X-06)

The cream-and-taupe palette above is the default theme (`other`, "Nơi khác"). Picking a place in onboarding step 2, or later in Profile → Settings, repaints the whole app.

Colour, scenery, frame and ambient effect transition together over **400 ms**. Implementation details for the single theme source are in AGENTS.md.

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
| `other` | Nơi khác | EchoLạc emblem (bird + globe, `assets/logo.svg`) in logo bronze `#6B3F1D` at ~10% opacity on the cream ground, where other places show their scene | `#726958` | taupe `#9C8466` + logo gold `#C98A1B` | none | none |

Theme acceptance:
- Text contrast is at least 4.5:1 for navy/muted/faint text on the theme background, muted text on cards, faint text on white, and white text on the darker primary action surface.
- Pattern and landmark scenery span the full page height and remain behind content; ambient effects stay fixed to the viewport.
- Under reduced motion, ambient movement stops; theme colours still change.
- Picking a place gives a short colour burst from the tapped card, subject to reduced-motion preferences.

## C.4 Onboarding (X-01, X-06)

1. **Step 1 · `#signup` "Tạo tài khoản".** Testing-stage fields: name (2–60 characters), date of birth (age 6–100), optional gender (radio group), and required agreement to the described local saving and anonymous synchronization. No email, password, Google sign-in or class code is collected (X-01). Determine age by calendar birthday; under 18 requires a second "parent or guardian agrees" checkbox. Save locally and go to step 2 without waiting for the network; full date of birth and gender stay on the device, while only birth year goes into the cloud profile. Voice upload requires separate, revocable consent.
2. **Step 2 · `#place` "Nơi gắn bó với bạn".**
   - **Toggle:** Quê hương / Điểm đến (`role="radiogroup"`, arrow keys). The subtitle changes with it.
   - **Place grid:** 10 cards (`<button aria-pressed>`; same grid in Settings), each with the place's first scene as its thumbnail (theme icon until scene images exist), its name and "N địa danh · names" for the supported landmarks, at most 2 lines. A ring and a tick mark the choice; tapping previews the theme, with a "Giao diện: …" line below.
   - **Landmark line art:** the five camera landmarks use owner-drawn line icons (`assets/landmarks/<location id>.png`), tinted with the theme's navy, on the recognition sheet and place lists.
   - **Icon set:** all interface icons follow the owner-drawn black line style (calligraphic, tapered strokes), tinted by the theme: 24 navigation/UI icons (`assets/icons/ui/`), 23 lesson illustrations (`assets/icons/lesson/`, replacing the glossy 3D set where a drawing exists) and 10 place icons for the place picker (`assets/icons/place/`). Names not yet drawn keep the previous icon. The 25 painted 2.5D scenes (`assets/scenes/<place>/`) are the page background when a place is chosen.
   - **Navigation:** Back returns to step 1 with everything kept. **Bỏ qua** uses the default theme. **Bắt đầu hành trình**, enabled only once a place is picked, saves and opens Home.
3. **Saved data:** `{ placeType: 'hometown' | 'destination', placeId, themeId }` on the learner account. The theme persists after reload. A preview is saved only when the learner presses a step-2 button.
- A progress indicator (`steps(n)`, "Bước 1/2" / "Bước 2/2") sits at the top of both steps.

## C.5 Cold-Start Splash

- **Colours:** logo colours only: `--echo-cream #FFF4E1`, `--echo-bronze #6B3F1D`, `--echo-gold #C98A1B`, plus their `rgba()` tints. Theme colours never apply here. Ground: cream; wordmark "Echo" in bronze, "Lạc" in gold; the slowly turning drum pattern behind the logo tile is bronze at low opacity.
- **Timing:** it stays at least 2.4s (1.8s with reduced motion), waits for fonts, and never stays past 4s.
- **Exit:** the first screen renders underneath, then the splash fades out (400ms), so that screen's own entrance plays in view.
- **Reduced motion:** logo and text fade only. No particles, rotation, sheen or pulse.

## C.6 Screen Patterns

| Reference pattern | EchoLạc screen |
| :-- | :-- |
| Full-width bottom bar (Figma "Home", 390×844): icon + label per tab, a short navy bar marks the current tab, white 94% with blur | Tab bar by role (§5.9, R-14). **Student:** 4 tabs **Học/Home `#home`, Nhập vai/Roleplay, Kết nối/Connect `#connect`, Hồ sơ/Profile `#profile`**; Tutor and Radar open from Home shortcuts. **Tourist:** 3 tabs **Khám phá/Discover `#discover`, Kết nối/Connections `#connections`, Hồ sơ/Profile**. Earlier 5-tab layout (Home, Roleplay, Tutor, Radar, Profile) is replaced. Existing detail follows. **Nhập vai/Roleplay** (and the Home "Nhập vai" shortcut) opens a small popup menu instead of navigating: **Luyện tập/Practice** (Da Nang question bank, `#practice/danang`), **Luyện tập nói/Speaking practice** (Da Nang directions slice, `#practice/directions`, §5.8), **Nhập vai văn hoá/Cultural roleplay** (landmark journey, `#roleplay`). The menu has a close button and closes on outside tap or Escape |
| Auth form: label above the field, icon at the start, inline green check, terms checkbox, gradient CTA enabled once the form is valid | Onboarding step 1 (see **Onboarding** above). **Testing stage:** no email or social sign-in; returning on the same device continues the anonymous account (X-01) |
| "Welcome!" success screen with a check badge and 3 feature rows | Not used. Onboarding goes straight from step 2 to Home |
| Home (Figma file 4gfregjNxYiakVtWeSTKiD, "Screens & Motion"): floating cards over the place scene: initials avatar + bell; "Chuỗi học" card (streak days · XP); location pill naming the scene on screen; 4 round shortcuts (Roleplay, AI Tutor, Camera, Error map) | Home has no full-width "Luyện tập: Đà Nẵng" or "Luyện nói: Chỉ đường ở Đà Nẵng" buttons and no "Tiếp tục bài học" or "Nhiệm vụ hôm nay" cards. "Nhiệm vụ hôm nay / Today's mission" (today's "Practise this" recommendation from the learner's weakest skill) appears in the Notifications panel opened from the bell. The streak row, calendar and 2×2 ring cards follow below. Cards: radius 28, white 92% + blur 10, soft navy shadow |
| Journey path: winding line, numbered nodes, padlocked locked nodes, "Your Progress" summary card | **Landmark journey**: scenarios as stops across Da Nang and Hoi An; streaks unlock new stops (T-07). A compact **Tiếp tục/Continue** card with a progress bar (today's minutes toward the 15-minute goal) and a play button sits beside the next unlocked node and opens that lesson |
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

## C.7 Friendly UX

- Feedback opens with what went well, then gives exactly one thing to fix. Errors are framed as "words to practise", shown in warm `lantern`; green marks success.
- One primary action per screen.
- Recording is always visible as one of four states: idle → listening (pulsing ring) → processing → scored.
- Loading uses skeleton cards. Each empty state names the next step, e.g. empty Tutor queue: "Nothing to fix yet — go have a conversation!"
- Motion is gentle (150–250 ms, ease-out). Milestones get a short lantern-glow celebration. Honour `prefers-reduced-motion`.
- Completed journey stops have a static, theme-coloured halo and soft shadow around the icon. The completion check and text remain visible, and open and locked stops do not receive this halo.
- Touch targets are at least 44px. Text contrast meets WCAG AA. Every icon-only button has an `aria-label` in both languages.
- Illustrations: glossy 3D-style icons like those in the references, showing local subjects (lantern, Dragon Bridge, bowl of mì Quảng, Japanese Covered Bridge). Landmark photos must be licensed, with attribution stored in the scenario's content file.
