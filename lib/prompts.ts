import { CorrectionParams } from './types';

export function buildCorrectionSystemPrompt(params: CorrectionParams): string {
  const isEnglishSubject = params.subject.toLowerCase().includes('anglais') ||
                            params.subject.toLowerCase().includes('english');

  const severityInstructions = {
    bienveillant: `Sois très encourageant(e) et bienveillant(e). Mets en valeur les points positifs avant les axes d'amélioration. Le feedback doit motiver l'élève. Sois indulgent(e) sur les petites erreurs.`,
    standard: `Adopte une correction équilibrée, objective et constructive. Note les erreurs clairement mais avec tact. Encourage les points réussis.`,
    exigeant: `Sois rigoureux(se) et précis(e). Pointe toutes les erreurs avec exactitude. Les exigences sont élevées, la notation est stricte. Reste respectueux(se) mais ferme.`
  };

  const langNote = isEnglishSubject
    ? `La matière est l'anglais. Évalue le contenu anglais (grammaire anglaise, vocabulaire, syntaxe), mais rédige TOUS tes retours (annotations, commentaire élève, points forts/faibles) EN FRANÇAIS pour que le professeur français puisse les utiliser directement.`
    : `La matière est "${params.subject}". Évalue et corrige en tenant compte des exigences de cette matière.`;

  const exerciseTypesLabel = params.exerciseTypes.length === 1
    ? params.exerciseTypes[0]
    : params.exerciseTypes.map((t, i) => `Partie ${i + 1} – ${t}`).join(', ');

  const multiPartInstructions = params.exerciseTypes.length > 1
    ? `\nIMPORTANT : Cette évaluation comporte ${params.exerciseTypes.length} parties distinctes. Structure impérativement tes annotations en annonçant chaque partie : "Partie 1 – ${params.exerciseTypes[0]} :", "Partie 2 – ${params.exerciseTypes[1]} :", etc. Traite chaque partie séparément dans les annotations.`
    : '';

  return `Tu es un assistant pédagogique expert qui aide les professeurs français à corriger des copies d'élèves.

${langNote}

Niveau de classe : ${params.classLevel}
Type(s) d'exercice : ${exerciseTypesLabel}
Barème : ${params.gradingScale}
Sévérité de correction : ${params.severity}
${multiPartInstructions}
Instructions de sévérité : ${severityInstructions[params.severity]}

RÈGLE DE NOTATION STRICTE :
- Pour les exercices à réponses discrètes (conjugaison, grammaire, QCM, vocabulaire) : calcule la note UNIQUEMENT par la formule mathématique exacte : note = (bonnes réponses / total questions) × note maximale. Aucun crédit partiel, aucune interprétation. Exemple : 5 bonnes réponses sur 10, barème /20 → 10/20 exactement.
- Pour les exercices ouverts (expression écrite, compréhension écrite, commentaire) : utilise ton jugement pédagogique habituel.
- Ne jamais arrondir à la baisse de plus de 0,5 point.

Tu dois retourner ta correction sous forme d'un objet JSON valide avec exactement cette structure :
{
  "grade": "note proposée avec barème (ex: 14/20)",
  "annotations": "annotations détaillées ligne par ligne ou point par point, avec les erreurs identifiées et expliquées",
  "goodPoints": "liste des points positifs et réussis",
  "improvements": "liste des axes d'amélioration prioritaires",
  "studentComment": "commentaire prêt à l'emploi pour l'élève, en français, adapté au niveau ${params.classLevel}, sur 3-5 phrases, bienveillant mais honnête"
}

Adapte le niveau de langage du commentaire élève au niveau ${params.classLevel} (plus simple pour les collégiens, plus élaboré pour les lycéens).

FORMATAGE : Toutes les valeurs du JSON doivent être en texte brut uniquement. Aucun markdown, aucun astérisque, aucun backtick, aucun bloc de code, aucun caractère de formatage spécial. Uniquement du texte plain.
Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
}

export function buildCorrectionUserMessage(params: CorrectionParams): string {
  if (params.studentText) {
    return `Voici la copie de l'élève à corriger :\n\n${params.studentText}`;
  }
  return `Voici la photo/scan de la copie de l'élève à corriger. Analyse et corrige ce travail selon les paramètres définis.`;
}

export const MOCK_CORRECTION = {
  grade: "13/20",
  annotations: "Introduction : Bonne accroche, mais la problématique manque de précision. La thèse est présente mais gagnerait à être mieux formulée.\n\nDéveloppement - Partie 1 : Bonne structuration des idées. L'argument principal est solide. Attention à la tournure ligne 4 : les élèves ils apprennent → les élèves apprennent.\n\nDéveloppement - Partie 2 : L'exemple choisi est pertinent et bien exploité. Quelques erreurs d'accord : les résultats obtenus est → les résultats obtenus sont.\n\nConclusion : Synthèse correcte mais l'ouverture est absente. Un peu courte.",
  goodPoints: "Bonne compréhension générale du sujet\nStructure en parties clairement identifiables\nVocabulaire varié et approprié\nLes exemples choisis sont pertinents",
  improvements: "Travailler la formulation de la problématique\nRéviser les accords sujet-verbe\nDévelopper davantage la conclusion avec une ouverture\nÉviter les répétitions lexicales dans la partie 2",
  studentComment: "Ton devoir montre une bonne compréhension du sujet et une structure claire qui facilite la lecture. Tes exemples sont bien choisis et pertinents. Pour progresser encore, je t'encourage à soigner davantage ta conclusion en ajoutant une ouverture, et à relire tes accords sujet-verbe avant de rendre ton travail. Continue dans cette bonne direction !"
};
