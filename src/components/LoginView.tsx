import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { PerfilKey, UsuarioAtivo } from '../types/os';

interface LoginViewProps {
  logoUrl?: string | null;
  onLogin: (usuario: UsuarioAtivo) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  logoUrl,
  onLogin,
}) => {
  const [perfil, setPerfil] = useState<PerfilKey>('tecnico');
  const [nome, setNome] = useState('Carlos Técnico');
  const [senha, setSenha] = useState('123456');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const selecionarPerfil = (novoPerfil: PerfilKey) => {
    setPerfil(novoPerfil);
    setErro(null);
    if (novoPerfil === 'tecnico') {
      setNome('Carlos Técnico');
      setSenha('123456');
    } else {
      setNome('Marcos Admin');
      setSenha('admin123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeTrim = nome.trim();
    const senhaTrim = senha.trim();

    if (!nomeTrim || !senhaTrim) {
      setErro('Informe o usuário e a senha para acessar o sistema.');
      return;
    }

    setErro(null);
    const isAdmin =
      perfil === 'admin' || nomeTrim.toLowerCase().includes('admin');
    onLogin({
      nome: nomeTrim,
      perfil: isAdmin ? 'Administrador' : 'Técnico',
    });
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#0b1120]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 mb-4 overflow-hidden p-1.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logomarca da empresa"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            ) : (
              <ShieldCheck className="w-7 h-7" aria-hidden="true" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white text-balance">
            Segurança no Preço Certo
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Gestão de Ordens de Serviço e Atendimento Técnico
          </p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
          <div className="mb-6">
            <span className="block text-xs font-medium text-slate-400 mb-2">
              Acesso rápido por perfil
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0b1120] rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => selecionarPerfil('tecnico')}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                  perfil === 'tecnico'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Técnico</span>
              </button>
              <button
                type="button"
                onClick={() => selecionarPerfil('admin')}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                  perfil === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Administrador</span>
              </button>
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-user"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Operador / Usuário
              </label>
              <input
                id="login-user"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoComplete="username"
                placeholder="Nome do técnico ou administrador"
                className="w-full min-h-[46px] px-4 py-3 bg-[#0b1120] border border-slate-800 rounded-xl text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="login-pass"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Senha de acesso
              </label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="w-full min-h-[46px] pl-4 pr-12 py-3 bg-[#0b1120] border border-slate-800 rounded-xl text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((prev) => !prev)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute inset-y-0 right-0 min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500 rounded-r-xl"
                >
                  {mostrarSenha ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] mt-2 py-3 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            >
              <span>Entrar no sistema</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
