interface Props {
  size?: number;
}

/**
 * Skolia avatar — a quill pen on a plum circle.
 * Deliberately crafted, not generic emoji.
 */
export default function SkoliaAvatar({ size = 34 }: Props) {
  return (
    <div
      className="flex-shrink-0 rounded-full shadow-sm"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #7C44B8 0%, #4A2278 100%)',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 34 34"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Feather body */}
        <path
          d="M24 7C17 5.5 11 10 9.5 16.5L8.5 23L15 20.5C20.5 18 25 13 24 7Z"
          fill="white"
          fillOpacity="0.88"
        />
        {/* Feather spine */}
        <path
          d="M24 7L9.5 16.5"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        {/* Quill nib */}
        <path
          d="M8.5 23L7 27L11 25Z"
          fill="white"
          fillOpacity="0.75"
        />
        {/* Inner vane highlight */}
        <path
          d="M24 7C20 9 15 13 9.5 16.5"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
