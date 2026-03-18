'use client';
import { Message, CorrectionParams } from '@/lib/types';
import CorrectionResult from './CorrectionResult';
import SkoliaAvatar from './SkoliaAvatar';

interface Props {
  message: Message;
  params?: Partial<CorrectionParams>;
  onAdjust?: (instruction: string) => void;
}

export default function ChatMessage({ message, params, onAdjust }: Props) {
  const isAssistant = message.role === 'assistant';

  if (message.type === 'correction' && message.correctionResult) {
    return (
      <div className="flex flex-col gap-3 my-3 msg-enter">
        <div className="flex items-start gap-3">
          <SkoliaAvatar />
          <div className="bubble-assistant px-4 py-3 max-w-[85%]">
            <p className="text-stone-700 text-[15px] leading-relaxed">{message.content}</p>
          </div>
        </div>
        <CorrectionResult
          result={message.correctionResult}
          params={params}
          onAdjust={onAdjust}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-3 my-2.5 msg-enter ${!isAssistant ? 'flex-row-reverse' : ''}`}>
      {isAssistant && <SkoliaAvatar />}

      <div
        className={`px-4 py-3 max-w-[78%] text-[15px] leading-relaxed ${
          isAssistant ? 'bubble-assistant text-stone-800' : 'bubble-user'
        }`}
      >
        {message.content.split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
