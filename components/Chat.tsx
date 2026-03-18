'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Message, OnboardingStep, TeacherProfile,
  CorrectionParams, CorrectionResult, OriginalCopy, EditableParam,
} from '@/lib/types';
import { saveProfile, loadProfile, getDailyCallCount, incrementDailyCallCount } from '@/lib/storage';
import ChatMessage from './ChatMessage';
import ImageUpload from './ImageUpload';
import ParamEditor from './ParamEditor';
import ExerciseTypePicker from './ExerciseTypePicker';
import SkoliaAvatar from './SkoliaAvatar';

const MAX_DAILY_CALLS = parseInt(process.env.NEXT_PUBLIC_MAX_DAILY_CALLS || '20');

const CLASS_LEVELS = ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'];
const SEVERITY_OPTIONS = [
  { value: 'bienveillant', label: 'Bienveillant', emoji: '😊', desc: 'Encourageant, indulgent' },
  { value: 'standard',     label: 'Standard',     emoji: '⚖️', desc: 'Équilibré, objectif' },
  { value: 'exigeant',     label: 'Exigeant',     emoji: '🎯', desc: 'Rigoureux, strict' },
];

const PARAM_QUESTIONS: Record<EditableParam, string> = {
  subject:       'Pour quelle matière corrigez-vous ?',
  classLevel:    'Pour quelle classe ?',
  exerciseTypes: "Quels types d'exercice ? (vous pouvez en sélectionner plusieurs)",
  gradingScale:  'Sur quel barème ? (ex : /10, /20, /5…)',
  severity:      'Quelle sévérité souhaitez-vous ?',
};

const PARAM_LABELS: Record<EditableParam, string> = {
  subject:       'Matière',
  classLevel:    'Classe',
  exerciseTypes: "Types d'exercice",
  gradingScale:  'Barème',
  severity:      'Sévérité',
};

function makeId() { return Math.random().toString(36).slice(2); }
function assistantMsg(content: string, extra?: Partial<Message>): Message {
  return { id: makeId(), role: 'assistant', content, ...extra };
}
function userMsg(content: string): Message {
  return { id: makeId(), role: 'user', content };
}

export default function Chat() {
  const [messages,         setMessages]         = useState<Message[]>([]);
  const [step,             setStep]             = useState<OnboardingStep>('welcome');
  const [params,           setParams]           = useState<Partial<CorrectionParams>>({});
  const [input,            setInput]            = useState('');
  const [isTyping,         setIsTyping]         = useState(false);
  const [showUpload,       setShowUpload]        = useState(false);
  const [showParamEditor,  setShowParamEditor]  = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [editingParam,     setEditingParam]     = useState<EditableParam | null>(null);
  const [savedProfile,     setSavedProfile]     = useState<TeacherProfile | null>(null);
  const [dailyCount,       setDailyCount]       = useState(0);
  const [quickReplies,     setQuickReplies]     = useState<string[]>([]);
  const [originalCopy,     setOriginalCopy]     = useState<OriginalCopy | undefined>();
  const [correctionStatus, setCorrectionStatus] = useState<string | null>(null);

  // Queue of params to edit in sequence
  const pendingEditsRef = useRef<EditableParam[]>([]);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);

  /* ── Init ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setDailyCount(getDailyCallCount());
    const profile = loadProfile();
    setSavedProfile(profile);
    startOnboarding(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showUpload, showParamEditor, showExercisePicker]);

  /* ── Message helper ───────────────────────────────────────────────────── */
  function addAssistantMsg(
    content: string,
    extra?: Partial<Message>,
    replies?: string[],
  ): Promise<void> {
    return new Promise(resolve => {
      setIsTyping(true);
      const delay = Math.min(700 + content.length * 7, 2200);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, assistantMsg(content, extra)]);
        if (replies) setQuickReplies(replies);
        resolve();
      }, delay);
    });
  }

  /* ── Param edit queue ─────────────────────────────────────────────────── */

  async function startEditingParam(key: EditableParam) {
    setEditingParam(key);
    const question = PARAM_QUESTIONS[key];
    if (key === 'classLevel') {
      await addAssistantMsg(question, undefined, CLASS_LEVELS);
      setStep('classLevel');
    } else if (key === 'exerciseTypes') {
      await addAssistantMsg(question);
      setShowExercisePicker(true);
      setStep('exerciseType');
    } else if (key === 'severity') {
      await addAssistantMsg(question, undefined, SEVERITY_OPTIONS.map(s => `${s.emoji} ${s.label} — ${s.desc}`));
      setStep('severity');
    } else {
      await addAssistantMsg(question);
      setStep(key as OnboardingStep);
    }
  }

  async function finishParamEdit(
    updated: Partial<CorrectionParams>,
    displayValue: string,
    paramLabel: string,
  ) {
    setEditingParam(null);
    if (
      updated.subject && updated.classLevel &&
      updated.exerciseTypes?.length && updated.gradingScale && updated.severity
    ) {
      saveProfile(updated as TeacherProfile);
      setSavedProfile(updated as TeacherProfile);
    }
    await addAssistantMsg(`${paramLabel} mis à jour : **${displayValue}** ✓`);

    // Pop the current param from the queue and check if more remain
    const [, ...remaining] = pendingEditsRef.current;
    pendingEditsRef.current = remaining;

    if (remaining.length > 0) {
      await startEditingParam(remaining[0]);
    } else {
      await addAssistantMsg('Envoyez-moi la copie à corriger. Vous pouvez importer une photo/scan ou coller le texte directement.');
      setStep('awaiting-copy');
      setShowUpload(true);
    }
  }

  /* ── Param editor: user confirms selected params ──────────────────────── */
  async function handleParamConfirm(keys: EditableParam[]) {
    setShowParamEditor(false);
    pendingEditsRef.current = keys;
    const displayKeys = keys.map(k => PARAM_LABELS[k]).join(', ');
    setMessages(prev => [...prev, userMsg(`Modifier : ${displayKeys}`)]);
    await startEditingParam(keys[0]);
  }

  /* ── Onboarding flow ──────────────────────────────────────────────────── */
  async function startOnboarding(profile: TeacherProfile | null) {
    await addAssistantMsg(
      'Bonjour ! Je suis Skolia, votre assistant de correction. 👋\n\nJe vais vous aider à corriger cette copie en quelques instants.',
    );
    if (profile) {
      const typesLabel = profile.exerciseTypes.join(', ');
      await addAssistantMsg(
        `J'ai retrouvé vos paramètres habituels :\n• Matière : ${profile.subject}\n• Classe : ${profile.classLevel}\n• Types : ${typesLabel}\n• Barème : ${profile.gradingScale}\n• Mode : ${profile.severity}\n\nVoulez-vous reprendre ces paramètres ?`,
        undefined,
        ['Oui, reprendre mes paramètres', 'Modifier des paramètres', 'Non, tout recommencer'],
      );
      setStep('welcome');
    } else {
      await addAssistantMsg('Pour quelle matière corrigez-vous aujourd\'hui ?');
      setStep('subject');
    }
  }

  async function handleProfileChoice(choice: string) {
    setQuickReplies([]);
    setMessages(prev => [...prev, userMsg(choice)]);
    if (choice.startsWith('Oui') && savedProfile) {
      setParams(savedProfile);
      await addAssistantMsg('Parfait, je reprends vos paramètres habituels ! 🎉');
      await addAssistantMsg('Envoyez-moi la copie à corriger. Vous pouvez importer une photo/scan ou coller le texte directement.');
      setStep('awaiting-copy');
      setShowUpload(true);
    } else if (choice.includes('Modifier') && savedProfile) {
      setParams(savedProfile);
      await addAssistantMsg('Bien sûr ! Quels paramètres souhaitez-vous modifier ?');
      setStep('editing-params');
      setShowParamEditor(true);
    } else {
      await addAssistantMsg('Pas de problème ! Pour quelle matière corrigez-vous aujourd\'hui ?');
      setStep('subject');
    }
  }

  /* ── Per-param handlers ── each checks editingParam to fork early ─────── */

  async function handleSubjectInput(text: string) {
    const p = { ...params, subject: text };
    setParams(p);
    setMessages(prev => [...prev, userMsg(text)]);
    if (editingParam === 'subject') {
      await finishParamEdit(p, text, 'Matière');
      return;
    }
    await addAssistantMsg(`${text}, très bien !\n\nPour quelle classe ?`, undefined, CLASS_LEVELS);
    setStep('classLevel');
  }

  async function handleClassLevel(level: string) {
    setQuickReplies([]);
    const p = { ...params, classLevel: level };
    setParams(p);
    setMessages(prev => [...prev, userMsg(level)]);
    if (editingParam === 'classLevel') {
      await finishParamEdit(p, level, 'Classe');
      return;
    }
    await addAssistantMsg(`${level}, noté !\n\nQuel(s) type(s) d'exercice ?`);
    setShowExercisePicker(true);
    setStep('exerciseType');
  }

  async function handleExerciseTypesConfirmed(types: string[]) {
    setShowExercisePicker(false);
    const label = types.join(', ');
    const p = { ...params, exerciseTypes: types };
    setParams(p);
    setMessages(prev => [...prev, userMsg(label)]);
    if (editingParam === 'exerciseTypes') {
      await finishParamEdit(p, label, "Types d'exercice");
      return;
    }
    await addAssistantMsg('Sur quel barème notez-vous ? (ex : /10, /20, /5 avec critères…)');
    setStep('gradingScale');
  }

  async function handleGradingScale(scale: string) {
    const p = { ...params, gradingScale: scale };
    setParams(p);
    setMessages(prev => [...prev, userMsg(scale)]);
    if (editingParam === 'gradingScale') {
      await finishParamEdit(p, scale, 'Barème');
      return;
    }
    await addAssistantMsg(
      'Quelle sévérité souhaitez-vous pour la correction ?',
      undefined,
      SEVERITY_OPTIONS.map(s => `${s.emoji} ${s.label} — ${s.desc}`),
    );
    setStep('severity');
  }

  async function handleSeverity(raw: string) {
    setQuickReplies([]);
    const matched = SEVERITY_OPTIONS.find(s => raw.toLowerCase().includes(s.value));
    const severity = (matched?.value || 'standard') as 'bienveillant' | 'standard' | 'exigeant';
    const p = { ...params, severity };
    setParams(p);
    setMessages(prev => [...prev, userMsg(raw)]);
    if (editingParam === 'severity') {
      const label = matched ? `${matched.emoji} ${matched.label}` : severity;
      await finishParamEdit(p, label, 'Sévérité');
      return;
    }
    // Full onboarding: save profile then proceed
    if (p.subject && p.classLevel && p.exerciseTypes?.length && p.gradingScale) {
      saveProfile(p as TeacherProfile);
      setSavedProfile(p as TeacherProfile);
    }
    const typesLabel = p.exerciseTypes?.join(', ') ?? '';
    await addAssistantMsg(
      `Tout est prêt ! Voici le récapitulatif :\n• Matière : ${p.subject}\n• Classe : ${p.classLevel}\n• Exercice(s) : ${typesLabel}\n• Barème : ${p.gradingScale}\n• Sévérité : ${severity}`,
    );
    await addAssistantMsg('Envoyez-moi maintenant la copie à corriger. Vous pouvez importer une photo/scan ou coller le texte directement.');
    setStep('awaiting-copy');
    setShowUpload(true);
  }

  /* ── Correction ───────────────────────────────────────────────────────── */
  async function runCorrection(correctionParams: CorrectionParams, copy?: OriginalCopy) {
    setShowUpload(false);
    setStep('correcting');
    setCorrectionStatus('Analyse en cours… (environ 10–15 secondes)');

    if (dailyCount >= MAX_DAILY_CALLS) {
      setCorrectionStatus(null);
      await addAssistantMsg(`Vous avez atteint la limite journalière de ${MAX_DAILY_CALLS} corrections. Revenez demain ! 🙏`);
      setStep('done');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      incrementDailyCallCount();
      setDailyCount(getDailyCallCount());

      const res = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(correctionParams),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      setCorrectionStatus(null);
      if (!data.success) throw new Error(data.error);

      const result: CorrectionResult = data.result;
      setMessages(prev => [...prev, assistantMsg(
        'Voici la correction détaillée ! 📝',
        { type: 'correction', correctionResult: result, originalCopy: copy ?? originalCopy },
      )]);
      await addAssistantMsg(
        'Vous pouvez affiner la correction ou corriger une nouvelle copie.',
        undefined,
        ['Corriger une autre copie', 'Modifier les paramètres'],
      );
      setStep('done');
    } catch (err) {
      clearTimeout(timeoutId);
      setCorrectionStatus(null);
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      const msg = isTimeout
        ? 'La correction prend trop de temps, veuillez réessayer.'
        : "Une erreur s'est produite lors de la correction. Veuillez réessayer.";
      await addAssistantMsg(msg);
      setStep('awaiting-copy');
      setShowUpload(true);
    }
  }

  async function handleAdjustment(instruction: string) {
    setMessages(prev => [...prev, userMsg(instruction)]);
    const last = [...messages].reverse().find(m => m.type === 'correction');
    if (!last?.correctionResult) return;
    const adjustParams: CorrectionParams = {
      ...(params as CorrectionParams),
      studentText: `[AJUSTEMENT DEMANDÉ: "${instruction}"]\n\nCorrection précédente à modifier :\nNote: ${last.correctionResult.grade}\nAnnotations: ${last.correctionResult.annotations}\nCommentaire élève: ${last.correctionResult.studentComment}\n\nMerci d'ajuster selon la demande.`,
    };
    await runCorrection(adjustParams);
  }

  async function handleDoneChoice(choice: string) {
    setQuickReplies([]);
    setMessages(prev => [...prev, userMsg(choice)]);
    if (choice.includes('autre')) {
      await addAssistantMsg('Très bien ! Envoyez-moi la prochaine copie.');
      setStep('awaiting-copy');
      setShowUpload(true);
    } else if (choice.includes('Modifier')) {
      await addAssistantMsg('Bien sûr ! Quels paramètres souhaitez-vous modifier ?');
      setStep('editing-params');
      setShowParamEditor(true);
    } else {
      setParams({});
      setOriginalCopy(undefined);
      await addAssistantMsg('D\'accord ! Pour quelle matière corrigez-vous cette fois ?');
      setStep('subject');
    }
  }

  /* ── Text input routing ───────────────────────────────────────────────── */
  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput('');
    setQuickReplies([]);

    if (step === 'welcome')         await handleProfileChoice(content);
    else if (step === 'subject')    await handleSubjectInput(content);
    else if (step === 'classLevel') {
      const matched = CLASS_LEVELS.find(l => content.toLowerCase().includes(l.toLowerCase()));
      await handleClassLevel(matched ?? content);
    }
    else if (step === 'gradingScale') await handleGradingScale(content);
    else if (step === 'severity')     await handleSeverity(content);
    else if (step === 'done')         await handleDoneChoice(content);
  }

  async function handleImageReady(base64: string, mimeType: string) {
    const label = mimeType === 'application/pdf' ? '📄 PDF envoyé' : '📷 Photo de la copie envoyée';
    setMessages(prev => [...prev, userMsg(label)]);
    const copy: OriginalCopy = { imageBase64: base64, imageMimeType: mimeType };
    setOriginalCopy(copy);
    setShowUpload(false);
    await runCorrection({ ...(params as CorrectionParams), imageBase64: base64, imageMimeType: mimeType }, copy);
  }

  async function handleTextReady(text: string) {
    setMessages(prev => [...prev, userMsg(`📝 Texte collé (${text.length} caractères)`)]);
    const copy: OriginalCopy = { text };
    setOriginalCopy(copy);
    setShowUpload(false);
    await runCorrection({ ...(params as CorrectionParams), studentText: text }, copy);
  }

  const freeInput = step === 'subject' || step === 'gradingScale';
  const isInputDisabled =
    isTyping || !!correctionStatus || showUpload || showParamEditor || showExercisePicker ||
    (quickReplies.length > 0 && !freeInput);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 py-3.5 sticky top-0 z-10"
        style={{
          background: 'rgba(250, 248, 243, 0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(94, 45, 154, 0.1)',
          boxShadow: '0 1px 8px rgba(94,45,154,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <SkoliaAvatar size={38} />
          <div>
            <h1 className="font-serif font-semibold text-plum-800 leading-none text-[17px]">
              Skolia
            </h1>
            <p className="text-xs text-plum-400 font-sans mt-0.5">
              Assistant de correction
            </p>
          </div>
        </div>

        {dailyCount > 0 && (
          <span className="text-xs text-plum-400 font-sans bg-plum-50 border border-plum-100 px-2.5 py-1 rounded-full">
            {dailyCount}/{MAX_DAILY_CALLS} corrections
          </span>
        )}
      </header>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-hide">

        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            params={params}
            onAdjust={step === 'done' ? handleAdjustment : undefined}
          />
        ))}

        {/* Typing / correction status indicator */}
        {(isTyping || correctionStatus) && (
          <div className="flex items-end gap-3 my-2.5 msg-enter">
            <SkoliaAvatar />
            <div className="bubble-assistant px-4 py-3.5">
              {correctionStatus ? (
                <p className="font-sans text-[14px] text-stone-500 italic">{correctionStatus}</p>
              ) : (
                <>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </>
              )}
            </div>
          </div>
        )}

        {/* Exercise type picker */}
        {showExercisePicker && !isTyping && (
          <div className="ml-11 mt-2 mb-3 msg-enter">
            <ExerciseTypePicker
              initial={params.exerciseTypes ?? []}
              onConfirm={handleExerciseTypesConfirmed}
            />
          </div>
        )}

        {/* Param editor */}
        {showParamEditor && !isTyping && (
          <div className="ml-11 mt-2 mb-3 msg-enter">
            <ParamEditor
              params={params}
              onConfirm={handleParamConfirm}
            />
          </div>
        )}

        {/* Upload zone */}
        {showUpload && !isTyping && (
          <div className="ml-11 mt-2 mb-3 msg-enter">
            <ImageUpload
              onImageReady={handleImageReady}
              onTextReady={handleTextReady}
            />
          </div>
        )}

        {/* Quick-reply chips */}
        {quickReplies.length > 0 && !isTyping && !showUpload && !showParamEditor && !showExercisePicker && (
          <div className="flex flex-wrap gap-2 mt-3 mb-3 ml-11 msg-enter">
            {quickReplies.map(reply => (
              <button key={reply} onClick={() => handleSend(reply)} className="chip">
                {reply}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <div
        className="px-4 py-3"
        style={{
          background: 'rgba(250, 248, 243, 0.95)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(94, 45, 154, 0.1)',
        }}
      >
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isInputDisabled) handleSend(); }}
            placeholder={
              isTyping              ? 'Skolia réfléchit…' :
              step === 'correcting' ? 'Correction en cours…' :
              showParamEditor       ? 'Sélectionnez les paramètres ci-dessus' :
              showExercisePicker    ? 'Sélectionnez les types ci-dessus' :
              showUpload            ? 'Utilisez le module ci-dessus' :
              quickReplies.length   ? 'Ou tapez votre réponse…' :
                                      'Votre réponse…'
            }
            disabled={isInputDisabled}
            className="
              flex-1 px-4 py-2.5 rounded-xl border font-sans text-[15px]
              text-stone-800 placeholder-stone-400
              bg-white border-plum-200
              focus:outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-200
              disabled:bg-stone-50 disabled:text-stone-400 disabled:border-stone-200
              transition-all duration-150
            "
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isInputDisabled}
            aria-label="Envoyer"
            className="
              w-10 h-10 rounded-xl flex items-center justify-center
              bg-plum-600 hover:bg-plum-700 active:scale-95
              shadow-sm hover:shadow
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M9 3l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-[11px] text-stone-400 font-sans mt-2">
          Skolia · Correction assistée par IA · Aucune donnée stockée en ligne
        </p>
      </div>

    </div>
  );
}
