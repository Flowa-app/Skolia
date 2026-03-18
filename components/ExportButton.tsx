'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { CorrectionResult, CorrectionParams } from '@/lib/types';

interface Props {
  result: CorrectionResult;
  params?: Partial<CorrectionParams>;
}

export default function ExportButton({ result, params }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const { exportToPDF } = await import('@/lib/pdfExport');
      await exportToPDF(result, params || {});
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="
        w-full flex items-center justify-center gap-2.5
        py-3 px-4 rounded-xl
        font-sans text-[14px] font-semibold text-white
        bg-stone-800 hover:bg-stone-900 active:scale-[0.99]
        shadow-sm hover:shadow
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150
      "
    >
      <Download className="w-4 h-4" />
      {loading ? 'Génération du PDF…' : 'Exporter en PDF'}
    </button>
  );
}
