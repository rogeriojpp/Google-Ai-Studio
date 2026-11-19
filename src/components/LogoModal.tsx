import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ImagePlus,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';

interface LogoModalProps {
  isOpen: boolean;
  logoAtual: string | null;
  onClose: () => void;
  onSave: (novaLogo: string | null) => void;
}

export const LogoModal: React.FC<LogoModalProps> = ({
  isOpen,
  logoAtual,
  onClose,
  onSave,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(logoAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  if (!isOpen) return null;

  const processarArquivo = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem válido (PNG, JPG, WebP ou SVG).');
      return;
    }

    setErro(null);
    setProcessando(true);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        setErro('Não foi possível ler o arquivo selecionado.');
        setProcessando(false);
        return;
      }

      if (file.type === 'image/svg+xml' && result.length < 150000) {
        setPreview(result);
        setProcessando(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.naturalWidth || 320;
        let height = img.naturalHeight || 320;

        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setPreview(result);
          setProcessando(false);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const otimizada = canvas.toDataURL('image/png');
        setPreview(otimizada);
        setProcessando(false);
      };

      img.onerror = () => {
        setErro('Arquivo de imagem inválido ou corrompido.');
        setProcessando(false);
      };

      img.src = result;
    };

    reader.onerror = () => {
      setErro('Falha ao carregar a imagem.');
      setProcessando(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processarArquivo(file);
    }
    e.target.value = '';
  };

  const handleSalvar = () => {
    onSave(preview);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logo-modal-title"
    >
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 h-14 border-b border-slate-800 flex items-center justify-between gap-3">
          <h2
            id="logo-modal-title"
            className="text-base font-bold text-white truncate"
          >
            Logomarca da Empresa
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="min-h-[40px] min-w-[40px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 inline-flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs sm:text-sm text-slate-400">
            A logomarca definida aqui será exibida no cabeçalho do sistema, na tela de acesso e nos comprovantes impressos.
          </p>

          <div className="flex flex-col items-center justify-center p-6 bg-[#0b1120] border border-slate-800 rounded-xl gap-3">
            <div className="w-24 h-24 rounded-2xl bg-[#111827] border border-slate-700 flex items-center justify-center overflow-hidden p-2">
              {preview ? (
                <img
                  src={preview}
                  alt="Pré-visualização da logomarca"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ShieldCheck
                  className="w-10 h-10 text-blue-400"
                  aria-hidden="true"
                />
              )}
            </div>
            <span className="text-xs text-slate-400">
              {preview ? 'Logomarca personalizada ativa' : 'Ícone padrão do sistema'}
            </span>
          </div>

          {erro && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <span>{erro}</span>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={processando}
              onClick={() => inputRef.current?.click()}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <ImagePlus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{processando ? 'Processando...' : 'Escolher imagem'}</span>
            </button>

            <button
              type="button"
              disabled={!preview || processando}
              onClick={() => setPreview(null)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Usar ícone padrão</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-800 bg-[#0b1120]/60 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={processando}
            onClick={handleSalvar}
            className="w-2/3 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Salvar logomarca</span>
          </button>
        </div>
      </div>
    </div>
  );
};
