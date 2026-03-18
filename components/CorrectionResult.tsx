'use client';
import { CorrectionResult as CR, CorrectionParams } from '@/lib/types';
import ExportButton from './ExportButton';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  result: CR;
  params?: Partial<CorrectionParams>;
  onAdjust?: (instruction: string) => void;
}

const QUICK_ADJUSTMENTS = [
  'Sois moins strict',
  'Ajoute des encouragements',
  'Détaille davantage les erreurs',
  'Simplifie le commentaire élève',
  'Augmente la note',
  'Baisse la note',
];

export default function CorrectionResult({ result, params, onAdjust }: Props) {
  const [copied, setCopied] = useState(false);

  function copyComment() {
    navigator.clipboard.writeText(result.studentComment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function renderAnnotations(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  return (
    <div className="space-y-3 ml-11">

      {/* ── Grade stamp ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 px-1">
        <div className="grade-stamp">
          <p
            className="text-[10px] uppercase tracking-widest font-sans font-semibold text-plum-400 mb-1"
          >
            Note proposée
          </p>
          <p className="font-serif font-bold text-plum-700 leading-none text-4xl">
            {result.grade}
          </p>
        </div>
        {params?.subject && (
          <div className="text-xs font-sans text-stone-500 leading-relaxed">
            <span className="font-semibold text-stone-600">{params.subject}</span>
            {params.classLevel && <> · {params.classLevel}</>}
            {params.exerciseTypes?.length && (
              <><br /><span className="italic">{params.exerciseTypes.join(', ')}</span></>
            )}
          </div>
        )}
      </div>

      {/* ── Annotations ──────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-4 border-l-4"
        style={{
          background: '#FFFEF9',
          border: '1px solid rgba(94,45,154,0.12)',
          borderLeft: '3px solid #9B64CF',
        }}
      >
        <p className="text-[10px] uppercase tracking-widest font-sans font-semibold text-plum-400 mb-2.5">
          Annotations détaillées
        </p>
        <div
          className="text-[14px] font-sans text-stone-700 leading-relaxed whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: renderAnnotations(result.annotations) }}
        />
      </div>

      {/* ── Points positifs + À améliorer ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Points positifs — sage green, calm and encouraging */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#F3FAF5', border: '1px solid #C2E6CE' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-sans font-semibold text-sage-700 mb-2.5 flex items-center gap-1.5">
            <span className="text-sage-600 text-xs">✦</span> Points positifs
          </p>
          <div className="text-[14px] font-sans text-sage-900 leading-relaxed whitespace-pre-line">
            {result.goodPoints}
          </div>
        </div>

        {/* À améliorer — warm amber, not red/orange, non-anxious */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#FFFBF0', border: '1px solid #FDE49E' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-sans font-semibold text-amber-700 mb-2.5 flex items-center gap-1.5">
            <span className="text-amber-600 text-xs">→</span> À améliorer
          </p>
          <div className="text-[14px] font-sans text-amber-900 leading-relaxed whitespace-pre-line">
            {result.improvements}
          </div>
        </div>

      </div>

      {/* ── Student comment — parchment ───────────────────────────────── */}
      <div className="parchment-box p-4">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] uppercase tracking-widest font-sans font-semibold text-amber-700 flex items-center gap-1.5">
            <span className="text-base">✉</span> Commentaire pour l&apos;élève
          </p>
          <button
            onClick={copyComment}
            className="
              flex items-center gap-1.5 text-[12px] font-sans font-medium
              text-amber-700 hover:text-amber-900
              bg-parchment-100 hover:bg-parchment-200
              border border-parchment-200
              px-2.5 py-1 rounded-lg
              transition-all duration-150 active:scale-95
            "
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
        <p className="text-[14px] font-serif italic text-stone-700 leading-relaxed">
          &ldquo;{result.studentComment}&rdquo;
        </p>
      </div>

      {/* ── Adjustments ──────────────────────────────────────────────── */}
      {onAdjust && (
        <div
          className="rounded-xl p-4"
          style={{ background: '#FFFEF9', border: '1px solid rgba(94,45,154,0.1)' }}
        >
          <p className="text-[11px] font-sans font-medium text-stone-500 mb-3">
            Affiner la correction :
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADJUSTMENTS.map(adj => (
              <button
                key={adj}
                onClick={() => onAdjust(adj)}
                className="
                  text-[13px] font-sans px-3 py-1.5 rounded-lg
                  border border-plum-200 text-plum-700
                  bg-white hover:bg-plum-50 hover:border-plum-400
                  transition-all duration-150 active:scale-95 shadow-sm
                "
              >
                {adj}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Export ───────────────────────────────────────────────────── */}
      <ExportButton result={result} params={params} />

    </div>
  );
}
