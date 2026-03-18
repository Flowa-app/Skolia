'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, File, Loader2 } from 'lucide-react';

interface Props {
  onImageReady: (base64: string, mimeType: string) => void;
  onTextReady: (text: string) => void;
}

async function pdfFirstPageToPng(dataUrl: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const uint8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);

  const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 }); // 2× for legibility
  const canvas = document.createElement('canvas');
  canvas.width  = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: canvas.getContext('2d')!, canvas, viewport }).promise;

  return canvas.toDataURL('image/png').split(',')[1];
}

export default function ImageUpload({ onImageReady, onTextReady }: Props) {
  const [mode,         setMode]         = useState<'choice' | 'text' | 'image'>('choice');
  const [text,         setText]         = useState('');
  const [dragOver,     setDragOver]     = useState(false);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [isPdf,        setIsPdf]        = useState(false);
  const [pdfName,      setPdfName]      = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type === 'application/pdf') {
      setIsPdf(true);
      setPdfName(file.name);
      setIsConverting(true);
      setPreview('pdf');

      const reader = new FileReader();
      reader.onload = async e => {
        const dataUrl = e.target?.result as string;
        try {
          const pngBase64 = await pdfFirstPageToPng(dataUrl);
          setIsConverting(false);
          onImageReady(pngBase64, 'image/png');
        } catch (err) {
          console.error('PDF conversion failed:', err);
          setIsConverting(false);
          // Fallback: send raw PDF data
          onImageReady(dataUrl.split(',')[1], 'application/pdf');
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setIsPdf(false);
        setPreview(result);
        onImageReady(result.split(',')[1], file.type);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/') || file?.type === 'application/pdf') handleFile(file);
  }

  const card = 'rounded-2xl p-4 bg-white border border-plum-100 shadow-sm';

  /* ── Choice ─────────────────────────────────────────────────────────── */
  if (mode === 'choice') {
    return (
      <div className={card}>
        <p className="font-sans text-[13px] font-semibold text-stone-600 mb-3">
          Comment souhaitez-vous partager la copie ?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('image')}
            className="
              flex flex-col items-center gap-2.5 p-4 rounded-xl
              border-2 border-plum-200 bg-plum-50/40
              hover:border-plum-400 hover:bg-plum-50
              active:scale-[0.98] transition-all duration-150
            "
          >
            <div className="w-10 h-10 rounded-full bg-plum-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-plum-600" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-sans font-semibold text-stone-700">Photo / Scan</p>
              <p className="text-[11px] font-sans text-stone-400 mt-0.5">JPG, PNG, PDF…</p>
            </div>
          </button>

          <button
            onClick={() => setMode('text')}
            className="
              flex flex-col items-center gap-2.5 p-4 rounded-xl
              border-2 border-plum-200 bg-plum-50/40
              hover:border-plum-400 hover:bg-plum-50
              active:scale-[0.98] transition-all duration-150
            "
          >
            <div className="w-10 h-10 rounded-full bg-plum-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-plum-600" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-sans font-semibold text-stone-700">Coller le texte</p>
              <p className="text-[11px] font-sans text-stone-400 mt-0.5">Copier-coller direct</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  /* ── Text paste ──────────────────────────────────────────────────────── */
  if (mode === 'text') {
    return (
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans text-[13px] font-semibold text-stone-700">
            Collez le texte de la copie
          </p>
          <button
            onClick={() => setMode('choice')}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Collez ici le texte de la copie de l'élève…"
          className="
            w-full h-40 p-3
            font-sans text-[14px] text-stone-800 placeholder-stone-400
            border border-plum-200 rounded-xl resize-none
            bg-parchment-50
            focus:outline-none focus:ring-2 focus:ring-plum-200 focus:border-plum-400
            transition-all duration-150
          "
        />
        <button
          onClick={() => { if (text.trim()) onTextReady(text.trim()); }}
          disabled={!text.trim()}
          className="
            mt-3 w-full py-2.5 rounded-xl
            font-sans text-[14px] font-semibold text-white
            bg-plum-600 hover:bg-plum-700 active:scale-[0.99]
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-sm hover:shadow transition-all duration-150
          "
        >
          Lancer la correction →
        </button>
      </div>
    );
  }

  /* ── Image upload ────────────────────────────────────────────────────── */
  if (mode === 'image') {

    /* After file picked — show preview / converting state */
    if (preview) {
      return (
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans text-[13px] font-semibold text-sage-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Fichier chargé
            </p>
            {!isConverting && (
              <button
                onClick={() => { setPreview(null); setIsPdf(false); setPdfName(''); }}
                className="font-sans text-[12px] text-stone-400 hover:text-stone-600 transition-colors"
              >
                Changer
              </button>
            )}
          </div>

          {isPdf ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-plum-50 border border-plum-100">
              {isConverting
                ? <Loader2 className="w-5 h-5 text-plum-500 shrink-0 animate-spin" />
                : <File className="w-5 h-5 text-plum-500 shrink-0" />
              }
              <div>
                <p className="font-sans text-[13px] text-stone-700 truncate">{pdfName}</p>
                {isConverting && (
                  <p className="font-sans text-[11px] text-plum-400 mt-0.5">
                    Conversion en image…
                  </p>
                )}
              </div>
            </div>
          ) : (
            <img
              src={preview}
              alt="Copie de l'élève"
              className="w-full max-h-52 object-contain rounded-xl border border-plum-100"
            />
          )}

          {!isConverting && (
            <p className="font-sans text-[12px] text-stone-500 mt-2.5 text-center italic">
              Correction en cours…
            </p>
          )}
        </div>
      );
    }

    return (
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans text-[13px] font-semibold text-stone-700">
            Importez une photo ou un scan
          </p>
          <button
            onClick={() => setMode('choice')}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`
            rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            border-2 border-dashed
            ${dragOver
              ? 'border-amber-500 bg-amber-50'
              : 'border-plum-300 bg-plum-50/30 hover:border-plum-500 hover:bg-plum-50'}
          `}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div
            className={`
              w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center transition-colors
              ${dragOver ? 'bg-amber-100' : 'bg-plum-100'}
            `}
          >
            <Upload className={`w-5 h-5 ${dragOver ? 'text-amber-600' : 'text-plum-500'}`} />
          </div>
          <p className="font-sans text-[14px] font-medium text-stone-600">
            {dragOver ? 'Déposez ici' : 'Glissez une image ici'}
          </p>
          <p className="font-sans text-[12px] text-stone-400 mt-1">
            ou <span className="text-plum-600 underline underline-offset-2">cliquez pour parcourir</span>
          </p>
          <p className="font-sans text-[11px] text-stone-300 mt-2">JPG · PNG · HEIC · PDF</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      </div>
    );
  }

  return null;
}
