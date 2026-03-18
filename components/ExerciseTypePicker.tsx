'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';

const EXERCISE_TYPES = [
  'Compréhension écrite',
  'Rédaction / Dissertation',
  'Grammaire',
  'Conjugaison',
  'Expression orale retranscrite',
  'Résumé',
  'Commentaire de texte',
  'Traduction',
  'Autre',
];

interface Props {
  initial?: string[];
  onConfirm: (types: string[]) => void;
}

export default function ExerciseTypePicker({ initial = [], onConfirm }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));

  function toggle(type: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const count = selected.size;

  return (
    <div className="rounded-2xl p-4 bg-white border border-plum-100 shadow-sm">
      <p className="font-sans text-[13px] font-semibold text-stone-600 mb-3">
        Sélectionnez le ou les types d&apos;exercice
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {EXERCISE_TYPES.map(type => {
          const active = selected.has(type);
          return (
            <button
              key={type}
              onClick={() => toggle(type)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full
                font-sans text-[13px] font-medium
                border transition-all duration-150 active:scale-[0.97]
                ${active
                  ? 'bg-plum-600 border-plum-600 text-white'
                  : 'bg-white border-plum-200 text-stone-600 hover:border-plum-400 hover:bg-plum-50'}
              `}
            >
              {active && <Check className="w-3 h-3 shrink-0" />}
              {type}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => { if (count > 0) onConfirm([...selected]); }}
        disabled={count === 0}
        className="
          w-full py-2.5 rounded-xl
          font-sans text-[14px] font-semibold text-white
          bg-plum-600 hover:bg-plum-700 active:scale-[0.99]
          disabled:opacity-40 disabled:cursor-not-allowed
          shadow-sm hover:shadow transition-all duration-150
        "
      >
        {count === 0
          ? 'Sélectionnez au moins un type'
          : count === 1
          ? 'Confirmer →'
          : `Confirmer (${count} types) →`}
      </button>
    </div>
  );
}
