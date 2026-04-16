/**
 * Lightweight i18n stub for EduNexus (FR19).
 *
 * Supports English (default) and French as a second language.
 * Add more locales by extending the `translations` object.
 */

const LOCALE_KEY = "edunexus_locale";

const translations = {
  en: {
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Log out",
    "dashboard.teacher": "Teacher Dashboard",
    "dashboard.student": "Student Dashboard",
    "dashboard.classrooms": "My Classrooms",
    "dashboard.xp": "XP",
    "dashboard.streak": "Streak",
    "dashboard.badges": "Badges",
    "dashboard.progress": "View your Learning Progress",
    "lesson.create": "Create Lesson",
    "lesson.generate": "Generate Lesson",
    "lesson.publish": "Publish",
    "lesson.unpublish": "Unpublish",
    "lesson.readAloud": "Read Aloud",
    "lesson.stopReading": "Stop Reading",
    "quiz.submit": "Submit",
    "quiz.tryAgain": "Try Again",
    "quiz.score": "Score",
    "quiz.reflection": "Reflection",
    "classroom.join": "Join Classroom",
    "classroom.create": "Create Classroom",
    "classroom.code": "Classroom Code",
    "analytics.scoreTrend": "Score Trend",
    "analytics.topicMastery": "Topic Mastery",
    "analytics.calibration": "Self-Assessment Calibration",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.dashboard": "Tableau de bord",
    "nav.login": "Connexion",
    "nav.register": "S'inscrire",
    "nav.logout": "Déconnexion",
    "dashboard.teacher": "Tableau de bord enseignant",
    "dashboard.student": "Tableau de bord étudiant",
    "dashboard.classrooms": "Mes classes",
    "dashboard.xp": "XP",
    "dashboard.streak": "Série",
    "dashboard.badges": "Badges",
    "dashboard.progress": "Voir votre progression",
    "lesson.create": "Créer une leçon",
    "lesson.generate": "Générer une leçon",
    "lesson.publish": "Publier",
    "lesson.unpublish": "Dépublier",
    "lesson.readAloud": "Lire à voix haute",
    "lesson.stopReading": "Arrêter la lecture",
    "quiz.submit": "Soumettre",
    "quiz.tryAgain": "Réessayer",
    "quiz.score": "Score",
    "quiz.reflection": "Réflexion",
    "classroom.join": "Rejoindre une classe",
    "classroom.create": "Créer une classe",
    "classroom.code": "Code de la classe",
    "analytics.scoreTrend": "Tendance des scores",
    "analytics.topicMastery": "Maîtrise des sujets",
    "analytics.calibration": "Calibration d'auto-évaluation",
    "common.loading": "Chargement...",
    "common.error": "Une erreur est survenue",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
  },
};

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export function getLocale() {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(LOCALE_KEY) || "en";
}

export function setLocale(locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_KEY, locale);
}

/**
 * Translate a key to the current locale.
 * Falls back to English, then to the key itself.
 */
export function t(key, locale) {
  const lang = locale || getLocale();
  return translations[lang]?.[key] || translations.en?.[key] || key;
}
