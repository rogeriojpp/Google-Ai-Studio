import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as unknown as {gm_authFailure?: () => void}).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true};
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1120] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-[#111827] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <h1 className="text-base font-bold text-white">
              Não foi possível carregar a tela
            </h1>
            <p className="text-xs text-slate-400">
              Ocorreu um erro inesperado na visualização. Toque no botão abaixo para recarregar.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
            >
              Recarregar aplicativo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

