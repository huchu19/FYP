# Literature Review: AI in Education, Adaptive Learning, and Metacognition

## 1. Introduction

This literature review examines the current state of research on artificial intelligence in education, with a particular focus on adaptive learning platforms, AI-based assessment systems, metacognition, and gamification. The review synthesises findings from key publications to establish the theoretical foundation for EduNexus, an AI-powered adaptive learning platform designed to support both teachers and students through personalised, metacognition-aware educational experiences.

The scope covers seven interconnected areas: continuous assessment, whole-learner development, metacognition and self-efficacy, Open Learner Models, teacher empowerment, adaptive personalisation, ethical considerations, and gamification design.

---

## 2. Thematic Analysis

### 2.1 From Snapshot to Continuous Assessment

Traditional assessment methods, centred around timed examinations, have been shown to be inadequate for rigorous evaluation of knowledge and understanding. Luckin (2017) argues that decades of research demonstrate that knowledge cannot be properly evaluated through a series of 90-minute exams. These assessment methods incentivise coaching and cramming strategies rather than genuine understanding, capturing only a single snapshot of student performance rather than the learning journey itself.

AI-based assessment systems offer a fundamentally different paradigm. Rather than evaluating students through high-stakes, time-limited events, AI can collect data continuously over a period of time, building an evidence-based picture of student learning (Luckin, 2017). This continuous, background approach means that it would not be possible for students to be coached specifically for an AI assessment, because the assessment would be happening in the background as part of the normal learning process.

The review of adaptive learning platforms (Kabudi, Pappas & Olsen, 2025) reinforces this through the concept of dynamic learner models that continuously collect and analyse data about student demographics, performance, preferences, and cognitive states. The Center for Curriculum Redesign's four-dimensional framework (Fadel et al., 2015) further supports this shift by identifying meta-learning — including metacognition and growth mindset — as a core educational dimension alongside knowledge, skills, and character.

**Implications for EduNexus:** The platform's quiz attempt tracking and analytics events infrastructure provides a foundation for continuous assessment. However, the system must move beyond event-based quiz scoring to incorporate lesson engagement tracking, time-on-task measurement, and comprehensive analytics event logging that captures the full breadth of student interaction with learning materials.

### 2.2 The Whole Learner: Beyond Knowledge Recall

A recurring theme across the literature is that intelligence is multidimensional and that education systems must address the full spectrum of human capability, not merely knowledge acquisition. Luckin (2018) presents a framework of seven interwoven elements of intelligence: cognitive intelligence, metacognition, emotional intelligence, social intelligence, self-efficacy, creativity, and practical intelligence. These elements are not isolated but interact and influence one another in complex ways.

The Center for Curriculum Redesign similarly organises 21st-century learning competencies into four dimensions: knowledge (including interdisciplinary understanding), skills (creativity, critical thinking, communication, collaboration), character (mindfulness, curiosity, courage, resilience, ethics), and meta-learning (metacognition and growth mindset) (Fadel et al., 2015). This framework avoids a one-size-fits-all approach, instead providing an organising structure that helps educators determine relevant competencies for their context.

The ALP review (Kabudi, Pappas & Olsen, 2025) connects these broader educational goals to specific pedagogical theories: mastery learning, where learners advance upon mastering each unit aided by corrective feedback; aptitude-treatment interactions, where content is tailored based on learners' abilities; and the Revised Bloom's Taxonomy, which structures learning goals hierarchically from basic recall to complex evaluation and creation.

Luckin (2018) makes a critical distinction: knowledge is the element of human intelligence that is the easiest to automate with AI. Since AI can now learn and recall knowledge faster and more accurately than humans, we must revise our relationship to knowledge. Education must shift from judging students' ability to memorise toward developing learning mastery — a student's ability to understand and regulate their own learning processes — and knowledge mastery — deep conceptual understanding of underlying principles and connections (Luckin, 2025).

**Implications for EduNexus:** The platform must assess more than content knowledge. Quiz design should move beyond basic multiple-choice recall questions to include explain-your-reasoning prompts, multi-step problem solving with visible steps, transfer questions that test application to new contexts, and error analysis tasks. Gamification should reward persistence, self-regulation, and metacognitive engagement, not merely correct answers.

### 2.3 Metacognition and Self-Efficacy as Key Human Capabilities

Metacognition — thinking about one's own thinking — emerges as perhaps the single most important capability for lifelong learning in an AI-augmented world. Luckin (2018) argues that accurate perceived self-efficacy, based on accurate judgements about what we know, is the most important ability for future lifelong learning and is something that is unavailable to AI.

Luckin's framework of meta-intelligence encompasses four interrelated elements: metacognition (knowledge and control of our own cognitive processes), meta-emotion (awareness of how we feel and how this impacts learning), metacontextual awareness (physical and mental abilities and awareness of our interactions with the world), and accurate perceived self-efficacy (Luckin, 2018). People with higher levels of perceived self-efficacy perform better, waste less time and effort, and suffer less dissatisfaction.

Crucially, AI can be used to probe students to make explicit their knowledge of their own ability, their appreciation of their capability, and their understanding of their own emotions with respect to their learning (Luckin, 2018). The system can then compare what each student makes explicit about their self-understanding to the evidence from tracking their development. This comparison — the gap between perceived and actual competence — is a powerful metacognitive tool.

The concept of learning mastery (Luckin, 2025) focuses specifically on developing metacognition: becoming more self-directed learners who can set goals, evaluate themselves, and make informed decisions about their own learning. This requires education to evolve from rote learning and judging memorisation ability toward helping students navigate, interpret, and better their own learning and mental processes.

**Implications for EduNexus:** The platform should implement confidence ratings on quiz questions, allowing students to rate their certainty before seeing results. Post-quiz reflections should prompt students to articulate what they found challenging and assess their own understanding. The system should then calculate calibration scores — comparing stated confidence to actual performance — and surface this data as a core metacognitive feedback mechanism. Badges should reward accurate self-assessment rather than just correct answers.

### 2.4 Open Learner Models and Transparency

Open Learner Models (OLMs) represent a student's knowledge, skills, and resource requirements in a way that is visible and inspectable by both the student and their teacher. Luckin (2017) argues that OLMs help teachers understand students' approaches to learning and help motivate students by enabling them to track their own progress. This transparency is essential for building trust in AI-based assessment systems.

The ALP review (Kabudi, Pappas & Olsen, 2025) describes three key components of adaptive learning platforms: the learner model (dynamic profiles including demographics, performance, preferences, and cognitive states), the domain model (knowledge organised into units with relationships between them), and the adaptation model (which uses the learner model to adjust the learning experience). The learner model, when made visible to students, becomes an Open Learner Model.

AI assessment systems must make their reasoning transparent to avoid distrust (Luckin, 2017). Feedback should be continuous and informative for all stakeholders — students, teachers, and parents. The system should provide a fairer, richer assessment that evaluates students across a longer period of time and from an evidence-based, value-added perspective.

**Implications for EduNexus:** A student-facing progress dashboard should display topic mastery, score trends over time, confidence calibration data, and knowledge gap identification. Teachers should have access to per-student progress views showing not just scores but the process data — how students approached problems, where they struggled, and how they improved over time.

### 2.5 Teacher Empowerment, Not Replacement

The literature consistently positions AI as a tool that enriches teaching rather than replaces teachers. Luckin (2018) argues that AI systems can help support teachers and enable them to address the increasing needs of their students — needs that require a human touch. By handling routine knowledge delivery and continuous assessment, AI frees human educators to focus on the holistic development of students' interwoven intelligence, particularly social and meta-intelligence that remain beyond AI's capability.

Research on gamification design in adaptive learning systems (Toda et al., 2020) found that teachers, not automated systems, should monitor and adapt gamification during instruction. Some gamification implementations produce unexpectedly negative outcomes. The study found that teachers strongly preferred graphical data representations over text-based displays and highly valued the ability to define interaction goals, monitor individual student engagement, and create personalised missions for disengaged students. Notably, trophy and achievement visualisations alone were rated poorly without accompanying analytics.

Educators must be trained to integrate social interaction effectively in formal and informal education (Luckin, 2018). Social intelligence is beyond the capability of AI and increasingly at a premium as more AI is absorbed into the workplace. It is essential that educators engage in conversations about how AI can best be used in education to ensure that the blend of human and artificial improves the lives of both teachers and learners.

**Implications for EduNexus:** The teacher dashboard must provide meaningful analytics and intervention tools, not just content management. Teachers should be able to see per-student problem-solving processes, control gamification parameters, define content generation formats, and intervene when analytics indicate a student is struggling. The platform should position teachers as orchestrators of the learning experience.

### 2.6 Adaptive Personalisation

Adaptive learning platforms use AI to personalise learning experiences by tailoring content, tasks, and assessments based on learner profiles (Kabudi, Pappas & Olsen, 2025). Unlike traditional one-size-fits-all teaching approaches, ALPs adapt to individual needs, addressing diverse learning styles, preferences, and progress levels.

Several pedagogical theories underpin adaptive personalisation. Mastery learning requires that learners advance only upon mastering each unit, aided by corrective feedback. Dynamic scaffolding, borrowing from Vygotsky's Zone of Proximal Development, offers incremental support that is gradually reduced as students gain confidence and competence. Aptitude-treatment interactions ensure that content is tailored to individual abilities, providing optimal support for both novice and advanced students.

Luckin (2017) emphasises that AI assessment systems should be able to demonstrate how a student deals with challenging subject matter, how they persevere, and how quickly they learn when given appropriate support. This goes beyond mere score tracking to capture the learning process itself.

AI techniques applicable to adaptive learning include Deep Knowledge Tracing, Random Forests, collaborative filtering, and reinforcement learning (Kabudi, Pappas & Olsen, 2025). These can predict learners' knowledge states and guide content delivery based on real-time analysis. Even simple threshold-based approaches — increasing difficulty when accuracy exceeds 80%, decreasing when it falls below 40% — can provide meaningful personalisation.

**Implications for EduNexus:** The adaptive service should implement difficulty adjustment based on cumulative student performance data. The AI quiz generation should accept target difficulty parameters informed by the adaptive model. The system should track per-student difficulty progression and inform both students and teachers about recommended next steps.

### 2.7 Ethical Considerations and AI as a Sociotechnical System

The anthropological perspective on AI in education challenges the Standard View of Technology — a Eurocentric myth which posits technology as a neutral transformation of natural resources into tools (OpenAnthroResearch). Instead, AI systems should be understood as sociotechnical systems: technological activity derived from the linking of techniques and material culture to the social coordination of labour. This framing acknowledges that AI is developed within human societies with human input and is ultimately focused on particular interests.

This perspective is reinforced by the recognition that generative AI does not understand the content that it produces (OpenAnthroResearch). The debate around whether GenAI systems are merely stochastic parrots (Bender et al., 2021) — producing statistically likely text without comprehension — has important implications for their use in educational contexts, particularly around advice-giving and emotional support.

Luckin (2025) warns that AI algorithms can inadvertently perpetuate biases present in their training data, leading to unequal opportunities and reinforcing societal disparities. The collection and sharing of student data must be handled ethically to ensure privacy (Luckin, 2017). Stakeholders — teachers, parents, and education policymakers — must work together to create appropriate ethical frameworks for AI-based assessment.

We need to develop a healthy scepticism of authority and a sophisticated personal epistemology that helps us distinguish between evidence-based justification and mere opinion (Luckin, 2018). This is particularly important when AI systems present information with apparent authority.

**Implications for EduNexus:** AI-generated content should be clearly marked as such. The platform should explain what data is collected and how it is used. Assessment recommendations should be transparent in their reasoning. Teachers should retain authority over educational decisions, with AI serving as an informed tool rather than an autonomous decision-maker.

### 2.8 Gamification: Thoughtful Design

Research on gamification in educational platforms reveals that naive implementation can produce negative outcomes. Toda et al. (2020) found that while gamification often enhances engagement, some implementations produce unexpectedly counterproductive results. Their proposed Gamification Analytics Model for Teachers enables educators to define interaction goals, monitor student engagement patterns with learning materials and gamification elements, and adapt designs through personalised missions for disengaged students.

The research on adaptive gamification algorithms (ResearchGate, 2024) suggests that gamification should be personalised to individual learner profiles rather than applied uniformly. Effective gamification rewards meaningful learning behaviours — persistence, self-reflection, accurate self-assessment, consistent engagement — rather than solely rewarding performance outcomes like correct answers.

Luckin's work supports this by emphasising that creativity and imagination can be nurtured by education, but systems that focus primarily on knowledge acquisition with an emphasis on testing and examinations can hamper learners' capacity to be imaginative and creative (Luckin, 2018). Gamification design should therefore encourage exploration and creative problem-solving, not just efficient answer selection.

**Implications for EduNexus:** The gamification system should move beyond XP-for-correct-answers to include metacognition-oriented rewards: badges for accurate self-assessment calibration, consistent reflection completion, demonstrated growth over time, and engagement streaks. Teachers should have visibility into which gamification elements are effective and the ability to adjust parameters for their classrooms.

---

## 3. Theme-to-Feature Mapping

| Research Theme | Key Sources | EduNexus Feature |
|---|---|---|
| Continuous assessment over snapshots | Luckin (2017), ALP Review, CCR | Analytics event logging, time-on-task tracking, lesson engagement metrics |
| Metacognition and self-efficacy | Luckin (2018, 2025), AI Assess | Confidence ratings per question, calibration scoring, post-quiz reflections |
| Open Learner Models | AI Assess, ALP Review | Student progress dashboard with topic mastery, trends, and calibration display |
| Whole-learner assessment | Luckin (2018), CCR, Bloom | Metacognitive quiz types: explain-reasoning, error analysis, transfer, multi-step |
| Adaptive personalisation | ALP Review, AI Assess | Threshold-based difficulty adjustment, adaptive quiz generation |
| Teacher empowerment | Toda et al. (2020), Luckin | Teacher analytics dashboard, student process views, content format control |
| Ethical transparency | Anthropological Imagination, Luckin | AI-generated content labelling, data usage transparency, teacher authority |
| Gamification beyond performance | Toda et al. (2020), Adaptive Gamification | Metacognition badges, growth badges, teacher-controlled gamification |
| Content format flexibility | Luckin (2018), ALP Review | Teacher-defined formats (slides/PDF/presentation), flashcards, Kahoot-style quizzes |
| Process-aware assessment | AI Assess, Luckin (2018) | Problem-solving step tracking, time per question, answer revision capture |

---

## 4. Research Gaps and Future Directions

Several areas remain underexplored in the current literature and present opportunities for EduNexus to contribute:

1. **Metacognitive assessment at scale**: While the theoretical case for metacognition-aware assessment is strong, few platforms implement confidence calibration or self-assessment comparison as first-class features. EduNexus can demonstrate the feasibility and educational value of these approaches.

2. **Teacher-AI collaboration models**: Most literature discusses AI replacing or supporting teachers in the abstract. Concrete implementations of teacher-controlled gamification and format-flexible content generation remain rare. EduNexus's teacher-as-orchestrator model addresses this gap.

3. **Process data in formative assessment**: Luckin's vision of assessing how students deal with challenge and persevere is largely unrealised in existing platforms. Capturing and surfacing problem-solving steps, answer revision patterns, and time-on-task data for teacher inspection is a novel contribution.

4. **Gamification for metacognition**: Current gamification research focuses on engagement and performance metrics. Rewarding metacognitive behaviours — accurate self-assessment, reflection habits, growth trajectories — is an underexplored design space.

5. **Ethical implementation of continuous assessment**: The shift from event-based to continuous assessment raises significant privacy and consent questions that require careful design and transparent communication with all stakeholders.

---

## 5. References

Bender, E. M., Gebru, T., McMillan-Major, A., & Shmitchell, S. (2021). On the dangers of stochastic parrots: Can language models be too big? *Proceedings of FAccT 2021*, 610–623.

Fadel, C., Bialik, M., & Trilling, B. (2015). *Four-Dimensional Education: The Competencies Learners Need to Succeed*. Center for Curriculum Redesign.

Kabudi, T., Pappas, I. O., & Olsen, D. H. (2025). Artificial intelligence-enabled adaptive learning platforms: A review. *Computers and Education Open*, 100234.

Luckin, R. (2017). Towards artificial intelligence-based assessment systems. *International Journal of Artificial Intelligence in Education*, 28(1).

Luckin, R. (2018). *Machine Learning and Human Intelligence: The Future of Education for the 21st Century*. UCL Press.

Luckin, R. (2025). Nurturing human intelligence in the age of AI: Rethinking education for the future. *Emerald Insight*, 39(1).

OpenAnthroResearch. AI and the Anthropological Imagination: Rethinking Education in the Digital Age. *Open Anthropology Research Repository*.

Toda, A. M., et al. (2020). Raising teachers' empowerment in gamification design of adaptive learning systems. *PMC*, Article PMC7334171.

### Additional Sources (Consulted but Not Directly Cited)

- OECD (2017). *Collaborative Problem Solving*. OECD Publishing.
- Zhao, Y. (2017). What works may hurt: Side effects in education. *Journal of Educational Change*.
- ResearchGate (2024). Adaptive Gamification Algorithms for Personalised Learning Experiences in Educational Platforms.
- MDPI Education (2025). Various articles on AI in education.
- Springer (2024). *Handbook of Artificial Intelligence in Education*.
