# VIVA CHEAT SHEET — EduNexus

---

## WHAT IS IT
AI-powered adaptive LMS. Teachers generate lessons/quizzes with AI, students get adaptive quizzes, knowledge graph mastery tracking, gamification, and peer-teaching. FastAPI + PostgreSQL backend, Next.js frontend, Gemini 2.5 Flash (primary) / GPT-4o-mini (fallback).

---

## CORE ALGORITHMS

**EMA Mastery**
`new = 0.3 × result + 0.7 × old`
Alpha=0.3 design choice — not empirically tuned. Would A/B test with real outcomes in future.

**ZPD Delta**
`zpd_delta = aided_mastery − unaided_mastery`
aided = answered correctly WITH hints. unaided = WITHOUT hints. Large gap = succeeds with support but not alone = prime target.

**Calibration Score**
`1 − mean(|confidence_expected − actual_correct|)`
confidence map: 1→0.0, 2→0.25, 3→0.5, 4→0.75, 5→1.0
Example: confidence 5 on 3 questions, 1 correct → 1−(0+1+1)/3 = 0.333

**Practice Target Priority**
`0.40×criticality + 0.30×deficit + 0.20×zpd − 0.10×recency`
criticality = how many concepts it blocks (÷3, cap 1.0)
deficit = 1−mastery. All weights = design choices, not validated.

**Hint Penalty**
`credit = max(0.25, 1.0 − 0.25×hints_used)`
0 hints=1.0, 1 hint=0.75, 2 hints=0.50, 3 hints=0.25

**Adaptive Difficulty**
>80% accuracy last 5 attempts → step up. <40% → step down. Else hold.

---

## AUTH SYSTEM
JWT HS256 signed. Payload: sub (user_id), role, iat, exp, typ="access".
Password: bcrypt primary, PBKDF2-SHA256 fallback if bcrypt not installed.
Token stored in localStorage. Every request: `Authorization: Bearer <token>`.
`get_current_user` dependency decodes + verifies on every protected route.
`require_roles("teacher")` wraps that — 403 if wrong role.

---

## 4-STAGE JSON PARSER
1. Direct json.loads
2. Strip ``` fences, try again
3. Fix unescaped \n \t inside strings, try again
4. Brace-match to extract first complete {…}, try again
~95% = engineering estimate, not measured.

---

## QUIZ SCORING FLOW
Submit answers → per-question: is_correct, hints_used, confidence, credit_earned
→ calibration score across all questions
→ EMA mastery update per concept_id tagged on question
→ evidence point appended to JSONB (last 20 kept)
→ XP = 10×credit per correct + 20 bonus if perfect
→ badges checked: perfect_score, first_quiz, good_calibration (≥0.75), growth_mindset, reflective_learner (5+ reflections)

---

## KNOWLEDGE GRAPH
Directed prerequisite graph per classroom. AI extracts concepts from lesson body (truncated to 6000 chars — heuristic, not benchmarked).
Blind spot = prerequisite concept with mastery < 0.5.
Evidence trail = last 20 data points per concept (JSONB): attempt_id, correct, confidence, hints, mastery snapshot, timestamp.

---

## PEER TEACHING (PROTÉGÉ EFFECT)
Student teaches AI "Alex" (confused learner persona).
Up to 20 turns. Alex pushes back on vague answers, shows gradual understanding.
On complete: AI assesses 4 dimensions → completeness (25%), accuracy (30%), clarity (25%), depth (20%).
XP = 25 + round(score×25). Max 50 XP.
Mastery boost = score×0.15 added directly (not EMA — teaching = strong evidence).
Badges: first_teaching, clear_explainer (clarity≥0.8), patient_teacher (≥10 turns + score≥0.7).

---

## LITERATURE LINKS
- Luckin (2017) → calibration score = "accurate perceived self-efficacy"
- Toda et al. (2020) → metacognitive badges reward BEHAVIOUR not performance
- Vygotsky ZPD → aided vs unaided mastery columns
- Selwyn (2019) → acknowledge AI ≠ fix for inequality
- Roe (2024) → AI bias / Anglo-Eurocentric outputs = ethical limitation

---

## DEFERRED FEATURES (know these cold)
- FR8a: lesson refinement UI (endpoint exists, multi-turn UI not built)
- FR19: multilingual (lang attr set, no translation)
- FR20: TTS (stub only)
- FR24/25: prerequisite diagnostics + mid-lesson pulse checks

---

## HARD QUESTIONS — QUICK ANSWERS

**"Why EMA not BKT/IRT?"**
BKT/IRT need larger datasets + more complex fitting. EMA is interpretable and pragmatic for a prototype. Future work would evaluate BKT.

**"Why 0.3 alpha?"**
Design choice. Gives recent attempts meaningful weight while preserving history. Would need real outcome data to optimise.

**"Only 4 users in your study?"**
Validates technical correctness and surface usability only. Makes no claims about learning outcomes. Future: recruited formal study with control group.

**"Why Gemini over OpenAI?"**
Free tier availability, cost. Dual-provider = resilience. OpenAI as automatic fallback.

**"6000 char truncation?"**
Practical heuristic observed during development. Not formally benchmarked.

**"Is ZPD really Vygotsky?"**
Quantitative approximation. Vygotsky's ZPD is qualitative + social. The peer-teaching module separately embeds the social/mediated dimension.

**"Claude helped write the implementation chapter?"**
Used to structure and clarify writing. All code and design decisions independently made. Fully declared in Appendix B.

**"What's transparent AI mean concretely?"**
(1) Calibration score shown + explained to student. (2) Practice targets show reason for each selection. (3) Full evidence trail stored per concept.

**"How would you measure learning outcomes in a real study?"**
Recruit teachers + students, pre/post test on same content, control group using standard LMS, measure retention over time not just immediate quiz scores.

---

## NUMBERS TO REMEMBER
- 39 functional requirements, 5 non-functional
- 34/39 FRs fully met
- 10 pytest tests passing, 5 Playwright E2E tests passing
- 12 Alembic migrations
- 11 backend routers
- 8 badge types
- 8 AI system prompts
- Auth/CRUD endpoints < 1s. AI endpoints 2–6s (Gemini latency).
- Max 20 peer-teaching turns. Max 50 XP per teaching session.
- EMA alpha=0.3. Mastery cap=1.0. Practice target skip if mastery≥0.9.
