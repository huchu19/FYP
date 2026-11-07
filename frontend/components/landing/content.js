/**
 * Copy and data for the public landing page.
 *
 * `focus` values are fractions of the screenshot (x, y, width, height), and
 * tell the tour's camera which part of the image a note is describing.
 */

export const teacherSteps = [
  {
    label: "Write a brief",
    title: "Turn a short brief into a draft lesson",
    lead: "Fill in one form and the AI drafts the lesson. If you'd rather write it yourself, there's a manual mode too.",
    notes: [
      {
        title: "Your curriculum is already there",
        text: "The AI uses the subject, level and learning objectives saved for the classroom, so you don't have to repeat them.",
        focus: { x: 0.04, y: 0.005, w: 0.92, h: 0.235 },
      },
      {
        title: "Describe what you need",
        text: "Say what the topic is, who it's for and how long it should run.",
        focus: { x: 0.04, y: 0.255, w: 0.92, h: 0.32 },
      },
      {
        title: "Attach your own material",
        text: "Upload a PDF, Word document or text file for the AI to work from.",
        focus: { x: 0.04, y: 0.59, w: 0.6, h: 0.1 },
      },
      {
        title: "Choose a format",
        text: "Slides, a formal report, a presentation with notes, or flashcards.",
        focus: { x: 0.04, y: 0.705, w: 0.92, h: 0.215 },
      },
    ],
    image: { src: "/landing/teacher-brief.jpg", width: 1800, height: 1796 },
    alt: "Lesson form with the classroom's curriculum details, a topic brief about osmosis, audience, length, a file upload and four content formats.",
  },
  {
    label: "Review it",
    title: "Check it before students see it",
    lead: "AI drafts can contain mistakes, so nothing reaches students until you say so. From any lesson, you can also generate a quiz at easy, medium or hard difficulty, then edit the questions.",
    notes: [
      {
        title: "You control publishing",
        text: "Lessons and quizzes stay hidden from students until you publish them, and you can unpublish them again. You can also edit a draft or export it.",
        focus: { x: 0.01, y: 0.005, w: 0.98, h: 0.115 },
      },
      {
        title: "Add supporting files",
        text: "Attach documents to the lesson.",
        focus: { x: 0.02, y: 0.16, w: 0.96, h: 0.175 },
      },
      {
        title: "Change the format",
        text: "Have the AI reformat the lesson as slides, a report, a presentation or flashcards.",
        focus: { x: 0.02, y: 0.38, w: 0.96, h: 0.105 },
      },
    ],
    extras: {
      heading: "Three quiz styles",
      items: [
        { term: "Standard", text: "Multiple-choice questions." },
        { term: "Game", text: "Timed questions, with more points for faster correct answers." },
        {
          term: "Metacognitive",
          text: "Questions that ask students to explain their reasoning, find the mistake in an answer, or apply an idea somewhere new.",
        },
      ],
    },
    image: { src: "/landing/teacher-review.jpg", width: 1800, height: 1440 },
    alt: "A published lesson on cell structure, with buttons to export, unpublish, upload documents and switch between four formats.",
  },
  {
    label: "Scan the class",
    title: "See how the whole class is doing",
    lead: "The classroom page tells you how the class is doing and who needs a closer look.",
    notes: [
      {
        title: "The class in one line",
        text: "Total attempts and the class average, at the top of the page.",
        focus: { x: 0.02, y: 0, w: 0.96, h: 0.265 },
      },
      {
        title: "A row for every student",
        text: "Attempts, average score, XP, streak and badges.",
        focus: { x: 0.02, y: 0.44, w: 0.96, h: 0.54 },
      },
      {
        title: "Low scores are easy to spot",
        text: "Tom is on 27.5%, while the other two students are on 75% or more.",
        focus: { x: 0.02, y: 0.7, w: 0.6, h: 0.135 },
      },
    ],
    image: { src: "/landing/teacher-roster.jpg", width: 1800, height: 1106 },
    alt: "Class analytics showing 7 attempts and a 62.1% average, above a table of three students with their scores, XP, streaks and badges.",
  },
  {
    label: "Open a student",
    title: "Find out why a student is stuck",
    lead: "Open a student to see their score trend and knowledge map, and which concepts they do better on with hints.",
    notes: [
      {
        title: "Topic mastery",
        text: "How they're doing on each topic.",
        focus: { x: 0.02, y: 0, w: 0.96, h: 0.21 },
      },
      {
        title: "Every quiz attempt",
        text: "The score, the time taken, how well they thought they understood it, and what they wrote in their reflection.",
        focus: { x: 0.02, y: 0.28, w: 0.96, h: 0.41 },
      },
      {
        title: "Confidence against results",
        text: "How closely their confidence matches their results.",
        focus: { x: 0.02, y: 0.755, w: 0.72, h: 0.245 },
      },
    ],
    image: { src: "/landing/teacher-student.jpg", width: 1800, height: 1092 },
    alt: "One student's topic mastery, quiz history with scores, times, self-ratings and written reflections, and a 72% self-assessment calibration score.",
  },
];

export const studentSteps = [
  {
    label: "Read a lesson",
    title: "Read the lesson, then test yourself",
    lead: "Enter the code from your teacher to join their classroom. Your browser can read lessons aloud if you'd rather listen. Each lesson gives you three ways to check what stuck.",
    notes: [
      {
        title: "Pulse Check",
        text: "A short set of questions on the lesson's key concepts.",
        focus: { x: 0.02, y: 0.45, w: 0.96, h: 0.117 },
      },
      {
        title: "Teach Back",
        text: "Explain the lesson to an AI student.",
        focus: { x: 0.02, y: 0.617, w: 0.96, h: 0.113 },
      },
      {
        title: "Test Yourself",
        text: "A new quiz generated at the difficulty and style you choose.",
        focus: { x: 0.02, y: 0.78, w: 0.96, h: 0.21 },
      },
    ],
    image: { src: "/landing/student-lesson.jpg", width: 1800, height: 1520 },
    alt: "The end of a lesson on cell organelles, followed by the Pulse Check, Teach Back and Test Yourself options.",
  },
  {
    label: "Take a quiz",
    title: "Answer quizzes that ask how you got there",
    lead: "After you submit, you can see how your mastery of each concept changed and add a short reflection.",
    notes: [
      {
        title: "Hints have a price",
        text: "Reveal up to three, one at a time. Each takes 25% off what the question is worth, so you decide when the help is worth it.",
        focus: { x: 0.02, y: 0.21, w: 0.96, h: 0.21 },
      },
      {
        title: "Rate your confidence",
        text: "Metacognitive quizzes ask how sure you are, from 1 to 5.",
        focus: { x: 0.01, y: 0.595, w: 0.34, h: 0.08 },
      },
      {
        title: "Explain your reasoning",
        text: "Metacognitive quizzes also ask you to explain how you got there.",
        focus: { x: 0.01, y: 0.67, w: 0.98, h: 0.285 },
      },
    ],
    image: { src: "/landing/student-quiz.jpg", width: 1800, height: 916 },
    alt: "An error analysis question asking a student to correct a wrong explanation of the lungs, with a hint button, a 1 to 5 confidence scale and an answer box.",
  },
  {
    label: "Teach Alex",
    title: "Teach it to Alex",
    lead: "Explaining something is a good test of whether you understand it.",
    notes: [
      {
        title: "Alex keeps asking",
        text: "Alex is an AI student who is confused about the lesson and keeps asking questions as you explain.",
        focus: { x: 0.02, y: 0.215, w: 0.78, h: 0.455 },
      },
      {
        title: "Finish and get scored",
        text: "The AI scores the session on completeness, accuracy, clarity and depth. You earn XP, and a good explanation raises your mastery of the concept.",
        focus: { x: 0.6, y: 0.02, w: 0.39, h: 0.11 },
      },
    ],
    image: { src: "/landing/student-teach.jpg", width: 1800, height: 1004 },
    alt: "A chat where Alex, an AI student, asks how tissues and organs relate, with a box for the student to reply.",
  },
  {
    label: "Read your map",
    title: "See what's holding you back",
    lead: "The AI extracts concepts from your classroom's lessons, and your teacher can correct them. The map at the top of this page is a small version you can try.",
    notes: [
      {
        title: "The map",
        text: "Arrows show what you need to know first. Green means at least 70% mastery, amber at least 40%, and red anything lower.",
        focus: { x: 0.04, y: 0.13, w: 0.92, h: 0.26 },
      },
      {
        title: "Readiness Check",
        text: "Tests the prerequisites before you start a new concept.",
        focus: { x: 0.02, y: 0.47, w: 0.96, h: 0.18 },
      },
      {
        title: "Recommended Focus",
        text: "Tom is on 38% for Passive Transport. Active Transport depends on it, so it appears here.",
        focus: { x: 0.02, y: 0.68, w: 0.47, h: 0.26 },
      },
      {
        title: "Practice Weak Concepts",
        text: "Generates a quiz aimed at the concepts you need most.",
        focus: { x: 0.5, y: 0.672, w: 0.48, h: 0.075 },
      },
      {
        title: "Growth Edge",
        text: "Compares your scores with and without hints.",
        focus: { x: 0.5, y: 0.755, w: 0.48, h: 0.245 },
      },
    ],
    image: { src: "/landing/student-map.jpg", width: 1800, height: 1582 },
    alt: "A knowledge map in the dark theme. Cell Structure is green, Cell Membrane and ATP and Energy are amber, and Passive and Active Transport are red. Passive Transport is listed as the recommended focus at 38% mastery.",
  },
  {
    label: "Track progress",
    title: "Track your progress",
    lead: "Further down the page are your recent scores, past reflections and badges. Your teacher can see your scores, reflections and knowledge map too.",
    notes: [
      {
        title: "Mastery and XP",
        text: "Your overall mastery, concepts mastered and the XP you've earned.",
        focus: { x: 0.02, y: 0.385, w: 0.96, h: 0.6 },
      },
      {
        title: "Self-assessment accuracy",
        text: "How closely your confidence matches your results.",
        focus: { x: 0.5, y: 0.695, w: 0.48, h: 0.295 },
      },
    ],
    image: { src: "/landing/student-progress.jpg", width: 1800, height: 1320 },
    alt: "The progress page showing 75% overall mastery, one of one concepts mastered, 934 XP and 72% self-assessment accuracy.",
  },
];

export const roles = {
  teacher: {
    tab: "Teachers",
    intro: "Create a lesson, check it, publish it, then see how each student gets on.",
    steps: teacherSteps,
    signup: { href: "/register?role=teacher", label: "Sign up as a teacher" },
    otherSide: "See the student side",
  },
  student: {
    tab: "Students",
    intro: "Work through your teacher's lessons and find out which concepts you understand and which need more practice.",
    steps: studentSteps,
    signup: { href: "/register?role=student", label: "Sign up as a student" },
    otherSide: "See the teacher side",
  },
};

/**
 * The demo's sample map. Its topic is how people learn, so trying it also
 * explains the ideas behind EduNexus. The starting scores are made up.
 * `desktop` and `mobile` are node centres in the coordinates of the matching
 * SVG viewBox below.
 */
export const mapViewBox = {
  desktop: { width: 1000, height: 380 },
  mobile: { width: 400, height: 340 },
};

export const mapConcepts = [
  {
    id: "memory",
    name: "How Memory Works",
    mastery: 0.71,
    desktop: [105, 185],
    mobile: [200, 45],
    question: {
      prompt: "You learn a list of new terms, then never look at them again. How do you usually forget them?",
      options: [
        "At a steady rate, a little each week",
        "Quickly at first, then more slowly",
        "Slowly at first, then all at once",
      ],
      answer: 1,
      hints: [
        "Compare how much you'd lose in the first day with how much you'd lose in the fifth week.",
        "After a month, the terms you still remember tend to be fairly stable.",
        "Most of the loss happens soon after learning.",
      ],
      explanation:
        "Forgetting is fastest soon after you learn something, then slows down. This pattern is known as the forgetting curve.",
    },
  },
  {
    id: "retrieval",
    name: "Retrieval Practice",
    mastery: 0.54,
    desktop: [368, 70],
    mobile: [105, 165],
    question: {
      prompt: "You have an hour to prepare for a test next week. Which of these usually helps the most?",
      options: [
        "Rereading your notes several times",
        "Highlighting the key points",
        "Closing your notes and testing yourself",
      ],
      answer: 2,
      hints: [
        "The option that feels hardest is often the one that works.",
        "Think about what the test will ask you to do.",
        "In the test, you'll have to recall the material without seeing it.",
      ],
      explanation:
        "Pulling an idea out of your memory strengthens it more than seeing it again. That's why EduNexus has so many ways to quiz yourself.",
    },
  },
  {
    id: "prior",
    name: "Prior Knowledge",
    mastery: 0.45,
    desktop: [368, 300],
    mobile: [295, 165],
    question: {
      prompt:
        "Chess experts can memorise a position from a real game at a glance. With pieces placed at random, they do little better than beginners. Why?",
      options: [
        "They link real positions to patterns they already know",
        "They have seen that exact position before",
        "They have better memories than most people",
      ],
      answer: 0,
      hints: [
        "If they simply had better memories, random positions would be easy too.",
        "Random positions don't look like anything from a real game.",
        "Experts see groups of pieces that mean something, not 25 separate pieces.",
      ],
      explanation:
        "New information sticks when it connects to what you already know. That's why the knowledge map shows what you need to know first.",
    },
  },
  {
    id: "illusion",
    name: "Illusion of Knowing",
    mastery: 0.38,
    desktop: [632, 70],
    mobile: [105, 285],
    question: {
      prompt: "You've reread a chapter until it feels familiar. What does that feeling tell you?",
      options: [
        "The material will come back to you in a test",
        "The material has reached your long-term memory",
        "You recognise the material, but may not be able to recall it",
      ],
      answer: 2,
      hints: [
        "Have you ever known a face, but not the name that goes with it?",
        "Recognising something when you see it is easier than producing it from nothing.",
        "A test usually asks you to produce the answer, with no page in front of you.",
      ],
      explanation:
        "Familiarity feels like understanding, but it's easier to recognise something than to recall it. That's why some EduNexus quizzes ask how sure you are, then compare that with your results.",
    },
  },
  {
    id: "teaching",
    name: "Teaching to Learn",
    mastery: 0.21,
    desktop: [895, 70],
    mobile: [295, 285],
    question: {
      prompt: "You're explaining a topic to a friend and get stuck halfway through. What has that shown you?",
      options: [
        "The topic is too complicated to explain",
        "You've found a gap in your own understanding",
        "Your friend asked the wrong question",
      ],
      answer: 1,
      hints: [
        "It felt fine until you had to say it out loud.",
        "Explaining means putting the steps in order, with nothing to look at.",
        "The problem showed up in the explanation, not in your friend.",
      ],
      explanation:
        "Explaining something exposes gaps that reading can hide. That's the idea behind Teach Back, where you explain a lesson to Alex.",
    },
  },
];

export const mapEdges = [
  {
    from: "memory",
    to: "retrieval",
    desktop: "M210 185 C 246 185, 222 70, 257 70",
    mobile: "M200 84 C 200 110, 105 96, 105 122",
  },
  {
    from: "memory",
    to: "prior",
    desktop: "M210 185 C 246 185, 222 300, 257 300",
    mobile: "M200 84 C 200 110, 295 96, 295 122",
  },
  {
    from: "retrieval",
    to: "illusion",
    desktop: "M473 70 L 522 70",
    mobile: "M105 206 L 105 242",
  },
  {
    from: "illusion",
    to: "teaching",
    desktop: "M737 70 L 785 70",
    mobile: "M186 285 L 212 285",
  },
];

export const notes = [
  {
    title: "Teachers and students have separate accounts",
    text: "To see both sides, sign up twice with different email addresses. Create a classroom as the teacher to get a join code, then enter that code as the student.",
    icon: "users",
  },
  {
    title: "The first page load can be slow",
    text: "The server sleeps when idle on free hosting, so the first request can take up to a minute.",
    icon: "clock",
  },
  {
    title: "AI can make mistakes and has limits",
    text: "Drafts can contain errors, which is why teachers review them first. AI features are capped at 20 generations per user per hour.",
    icon: "spark",
  },
  {
    title: "This is a student project",
    text: "EduNexus is a final year project, not a commercial service, so please don't use it with real student data.",
    icon: "book",
  },
];
