import React from 'react';
import { CheckCircle2, Clock3, Wrench } from 'lucide-react';
import { StatusOS } from '../types/os';

interface StatusIndicatorProps {
  status: StatusOS;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  if (status === 'Concluída') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Concluída</span>
      </span>
    );
  }

  if (status === 'Em Andamento') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 whitespace-nowrap shrink-0">
        <Wrench className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Em Andamento</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 whitespace-nowrap shrink-0">
      <Clock3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Aberta</span>
    </span>
  );
};
