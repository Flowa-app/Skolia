'use client';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { TeacherProfile, EditableParam } from '@/lib/types';

interface Props {
  params: Partial<TeacherProfile>;
  onConfirm: (keys: EditableParam[]) => void;
}

const ROWS: {
  key: EditableParam;
  label: string;
  icon: string;
}[] = [
  { key: 'subject',       label: 'Matière',           icon: '📚' },
  { key: 'classLevel',    label: 'Classe',             icon: '🏫' },
  { key: 'exerciseTypes', label: "Types d'exercice",   icon: '📝' },
  { key: 'gradingScale',  label: 'Barème',             icon: '⚖️' },
  { key: 'severity',      label: 'Sévérité',           icon: '🎯' },
];

function formatValue(key: EditableParam, value: TeacherProfile[EditableParam]): string {
  if (!value) return '—';
  if (key === 'exerciseTypes') return (value as string[]).join(', ');
  if (key === 'severity') {
    return value === 'bienveillant' ? '😊 Bienveillant'
         : value === 'exigeant'     ? '🎯 Exigeant'
         :                            '⚖️ Standard';
  }
  return value as string;
}

export default function ParamEditor({ params, onConfirm }: Props) {
  const [selected, setSelected] = useState<Set<EditableParam>>(new Set());

  function toggle(key: EditableParam) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const count = selected.size;

  return (
    <div
      className="rounded-2xl overflow-hidden msg-enter"
      style={{
        background: '#FFFEF9',
        border: '1px solid rgba(94,45,154,0.13)',
        boxShadow: '0 1px 6px rgba(94,45,154,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: 'rgba(94,45,154,0.1)', background: 'rgba(94,45,154,0.03)' }}
      >
        <p className="font-sans text-[12px] font-semibold text-plum-500 uppercase tracking-widest">
          Sélectionnez les paramètres à modifier
        </p>
      </div>

      {/* Param rows */}
      {ROWS.map(({ key, label, icon }, i) => {
        const rawValue = params[key] as TeacherProfile[EditableParam] | undefined;
        const displayValue = rawValue !== undefined ? formatValue(key, rawValue) : '—';
        const isSelected = selected.has(key);
        const hasBorder = i < ROWS.length - 1;

        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`
              w-full flex items-center justify-between
              px-4 py-3 text-left
              transition-colors duration-100
              ${isSelected ? 'bg-plum-50' : 'hover:bg-plum-50/60'}
            `}
            style={hasBorder ? { borderBottom: '1px solid rgba(94,45,154,0.07)' } : {}}
          >
            <div className="flex items-center gap-3">
              <span className="text-base leading-none w-5 text-center" aria-hidden>
                {icon}
              </span>
              <div>
                <p className="font-sans text-[11px] text-stone-400 uppercase tracking-wide leading-none mb-0.5">
                  {label}
                </p>
                <p className="font-sans text-[14px] font-medium text-stone-800 leading-snug">
                  {displayValue}
                </p>
              </div>
            </div>

            <span
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                transition-all duration-100
                ${isSelected
                  ? 'bg-plum-600 border-plum-600'
                  : 'border-plum-300 bg-white'}
              `}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </span>
          </button>
        );
      })}

      {/* Confirm footer */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: 'rgba(94,45,154,0.1)', background: 'rgba(94,45,154,0.02)' }}
      >
        <button
          onClick={() => { if (count > 0) onConfirm([...selected]); }}
          disabled={count === 0}
          className="
            w-full py-2 rounded-xl
            font-sans text-[13px] font-semibold text-white
            bg-plum-600 hover:bg-plum-700 active:scale-[0.99]
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          {count === 0
            ? 'Sélectionnez au moins un paramètre'
            : count === 1
            ? 'Modifier ce paramètre →'
            : `Modifier ces ${count} paramètres →`}
        </button>
      </div>
    </div>
  );
}
