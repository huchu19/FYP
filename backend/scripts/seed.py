"""Seed a deployment with a populated demo classroom.

A fresh database leaves the app empty, which makes a public link look
broken. This creates a teacher, three students, a classroom, lessons,
concepts with prerequisites, a quiz, and enough progress history for the
dashboards and leaderboard to show real data.

Lesson and quiz content is stored as static fixtures rather than
generated, so seeding is deterministic, costs nothing, and works without
a model API key.

Run once against the target database:

    python scripts/seed.py

Re-running is safe: records are matched on stable keys and updated in
place rather than duplicated.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import sys
from pathlib import Path

# Allow `python scripts/seed.py` from the backend directory.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db import SessionLocal
from app.models.classroom import Classroom
from app.models.classroom_enrollment import ClassroomEnrollment
from app.models.concept import Concept, ConceptPrerequisite, StudentConceptMastery
from app.models.gamification import Gamification
from app.models.lesson import Lesson
from app.models.quiz import Quiz
from app.models.user import User

DEMO_PASSWORD = "Demo1234!"
CLASSROOM_CODE = "BIO101"

TEACHER = {"name": "Dr Amara Osei", "email": "teacher@edunexus.demo", "role": "teacher"}
STUDENTS = [
    {"name": "Priya Raman", "email": "priya@edunexus.demo", "role": "student"},
    {"name": "Tom Whitfield", "email": "tom@edunexus.demo", "role": "student"},
    {"name": "Sofia Marchetti", "email": "sofia@edunexus.demo", "role": "student"},
]

CONCEPTS = [
    ("Cell Structure", "The components of prokaryotic and eukaryotic cells.", []),
    ("Cell Membrane", "Phospholipid bilayer organisation and permeability.", ["Cell Structure"]),
    ("Passive Transport", "Diffusion and osmosis across membranes.", ["Cell Membrane"]),
    ("Active Transport", "Energy-dependent movement against a gradient.", ["Passive Transport"]),
    ("ATP and Energy", "How cells store and release chemical energy.", ["Cell Structure"]),
]

LESSONS = [
    {
        "title": "Cell Structure and Organelles",
        "concept": "Cell Structure",
        "outline": [
            "Prokaryotic vs eukaryotic cells",
            "The nucleus and genetic material",
            "Mitochondria and energy production",
            "The endomembrane system",
        ],
        "body": """## Cell Structure and Organelles

Every living thing is built from cells, but not all cells are organised the
same way. The clearest dividing line in biology is between **prokaryotic**
and **eukaryotic** cells.

### Prokaryotic cells

Prokaryotes — bacteria and archaea — have no nucleus. Their DNA sits
directly in the cytoplasm in a region called the nucleoid. They are small
(typically 1–5 micrometres) and lack membrane-bound organelles.

### Eukaryotic cells

Eukaryotic cells keep their DNA inside a **nucleus**, separated from the
cytoplasm by a double membrane. This separation lets the cell control
which genes are read and when.

Key organelles:

- **Mitochondria** — release energy from glucose and store it as ATP.
- **Rough endoplasmic reticulum** — studded with ribosomes; folds proteins.
- **Golgi apparatus** — modifies and packages proteins for delivery.
- **Lysosomes** — contain enzymes that break down waste.

### Why compartments matter

Compartmentalisation lets a cell run incompatible reactions at the same
time. Digestive enzymes stay sealed inside lysosomes, so they break down
waste without digesting the cell itself.
""",
    },
    {
        "title": "The Cell Membrane and Selective Permeability",
        "concept": "Cell Membrane",
        "outline": [
            "The phospholipid bilayer",
            "The fluid mosaic model",
            "Membrane proteins and their roles",
            "What crosses freely and what does not",
        ],
        "body": """## The Cell Membrane

The cell membrane decides what enters and leaves a cell. Its structure
explains its behaviour.

### The phospholipid bilayer

Each phospholipid has a **hydrophilic head** that attracts water and two
**hydrophobic tails** that repel it. In water these molecules arrange
themselves automatically into a double layer, tails tucked inward.

### The fluid mosaic model

The membrane is not a rigid wall. Phospholipids drift sideways, and
proteins float within the layer like boats on water — hence *fluid
mosaic*.

Membrane proteins do the specialised work:

- **Channel proteins** form pores for specific ions.
- **Carrier proteins** change shape to ferry molecules across.
- **Receptor proteins** bind signalling molecules such as hormones.

### Selective permeability

Small non-polar molecules (oxygen, carbon dioxide) slip through the
hydrophobic core unaided. Large or charged particles — glucose, sodium
ions — cannot, and need a protein to cross.
""",
    },
    {
        "title": "Diffusion, Osmosis, and Active Transport",
        "concept": "Passive Transport",
        "outline": [
            "Diffusion down a concentration gradient",
            "Osmosis and water potential",
            "Facilitated diffusion",
            "Active transport and the sodium-potassium pump",
        ],
        "body": """## Moving Substances Across Membranes

Cells move materials in two broad ways: passively, using existing energy
in the system, or actively, by spending ATP.

### Diffusion

Particles move from high concentration to low concentration until evenly
spread. No energy is required — the movement comes from the particles'
own kinetic energy.

### Osmosis

Osmosis is the diffusion of **water** across a partially permeable
membrane, from a dilute solution to a concentrated one. Put a red blood
cell in pure water and it swells and bursts; put it in strong salt
solution and it shrivels.

### Facilitated diffusion

Some molecules need help but not energy. Glucose crosses through a
carrier protein, still moving down its gradient.

### Active transport

Active transport moves substances **against** the gradient, and that
costs ATP. The **sodium-potassium pump** pushes three sodium ions out for
every two potassium ions in, maintaining the charge difference nerve
cells depend on.
""",
    },
]

QUIZ_QUESTIONS = [
    {
        "question": "Which feature is found in eukaryotic cells but not prokaryotic cells?",
        "type": "mcq",
        "options": [
            "A membrane-bound nucleus",
            "Ribosomes",
            "A cell membrane",
            "Cytoplasm",
        ],
        "correct_answer": "A membrane-bound nucleus",
        "explanation": "Prokaryotes carry DNA in the cytoplasm; only eukaryotes enclose it in a nucleus.",
        "concept_tags": ["Cell Structure"],
        "hints": [
            "Think about where each cell type keeps its DNA.",
            "Three of these are common to nearly all cells.",
            "The distinguishing structure is a compartment with a double membrane.",
        ],
    },
    {
        "question": "Why are the tails of a phospholipid described as hydrophobic?",
        "type": "mcq",
        "options": [
            "They repel water",
            "They attract water",
            "They dissolve in water",
            "They are electrically charged",
        ],
        "correct_answer": "They repel water",
        "explanation": "Hydrophobic means water-fearing, which is why the tails turn inward, away from water.",
        "concept_tags": ["Cell Membrane"],
        "hints": [
            "Break the word apart: hydro and phobic.",
            "A phobia is a fear or avoidance of something.",
            "The tails point inward, away from the watery surroundings.",
        ],
    },
    {
        "question": "A red blood cell is placed in pure water. What happens?",
        "type": "mcq",
        "options": [
            "It swells and may burst",
            "It shrivels",
            "It stays the same size",
            "It divides in two",
        ],
        "correct_answer": "It swells and may burst",
        "explanation": "Water moves by osmosis into the more concentrated cytoplasm, increasing volume until the cell bursts.",
        "concept_tags": ["Passive Transport"],
        "hints": [
            "Compare the water concentration inside and outside the cell.",
            "Water moves from dilute to concentrated solutions.",
            "Pure water is more dilute than the cell's cytoplasm.",
        ],
    },
    {
        "question": "Which process requires the cell to spend ATP?",
        "type": "mcq",
        "options": [
            "Active transport",
            "Diffusion",
            "Osmosis",
            "Facilitated diffusion",
        ],
        "correct_answer": "Active transport",
        "explanation": "Only active transport moves substances against the concentration gradient, which requires energy.",
        "concept_tags": ["Active Transport", "ATP and Energy"],
        "hints": [
            "Three of these move substances down a gradient.",
            "Moving something uphill takes work.",
            "The name of the process gives it away.",
        ],
    },
    {
        "question": "The sodium-potassium pump moves ions in which ratio?",
        "type": "mcq",
        "options": [
            "3 sodium out, 2 potassium in",
            "2 sodium out, 3 potassium in",
            "1 sodium out, 1 potassium in",
            "3 sodium in, 2 potassium out",
        ],
        "correct_answer": "3 sodium out, 2 potassium in",
        "explanation": "The uneven exchange leaves the inside of the cell more negative, which nerve cells rely on.",
        "concept_tags": ["Active Transport"],
        "hints": [
            "The numbers are not equal, which is the important part.",
            "Sodium is pushed out of the cell.",
            "Three go one way, two come back the other.",
        ],
    },
]

# Per-student demo progress: XP, badges, streak, and per-concept mastery.
PROGRESS = {
    "priya@edunexus.demo": {
        "xp": 820,
        "streak": 6,
        "badges": ["First Steps", "Quiz Master", "Streak Keeper"],
        "mastery": {
            "Cell Structure": 0.92,
            "Cell Membrane": 0.85,
            "Passive Transport": 0.74,
            "Active Transport": 0.58,
            "ATP and Energy": 0.66,
        },
    },
    "tom@edunexus.demo": {
        "xp": 430,
        "streak": 2,
        "badges": ["First Steps", "Curious Mind"],
        "mastery": {
            "Cell Structure": 0.71,
            "Cell Membrane": 0.54,
            "Passive Transport": 0.38,
            "Active Transport": 0.21,
            "ATP and Energy": 0.45,
        },
    },
    "sofia@edunexus.demo": {
        "xp": 610,
        "streak": 4,
        "badges": ["First Steps", "Fast Learner"],
        "mastery": {
            "Cell Structure": 0.83,
            "Cell Membrane": 0.69,
            "Passive Transport": 0.61,
            "Active Transport": 0.40,
            "ATP and Energy": 0.52,
        },
    },
}


def _upsert_user(db: Session, *, name: str, email: str, role: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(name=name, email=email, role=role, is_active=True)
        db.add(user)

    user.name = name
    user.role = role
    user.is_active = True
    # Reset each run so the documented demo password always works.
    user.password_hash = hash_password(DEMO_PASSWORD)
    db.flush()
    return user


def seed(db: Session) -> None:
    teacher = _upsert_user(db, **TEACHER)
    students = [_upsert_user(db, **s) for s in STUDENTS]

    classroom = db.query(Classroom).filter(Classroom.code == CLASSROOM_CODE).first()
    if classroom is None:
        classroom = Classroom(code=CLASSROOM_CODE)
        db.add(classroom)

    classroom.name = "GCSE Biology — Cells and Transport"
    classroom.teacher_id = teacher.id
    classroom.description = (
        "An introduction to cell structure and how substances move across membranes."
    )
    classroom.subject = "Biology"
    classroom.year_group = "Year 10"
    classroom.learning_objectives = (
        "Describe the structure of prokaryotic and eukaryotic cells; explain selective "
        "permeability; compare passive and active transport."
    )
    classroom.syllabus_notes = "Aligned to AQA GCSE Biology 4.1 (Cell Biology)."
    db.flush()

    for student in students:
        exists = (
            db.query(ClassroomEnrollment)
            .filter(
                ClassroomEnrollment.classroom_id == classroom.id,
                ClassroomEnrollment.student_id == student.id,
            )
            .first()
        )
        if exists is None:
            db.add(
                ClassroomEnrollment(classroom_id=classroom.id, student_id=student.id)
            )
    db.flush()

    # Lessons, published so students can see them immediately.
    published_at = datetime.now(timezone.utc) - timedelta(days=7)
    lessons_by_concept: dict[str, Lesson] = {}
    for index, spec in enumerate(LESSONS):
        lesson = (
            db.query(Lesson)
            .filter(Lesson.classroom_id == classroom.id, Lesson.title == spec["title"])
            .first()
        )
        if lesson is None:
            lesson = Lesson(classroom_id=classroom.id, title=spec["title"])
            db.add(lesson)

        lesson.outline = spec["outline"]
        lesson.body = spec["body"]
        lesson.content_format = "slides"
        lesson.status = "published"
        lesson.generated_by_ai = True
        lesson.created_by_user_id = teacher.id
        lesson.published_at = published_at + timedelta(days=index)
        db.flush()
        lessons_by_concept[spec["concept"]] = lesson

    # Concepts, linked to the lesson that teaches them.
    concepts: dict[str, Concept] = {}
    for name, description, _ in CONCEPTS:
        concept = (
            db.query(Concept)
            .filter(Concept.classroom_id == classroom.id, Concept.name == name)
            .first()
        )
        if concept is None:
            concept = Concept(classroom_id=classroom.id, name=name)
            db.add(concept)

        concept.description = description
        lesson = lessons_by_concept.get(name)
        concept.lesson_id = lesson.id if lesson else None
        db.flush()
        concepts[name] = concept

    # Prerequisite edges drive the knowledge graph view.
    for name, _, prerequisites in CONCEPTS:
        for prerequisite_name in prerequisites:
            concept_id = concepts[name].id
            prerequisite_id = concepts[prerequisite_name].id
            exists = (
                db.query(ConceptPrerequisite)
                .filter(
                    ConceptPrerequisite.concept_id == concept_id,
                    ConceptPrerequisite.prerequisite_id == prerequisite_id,
                )
                .first()
            )
            if exists is None:
                db.add(
                    ConceptPrerequisite(
                        concept_id=concept_id, prerequisite_id=prerequisite_id
                    )
                )
    db.flush()

    quiz_title = "Cells and Transport — Check Your Understanding"
    quiz = (
        db.query(Quiz)
        .filter(Quiz.classroom_id == classroom.id, Quiz.title == quiz_title)
        .first()
    )
    if quiz is None:
        quiz = Quiz(classroom_id=classroom.id, title=quiz_title)
        db.add(quiz)

    quiz.lesson_id = lessons_by_concept["Passive Transport"].id
    quiz.difficulty = "medium"
    quiz.quiz_type = "standard"
    quiz.questions = QUIZ_QUESTIONS
    quiz.is_published = True
    quiz.created_by_user_id = teacher.id
    db.flush()

    # Progress history so dashboards and the leaderboard are populated.
    now = datetime.now(timezone.utc)
    for student in students:
        profile = PROGRESS[student.email]

        record = (
            db.query(Gamification)
            .filter(
                Gamification.user_id == student.id,
                Gamification.classroom_id == classroom.id,
            )
            .first()
        )
        if record is None:
            record = Gamification(user_id=student.id, classroom_id=classroom.id)
            db.add(record)

        record.xp = profile["xp"]
        record.badges = profile["badges"]
        record.streak_days = profile["streak"]
        record.last_activity_at = now - timedelta(hours=5)

        for concept_name, score in profile["mastery"].items():
            concept = concepts[concept_name]
            mastery = (
                db.query(StudentConceptMastery)
                .filter(
                    StudentConceptMastery.student_id == student.id,
                    StudentConceptMastery.concept_id == concept.id,
                )
                .first()
            )
            if mastery is None:
                mastery = StudentConceptMastery(
                    student_id=student.id, concept_id=concept.id
                )
                db.add(mastery)

            mastery.mastery_score = score
            mastery.attempts = 3
            mastery.unaided_mastery = round(max(score - 0.08, 0.0), 2)
            mastery.aided_mastery = round(min(score + 0.05, 1.0), 2)
            mastery.metacognitive_score = round(min(score + 0.03, 1.0), 2)

    db.commit()

    print("Seed complete.")
    print(f"  Classroom : {classroom.name} (join code {classroom.code})")
    print(f"  Teacher   : {TEACHER['email']} / {DEMO_PASSWORD}")
    for student in STUDENTS:
        print(f"  Student   : {student['email']} / {DEMO_PASSWORD}")
    print(f"  Lessons   : {len(LESSONS)}   Concepts: {len(CONCEPTS)}   Quiz questions: {len(QUIZ_QUESTIONS)}")


def main() -> None:
    with SessionLocal() as db:
        seed(db)


if __name__ == "__main__":
    main()
