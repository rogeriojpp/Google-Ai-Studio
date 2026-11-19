import React, { useState } from 'react';
import { Download, Loader2, Printer, ShieldCheck, X } from 'lucide-react';
import { OrdemServico } from '../types/os';
import {
  calcularSubtotalItem,
  calcularTotalOS,
  formatarMoeda,
} from '../utils/formatters';

interface OSPrintViewProps {
  os: OrdemServico | null;
  logoUrl?: string | null;
  isAdmin?: boolean;
  onClose: () => void;
  onNotify?: (msg: string) => void;
}

function getPrintStatusBadge(status: OrdemServico['status']): string {
  if (status === 'Concluída') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (status === 'Em Andamento') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export const OSPrintView: React.FC<OSPrintViewProps> = ({
  os,
  logoUrl,
  isAdmin = true,
  onClose,
  onNotify,
}) => {
  const [gerandoPdf, setGerandoPdf] = useState(false);

  if (!os) return null;
  const total = calcularTotalOS(os);
  const emIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleImprimirNavegador = () => {
    window.print();
    if (emIframe && onNotify) {
      onNotify(
        'Se o navegador bloquear a impressão na janela Preview, toque em Baixar PDF.'
      );
    }
  };

  const handleBaixarPdf = async () => {
    setGerandoPdf(true);
    try {
      const { gerarPdfOS } = await import('../utils/pdfGenerator');
      await gerarPdfOS(os, logoUrl, isAdmin);
      onNotify?.(`PDF ${os.id}.pdf baixado.`);
    } catch {
      onNotify?.('Não foi possível gerar o PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm overflow-y-auto print:static print:bg-white print:overflow-visible print:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="os-print-title"
    >
      <div className="sticky top-0 z-20 bg-[#111827]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 print:hidden">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-0">
            <h2
              id="os-print-title"
              className="text-sm font-bold text-white truncate"
            >
              Comprovante para Impressão · {os.id}
            </h2>
            {emIframe && (
              <p className="text-[11px] text-slate-400">
                No celular ou Preview, use Baixar PDF para salvar ou imprimir.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBaixarPdf}
              disabled={gerandoPdf}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {gerandoPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{gerandoPdf ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleImprimirNavegador}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar visualização de impressão"
              className="min-h-[40px] min-w-[40px] rounded-xl bg-[#1e293b] hover:bg-slate-700 text-slate-300 border border-slate-700 inline-flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 print:p-0">
        <div className="bg-white text-slate-900 max-w-3xl mx-auto rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none">
          <div className="h-2 bg-gradient-to-r from-slate-900 via-blue-800 to-blue-600" />

          <div className="p-5 sm:p-8 print:p-5">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logomarca"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ShieldCheck
                      className="w-7 h-7 text-blue-700"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-700">
                    Ordem de Serviço Técnica
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mt-0.5">
                    Segurança no Preço Certo
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sistemas de Segurança Eletrônica &amp; Manutenção
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                <div className="sm:text-right">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Documento Nº
                  </span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    {os.id}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-slate-600 font-medium whitespace-nowrap">
                    Emissão: <strong className="font-mono text-slate-800">{os.data}</strong>
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPrintStatusBadge(
                      os.status
                    )}`}
                  >
                    {os.status}
                  </span>
                </div>
              </div>
            </header>

            <section className="mb-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Dados do Atendimento
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50/70 border border-slate-200 rounded-xl p-4">
                <div className="sm:col-span-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Cliente / Condomínio
                  </span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {os.cliente}
                  </span>
                </div>
                <div className={isAdmin ? '' : 'sm:col-span-2'}>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Endereço / Local
                  </span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {os.endereco || 'Não informado'}
                  </span>
                </div>
                {isAdmin && (
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Telefone / WhatsApp
                    </span>
                    <span className="font-medium text-slate-800 mt-0.5 block">
                      {os.telefone || 'Não informado'}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Subsistema
                  </span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {os.subsistema}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Técnico Responsável
                  </span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {os.tecnico}
                  </span>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Defeito Relatado e Serviço Executado
              </h2>
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
                <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                  {os.descricao}
                </p>
                {os.observacoes && (
                  <p className="text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-100">
                    <strong className="text-slate-700">Observações técnicas:</strong>{' '}
                    {os.observacoes}
                  </p>
                )}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Discriminação de Peças e Mão de Obra
              </h2>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-600">
                      <th className="p-2.5 border-b border-slate-200 text-center w-10">
                        #
                      </th>
                      <th className="p-2.5 border-b border-slate-200">Descrição</th>
                      <th className="p-2.5 border-b border-slate-200 text-right w-20">
                        Qtd
                      </th>
                      <th className="p-2.5 border-b border-slate-200 text-right w-28">
                        Unitário
                      </th>
                      <th className="p-2.5 border-b border-slate-200 text-right w-28">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {os.itens.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-4 text-center text-xs text-slate-500"
                        >
                          Nenhum item lançado nesta O.S.
                        </td>
                      </tr>
                    ) : (
                      os.itens.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2.5 text-center font-mono tabular-nums text-xs font-semibold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 text-slate-800">{item.desc}</td>
                          <td className="p-2.5 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                            {item.qtd} Un
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                            {formatarMoeda(item.valor)}
                          </td>
                          <td className="p-2.5 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                            {formatarMoeda(calcularSubtotalItem(item))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold">
                      <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-wider">
                        Total da Ordem de Serviço
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-sm whitespace-nowrap">
                        {formatarMoeda(total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <footer className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-6 sm:gap-10 items-start">
              <div>
                <div className="border-b border-slate-400 h-16 flex items-end pb-1.5">
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {os.tecnico}
                  </span>
                </div>
                <span className="block text-[11px] font-medium text-slate-500 mt-1.5">
                  Responsável Técnico
                </span>
              </div>

              <div>
                <div className="border-b border-slate-400 h-16 flex items-center justify-center bg-slate-50 rounded-t pb-1">
                  {os.assinatura ? (
                    <img
                      src={os.assinatura}
                      alt="Assinatura do cliente"
                      className="max-h-14 object-contain brightness-0"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Sem assinatura
                    </span>
                  )}
                </div>
                <span className="block text-[11px] font-medium text-slate-500 mt-1.5">
                  Assinatura do Cliente / Síndico
                </span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
