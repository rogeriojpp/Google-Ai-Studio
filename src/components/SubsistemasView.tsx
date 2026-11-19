import React from 'react';
import {
  ArrowRight,
  Camera,
  Cpu,
  DoorClosed,
  PhoneCall,
  Radio,
  Shield,
  ShieldAlert,
  Wrench,
  Zap,
} from 'lucide-react';
import { OrdemServico, SUBSISTEMAS_LISTA, SubsistemaOS } from '../types/os';
import { calcularTotalOS, formatarMoeda } from '../utils/formatters';

interface SubsistemasViewProps {
  ordens: OrdemServico[];
  onSelecionarSubsistema: (sub: SubsistemaOS) => void;
}

const getSubsistemaIcon = (sub: SubsistemaOS) => {
  switch (sub) {
    case 'Segurança Eletrônica':
      return <Shield className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'CFTV (Câmeras / DVR)':
      return <Camera className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'Controle de Acesso':
      return <Cpu className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'Automatizador de Portão':
      return <DoorClosed className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'Alarme / Cerca Elétrica':
      return <ShieldAlert className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'Interfonia / Intelbras':
      return <PhoneCall className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'Antena coletiva':
      return <Radio className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'Outros':
      return <Wrench className="w-4 h-4 text-blue-400" aria-hidden="true" />;
    case 'Elétrica':
      return <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />;
  }
};

export const SubsistemasView: React.FC<SubsistemasViewProps> = ({
  ordens,
  onSelecionarSubsistema,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">
          Selecionar sistemas
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Selecione um sistema abaixo para visualizar os atendimentos e faturamento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {SUBSISTEMAS_LISTA.map((sub) => {
          const doSub = ordens.filter((o) => o.subsistema === sub);
          const abertas = doSub.filter((o) => o.status === 'Aberta').length;
          const andamento = doSub.filter((o) => o.status === 'Em Andamento').length;
          const concluidas = doSub.filter((o) => o.status === 'Concluída').length;
          const receitaConcluida = doSub
            .filter((o) => o.status === 'Concluída')
            .reduce((acc, o) => acc + calcularTotalOS(o), 0);

          return (
            <button
              key={sub}
              type="button"
              onClick={() => onSelecionarSubsistema(sub)}
              className="text-left bg-[#111827] hover:bg-[#161f33] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-colors flex flex-col justify-between gap-3.5 focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    {getSubsistemaIcon(sub)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] sm:text-sm font-semibold text-white truncate">
                      {sub}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                      {doSub.length} {doSub.length === 1 ? 'ordem registrada' : 'ordens registradas'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-1" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="block text-[10px] text-slate-400">Abertas</span>
                  <span className="font-mono tabular-nums font-bold text-amber-400 text-sm">
                    {abertas}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Andamento</span>
                  <span className="font-mono tabular-nums font-bold text-blue-400 text-sm">
                    {andamento}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Concluídas</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-400 text-sm">
                    {concluidas}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Faturamento concluído</span>
                <span className="font-mono tabular-nums font-bold text-white text-xs sm:text-[13px]">
                  {formatarMoeda(receitaConcluida)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
