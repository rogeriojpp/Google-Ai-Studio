import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Table2,
  X,
} from 'lucide-react';
import { ClientesView } from './components/ClientesView';
import { CustomerMapModal } from './components/CustomerMapModal';
import { LoginView } from './components/LoginView';
import { LogoModal } from './components/LogoModal';
import { OSModal } from './components/OSModal';
import { OSPrintView } from './components/OSPrintView';
import { StatusIndicator } from './components/StatusIndicator';
import { SubsistemasView } from './components/SubsistemasView';
import {
  CLIENTES_INICIAIS,
  CLIENTES_KEY,
  ClienteCadastro,
  DADOS_INICIAIS,
  LOGO_KEY,
  OrdemServico,
  STATUS_LISTA,
  STORAGE_KEY,
  SUBSISTEMAS_LISTA,
  StatusOS,
  SubsistemaOS,
  USER_KEY,
  UsuarioAtivo,
} from './types/os';
import {
  calcularTotalOS,
  formatarMoeda,
  gerarProximoIdOS,
  normalizarListaOS,
} from './utils/formatters';

type AbaAtiva = 'ordens' | 'subsistemas' | 'clientes';
type ModoVisualizacao = 'cards' | 'tabela';

export default function App() {
  const [usuario, setUsuario] = useState<UsuarioAtivo | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as Partial<UsuarioAtivo>;
      if (
        parsed &&
        typeof parsed.nome === 'string' &&
        (parsed.perfil === 'Técnico' || parsed.perfil === 'Administrador')
      ) {
        return { nome: parsed.nome, perfil: parsed.perfil };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [ordens, setOrdens] = useState<OrdemServico[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = normalizarListaOS(JSON.parse(saved));
        if (parsed.length > 0) return parsed;
      }
    } catch {
      // fallback para dados iniciais
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DADOS_INICIAIS));
    return DADOS_INICIAIS;
  });

  const [clientesCadastrados, setClientesCadastrados] = useState<ClienteCadastro[]>(() => {
    try {
      const saved = localStorage.getItem(CLIENTES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (c): c is ClienteCadastro =>
                Boolean(c && typeof c.id === 'string' && typeof c.nome === 'string')
            )
            .map((c) => ({
              id: c.id,
              nome: c.nome,
              endereco: typeof c.endereco === 'string' ? c.endereco : '',
              telefone: typeof c.telefone === 'string' ? c.telefone : '',
            }));
        }
      }
    } catch {
      // fallback para clientes iniciais
    }
    localStorage.setItem(CLIENTES_KEY, JSON.stringify(CLIENTES_INICIAIS));
    return CLIENTES_INICIAIS;
  });

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('ordens');
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>('cards');
  const [filtroStatus, setFiltroStatus] = useState<'Todas' | StatusOS>('Todas');
  const [filtroSubsistema, setFiltroSubsistema] = useState<'Todos' | SubsistemaOS>('Todos');
  const [busca, setBusca] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [osEmEdicao, setOsEmEdicao] = useState<OrdemServico | null>(null);
  const [clientePrefill, setClientePrefill] = useState<{
    cliente: string;
    telefone: string;
    endereco?: string;
  } | null>(null);

  const [osParaImprimir, setOsParaImprimir] = useState<OrdemServico | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOGO_KEY);
    } catch {
      return null;
    }
  });
  const [logoModalAberto, setLogoModalAberto] = useState(false);
  const [mapaAlvo, setMapaAlvo] = useState<{
    cliente: string;
    endereco: string;
  } | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const listaSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setMapsQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens));
  }, [ordens]);

  useEffect(() => {
    localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesCadastrados));
  }, [clientesCadastrados]);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const notificar = (msg: string) => {
    setToastMsg(msg);
  };

  const abrirListaPorCard = (statusAlvo: StatusOS) => {
    setFiltroStatus(statusAlvo);
    setFiltroSubsistema('Todos');
    setBusca('');
    requestAnimationFrame(() => {
      listaSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleLogin = (user: UsuarioAtivo) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUsuario(user);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY);
    setUsuario(null);
    setModalAberto(false);
    setLogoModalAberto(false);
  };

  const handleSalvarLogo = (novaLogo: string | null) => {
    if (usuario?.perfil !== 'Administrador') return;
    try {
      if (novaLogo) {
        localStorage.setItem(LOGO_KEY, novaLogo);
      } else {
        localStorage.removeItem(LOGO_KEY);
      }
      setLogoUrl(novaLogo);
      setLogoModalAberto(false);
      notificar(
        novaLogo
          ? 'Logomarca atualizada com sucesso.'
          : 'Logomarca restaurada para o ícone padrão.'
      );
    } catch {
      notificar('Imagem muito grande para salvar no navegador.');
    }
  };

  const abrirNovaOS = (prefill?: {
    cliente: string;
    telefone: string;
    endereco?: string;
  }) => {
    setOsEmEdicao(null);
    setClientePrefill(prefill ?? null);
    setModalAberto(true);
  };

  const abrirEditarOS = (os: OrdemServico) => {
    setClientePrefill(null);
    setOsEmEdicao(os);
    setModalAberto(true);
  };

  const handleSalvarCliente = (
    dados: Omit<ClienteCadastro, 'id' | 'criadoPor'> & { id?: string }
  ) => {
    const isAdminUser = usuario?.perfil === 'Administrador';
    const nomeLimpo = dados.nome.trim();
    const enderecoLimpo = dados.endereco.trim();
    const telefoneLimpo = (dados.telefone || '').trim();
    if (!nomeLimpo || !enderecoLimpo) return;

    if (dados.id) {
      const existente = clientesCadastrados.find((c) => c.id === dados.id);
      const isCriador =
        Boolean(existente?.criadoPor && usuario?.nome && existente.criadoPor === usuario.nome);
      if (!isAdminUser && !isCriador) {
        notificar('Apenas o administrador ou quem criou o cliente pode editá-lo.');
        return;
      }

      setClientesCadastrados((prev) =>
        prev.map((c) =>
          c.id === dados.id
            ? {
                ...c,
                nome: nomeLimpo,
                endereco: enderecoLimpo,
                telefone: telefoneLimpo,
              }
            : c
        )
      );
      notificar(`Cliente "${nomeLimpo}" atualizado.`);
      return;
    }

    const existente = clientesCadastrados.find(
      (c) => c.nome.trim().toLowerCase() === nomeLimpo.toLowerCase()
    );
    if (existente) {
      const isCriador =
        Boolean(existente.criadoPor && usuario?.nome && existente.criadoPor === usuario.nome);
      if (!isAdminUser && !isCriador) {
        notificar('Apenas o administrador ou quem criou o cliente pode editá-lo.');
        return;
      }

      setClientesCadastrados((prev) =>
        prev.map((c) =>
          c.id === existente.id
            ? {
                ...c,
                nome: nomeLimpo,
                endereco: enderecoLimpo,
                telefone: telefoneLimpo,
              }
            : c
        )
      );
      notificar(`Cliente "${nomeLimpo}" atualizado no pré-cadastro.`);
      return;
    }

    const novoCliente: ClienteCadastro = {
      id: `cli-${Date.now()}`,
      nome: nomeLimpo,
      endereco: enderecoLimpo,
      telefone: telefoneLimpo,
      criadoPor: usuario?.nome || 'Sistema',
    };
    setClientesCadastrados((prev) => [...prev, novoCliente]);
    notificar(`Cliente "${nomeLimpo}" pré-cadastrado com sucesso.`);
  };

  const handleExcluirCliente = (id: string) => {
    const clienteAlvo = clientesCadastrados.find((c) => c.id === id);
    const isAdminUser = usuario?.perfil === 'Administrador';
    const isCriador =
      Boolean(clienteAlvo?.criadoPor && usuario?.nome && clienteAlvo.criadoPor === usuario.nome) ||
      (!clienteAlvo?.criadoPor && Boolean(clienteAlvo?.id) && !['cli-1', 'cli-2', 'cli-3', 'cli-4', 'cli-5'].includes(clienteAlvo?.id || ''));
    if (!isAdminUser && !isCriador) {
      notificar('Apenas o administrador ou quem criou o cliente pode excluí-lo.');
      return;
    }
    setClientesCadastrados((prev) => prev.filter((c) => c.id !== id));
    notificar(`Cliente "${clienteAlvo?.nome || ''}" removido do pré-cadastro.`);
  };

  const handleSalvarOS = (
    dados: Omit<OrdemServico, 'id' | 'data'> & { id?: string }
  ) => {
    const podeEditarCamposAdmin = usuario?.perfil === 'Administrador';
    if (dados.id) {
      setOrdens((prev) =>
        prev.map((item) =>
          item.id === dados.id
            ? {
                ...item,
                ...dados,
                id: item.id,
                cliente: podeEditarCamposAdmin ? dados.cliente : item.cliente,
                endereco: podeEditarCamposAdmin ? dados.endereco : item.endereco,
                telefone: podeEditarCamposAdmin ? dados.telefone : item.telefone,
                tecnico: podeEditarCamposAdmin
                  ? dados.tecnico
                  : item.tecnico || usuario?.nome || dados.tecnico,
              }
            : item
        )
      );
      notificar(`${dados.id} atualizada com sucesso.`);
    } else {
      let clienteFinal = dados.cliente;
      let enderecoFinal = dados.endereco;
      let telefoneFinal = dados.telefone;

      if (!podeEditarCamposAdmin) {
        const cadastrado = clientesCadastrados.find(
          (c) =>
            c.nome.trim().toLowerCase() === dados.cliente.trim().toLowerCase()
        );
        if (!cadastrado) {
          notificar('Selecione um cliente pré-cadastrado pelo administrador.');
          return;
        }
        clienteFinal = cadastrado.nome;
        enderecoFinal = cadastrado.endereco;
        telefoneFinal = cadastrado.telefone || '';
      }

      const novoId = gerarProximoIdOS(ordens);
      const hoje = new Date().toLocaleDateString('pt-BR');
      const novaOS: OrdemServico = {
        ...dados,
        cliente: clienteFinal,
        endereco: enderecoFinal,
        telefone: telefoneFinal,
        tecnico: podeEditarCamposAdmin
          ? dados.tecnico
          : usuario?.nome || dados.tecnico,
        id: novoId,
        data: hoje,
      };
      setOrdens((prev) => [novaOS, ...prev]);
      notificar(`${novoId} criada com sucesso.`);
    }
    setModalAberto(false);
  };

  const handleExcluirOS = (id: string) => {
    setOrdens((prev) => prev.filter((item) => item.id !== id));
    setModalAberto(false);
    notificar(`Ordem ${id} excluída.`);
  };

  const handleImprimirOS = (os: OrdemServico) => {
    setOsParaImprimir(os);
  };

  const estatisticas = useMemo(() => {
    let abertas = 0;
    let andamento = 0;
    let concluidas = 0;
    let faturamento = 0;

    for (const os of ordens) {
      const total = calcularTotalOS(os);
      if (os.status === 'Aberta') abertas += 1;
      else if (os.status === 'Em Andamento') andamento += 1;
      else if (os.status === 'Concluída') {
        concluidas += 1;
        faturamento += total;
      }
    }

    return { abertas, andamento, concluidas, faturamento };
  }, [ordens]);

  const isAdmin = usuario?.perfil === 'Administrador';

  const ordensFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return ordens.filter((os) => {
      const matchStatus =
        filtroStatus === 'Todas' || os.status === filtroStatus;
      const matchSub =
        filtroSubsistema === 'Todos' || os.subsistema === filtroSubsistema;
      const matchTexto =
        !termo ||
        os.cliente.toLowerCase().includes(termo) ||
        os.id.toLowerCase().includes(termo) ||
        os.subsistema.toLowerCase().includes(termo) ||
        os.descricao.toLowerCase().includes(termo) ||
        os.tecnico.toLowerCase().includes(termo) ||
        (os.endereco && os.endereco.toLowerCase().includes(termo)) ||
        (isAdmin && os.telefone && os.telefone.toLowerCase().includes(termo));

      return matchStatus && matchSub && matchTexto;
    });
  }, [ordens, filtroStatus, filtroSubsistema, busca, isAdmin]);

  const abrirMapa = (clienteNome: string, enderecoLocal: string) => {
    if (!enderecoLocal.trim()) {
      notificar('Informe o endereço do cliente para abrir o mapa.');
      return;
    }
    setMapaAlvo({ cliente: clienteNome, endereco: enderecoLocal });
  };

  const quotaBanner = mapsQuotaExceeded ? (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm print:hidden">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
    </div>
  ) : null;

  if (!usuario) {
    return (
      <>
        {quotaBanner}
        <LoginView logoUrl={logoUrl} onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      {quotaBanner}
      <div className="min-h-screen bg-[#0b1120] text-slate-50 print:hidden">
        <header className="sticky top-0 z-30 h-14 bg-[#111827]/95 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-8">
            <div className="flex items-center gap-2.5 min-w-0">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setLogoModalAberto(true)}
                  title="Alterar logomarca da empresa"
                  aria-label="Alterar logomarca da empresa"
                  className="relative w-9 h-9 rounded-lg bg-[#0b1120] border border-slate-700 hover:border-blue-500 flex items-center justify-center overflow-hidden shrink-0 transition-colors group focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logomarca da empresa"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <ShieldCheck
                      className="w-5 h-5 text-blue-400"
                      aria-hidden="true"
                    />
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-tl-md bg-blue-600 text-white flex items-center justify-center shadow">
                    <Pencil className="w-2.5 h-2.5" aria-hidden="true" />
                  </span>
                </button>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#0b1120] border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logomarca da empresa"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <ShieldCheck
                      className="w-5 h-5 text-blue-400"
                      aria-hidden="true"
                    />
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setAbaAtiva('ordens')}
                className="text-sm sm:text-lg font-bold tracking-tight text-white truncate text-left focus-visible:outline-2 focus-visible:outline-blue-500 rounded"
              >
                Segurança no Preço Certo
              </button>
            </div>

            <nav
              aria-label="Navegação principal"
              className="hidden md:flex items-center gap-6 text-sm font-medium"
            >
              <button
                type="button"
                onClick={() => setAbaAtiva('ordens')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  abaAtiva === 'ordens'
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-100'
                }`}
              >
                Ordens de Serviço
              </button>
              <button
                type="button"
                onClick={() => setAbaAtiva('subsistemas')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  abaAtiva === 'subsistemas'
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-100'
                }`}
              >
                Subsistemas
              </button>
              <button
                type="button"
                onClick={() => setAbaAtiva('clientes')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  abaAtiva === 'clientes'
                    ? 'text-white border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-100'
                }`}
              >
                Clientes
              </button>
            </nav>

            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
                Gestão de Ordens de Serviço
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Operador: <span className="text-slate-200 font-medium">{usuario.nome}</span>
                <span aria-hidden="true"> · </span>
                <span>{usuario.perfil}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => abrirNovaOS()}
              className="min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Nova Ordem de Serviço</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#111827] border border-slate-800 rounded-xl md:hidden">
            <button
              type="button"
              onClick={() => setAbaAtiva('ordens')}
              className={`min-h-[40px] px-2 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                abaAtiva === 'ordens'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ordens
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('subsistemas')}
              className={`min-h-[40px] px-2 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                abaAtiva === 'subsistemas'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Subsistemas
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('clientes')}
              className={`min-h-[40px] px-2 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                abaAtiva === 'clientes'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Clientes
            </button>
          </div>

          {abaAtiva === 'ordens' && (
            <>
              <section
                aria-label="Resumo operacional"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
              >
                <button
                  type="button"
                  onClick={() => abrirListaPorCard('Aberta')}
                  aria-pressed={filtroStatus === 'Aberta'}
                  className={`group text-left rounded-xl p-4 border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    filtroStatus === 'Aberta'
                      ? 'bg-amber-500/10 border-amber-500/60'
                      : 'bg-[#111827] border-slate-800 hover:bg-[#161f33] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      Abertas
                    </span>
                    <ChevronRight
                      className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1 block">
                    {estatisticas.abertas}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => abrirListaPorCard('Em Andamento')}
                  aria-pressed={filtroStatus === 'Em Andamento'}
                  className={`group text-left rounded-xl p-3.5 sm:p-4 border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    filtroStatus === 'Em Andamento'
                      ? 'bg-blue-500/10 border-blue-500/60'
                      : 'bg-[#111827] border-slate-800 hover:bg-[#161f33] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      Em Andamento
                    </span>
                    <ChevronRight
                      className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-blue-400 mt-1 block">
                    {estatisticas.andamento}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => abrirListaPorCard('Concluída')}
                  aria-pressed={filtroStatus === 'Concluída'}
                  className={`group text-left rounded-xl p-3.5 sm:p-4 border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    filtroStatus === 'Concluída'
                      ? 'bg-emerald-500/10 border-emerald-500/60'
                      : 'bg-[#111827] border-slate-800 hover:bg-[#161f33] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      Concluídas
                    </span>
                    <ChevronRight
                      className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1 block">
                    {estatisticas.concluidas}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => abrirListaPorCard('Concluída')}
                  aria-pressed={filtroStatus === 'Concluída'}
                  className={`group text-left rounded-xl p-3.5 sm:p-4 border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    filtroStatus === 'Concluída'
                      ? 'bg-emerald-500/10 border-emerald-500/60'
                      : 'bg-[#111827] border-slate-800 hover:bg-[#161f33] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-400 truncate">
                      Faturamento Concluído
                    </span>
                    <ChevronRight
                      className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white mt-1 block truncate">
                    {formatarMoeda(estatisticas.faturamento)}
                  </span>
                </button>
              </section>

              <section aria-label="Filtros e busca" className="space-y-3">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder={
                        isAdmin
                          ? 'Buscar por cliente, código OS, telefone, técnico ou equipamento...'
                          : 'Buscar por cliente, endereço, código OS, técnico ou equipamento...'
                      }
                      aria-label="Buscar ordens de serviço"
                      className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {busca && (
                      <button
                        type="button"
                        onClick={() => setBusca('')}
                        aria-label="Limpar busca"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <select
                      value={filtroSubsistema}
                      onChange={(e) =>
                        setFiltroSubsistema(
                          e.target.value as 'Todos' | SubsistemaOS
                        )
                      }
                      aria-label="Filtrar por subsistema"
                      className="min-h-[44px] px-3.5 py-2 bg-[#111827] border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 flex-1 sm:flex-initial"
                    >
                      <option value="Todos">Todos os subsistemas</option>
                      {SUBSISTEMAS_LISTA.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>

                    <div className="hidden md:flex items-center p-1 bg-[#111827] border border-slate-800 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setModoVisualizacao('cards')}
                        aria-label="Visualização em cartões"
                        title="Cartões"
                        className={`min-h-[36px] min-w-[36px] px-2.5 rounded-lg inline-flex items-center justify-center transition-colors ${
                          modoVisualizacao === 'cards'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoVisualizacao('tabela')}
                        aria-label="Visualização em tabela"
                        title="Tabela"
                        className={`min-h-[36px] min-w-[36px] px-2.5 rounded-lg inline-flex items-center justify-center transition-colors ${
                          modoVisualizacao === 'tabela'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Table2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {(['Todas', ...STATUS_LISTA] as const).map((statusOpcao) => {
                    const ativo = filtroStatus === statusOpcao;
                    return (
                      <button
                        key={statusOpcao}
                        type="button"
                        onClick={() => setFiltroStatus(statusOpcao)}
                        className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
                          ativo
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-[#111827] border-slate-800 text-slate-300 hover:bg-[#1e293b]'
                        }`}
                      >
                        {statusOpcao}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div ref={listaSectionRef} className="scroll-mt-20 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="font-mono tabular-nums">
                    {ordensFiltradas.length}{' '}
                    {ordensFiltradas.length === 1
                      ? 'documento encontrado'
                      : 'documentos encontrados'}
                    {filtroStatus !== 'Todas' ? ` · ${filtroStatus}` : ''}
                  </span>
                  {(filtroStatus !== 'Todas' ||
                    filtroSubsistema !== 'Todos' ||
                    busca) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroStatus('Todas');
                        setFiltroSubsistema('Todos');
                        setBusca('');
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold whitespace-nowrap"
                    >
                      Mostrar todas
                    </button>
                  )}
                </div>

              {ordensFiltradas.length === 0 ? (
                <div className="bg-[#111827] border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                  <ClipboardList
                    className="w-8 h-8 text-slate-500 mx-auto"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Nenhuma Ordem de Serviço encontrada
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Ajuste os filtros de busca ou registre um novo atendimento.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    {(busca ||
                      filtroStatus !== 'Todas' ||
                      filtroSubsistema !== 'Todos') && (
                      <button
                        type="button"
                        onClick={() => {
                          setBusca('');
                          setFiltroStatus('Todas');
                          setFiltroSubsistema('Todos');
                        }}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Limpar filtros
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => abrirNovaOS()}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      Criar primeira O.S.
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {modoVisualizacao === 'tabela' && (
                    <div className="hidden md:block bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-xs font-medium text-slate-400">
                              <th className="py-3 px-4">Código</th>
                              <th className="py-3 px-4">Data</th>
                              <th className="py-3 px-4">Cliente / Condomínio</th>
                              <th className="py-3 px-4">Subsistema</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Valor Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-sm">
                            {ordensFiltradas.map((os) => {
                              const total = calcularTotalOS(os);
                              return (
                                <tr
                                  key={os.id}
                                  onClick={() => abrirEditarOS(os)}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      abrirEditarOS(os);
                                    }
                                  }}
                                  className="hover:bg-[#1e293b]/60 cursor-pointer transition-colors"
                                >
                                  <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-400 whitespace-nowrap">
                                    {os.id}
                                  </td>
                                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-400 whitespace-nowrap">
                                    {os.data}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-white">
                                      {os.cliente}
                                    </div>
                                    <div className="text-xs text-slate-400 truncate max-w-xs">
                                      {os.descricao}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                                    {os.subsistema}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <StatusIndicator status={os.status} />
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-white whitespace-nowrap">
                                    {formatarMoeda(total)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${
                      modoVisualizacao === 'tabela' ? 'md:hidden' : ''
                    }`}
                  >
                    {ordensFiltradas.map((os) => {
                      const total = calcularTotalOS(os);
                      return (
                        <article
                          key={os.id}
                          onClick={() => abrirEditarOS(os)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              abrirEditarOS(os);
                            }
                          }}
                          className="bg-[#111827] hover:bg-[#161f33] border border-slate-800 rounded-xl p-3.5 sm:p-4 transition-colors cursor-pointer flex flex-col justify-between gap-2.5 focus-visible:outline-2 focus-visible:outline-blue-500"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 min-w-0">
                                <span className="font-mono font-semibold text-blue-400">
                                  {os.id}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {os.data}
                                </span>
                              </div>
                              <StatusIndicator status={os.status} />
                            </div>

                            <div>
                              <h2 className="text-sm font-bold text-white leading-snug">
                                {os.cliente}
                              </h2>
                              <p className="text-[11px] font-medium text-slate-300 mt-0.5">
                                {os.subsistema}
                              </p>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {os.descricao}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                            <div className="text-slate-400 truncate min-w-0">
                              <span>
                                {isAdmin
                                  ? os.telefone || 'Sem telefone'
                                  : os.endereco || os.tecnico}
                              </span>
                              {os.assinatura && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span className="text-emerald-400 font-medium">
                                    Assinada
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {os.endereco && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirMapa(os.cliente, os.endereco || '');
                                  }}
                                  title="Abrir localização no Google Maps"
                                  aria-label={`Abrir localização de ${os.cliente} no Google Maps`}
                                  className="min-h-[30px] min-w-[30px] rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 inline-flex items-center justify-center transition-colors"
                                >
                                  <MapPin className="w-3 h-3" aria-hidden="true" />
                                </button>
                              )}
                              <span className="text-xs sm:text-[13px] font-bold font-mono tabular-nums text-white whitespace-nowrap">
                                {formatarMoeda(total)}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
              </div>
            </>
          )}

          {abaAtiva === 'subsistemas' && (
            <SubsistemasView
              ordens={ordens}
              onSelecionarSubsistema={(sub) => {
                setFiltroSubsistema(sub);
                setFiltroStatus('Todas');
                setAbaAtiva('ordens');
              }}
            />
          )}

          {abaAtiva === 'clientes' && (
            <ClientesView
              ordens={ordens}
              clientesCadastrados={clientesCadastrados}
              isAdmin={isAdmin}
              usuarioNome={usuario.nome}
              onFiltrarPorCliente={(nomeCliente) => {
                setBusca(nomeCliente);
                setFiltroStatus('Todas');
                setFiltroSubsistema('Todos');
                setAbaAtiva('ordens');
              }}
              onNovaOSParaCliente={(prefill) => abrirNovaOS(prefill)}
              onOpenMap={abrirMapa}
              onSalvarCliente={handleSalvarCliente}
              onExcluirCliente={handleExcluirCliente}
            />
          )}
        </main>
      </div>

      <OSModal
        isOpen={modalAberto}
        isAdmin={isAdmin}
        usuarioNome={usuario.nome}
        osInicial={osEmEdicao}
        tecnicoPadrao={usuario.nome}
        clientesCadastrados={clientesCadastrados}
        clientePrefill={clientePrefill}
        onClose={() => setModalAberto(false)}
        onSave={handleSalvarOS}
        onDelete={handleExcluirOS}
        onPrint={handleImprimirOS}
        onNotify={notificar}
        onOpenMap={abrirMapa}
        onSalvarCliente={handleSalvarCliente}
        onExcluirCliente={handleExcluirCliente}
      />

      <CustomerMapModal
        isOpen={Boolean(mapaAlvo)}
        cliente={mapaAlvo?.cliente || ''}
        endereco={mapaAlvo?.endereco || ''}
        onClose={() => setMapaAlvo(null)}
      />

      <OSPrintView
        os={osParaImprimir}
        logoUrl={logoUrl}
        isAdmin={isAdmin}
        onClose={() => setOsParaImprimir(null)}
        onNotify={notificar}
      />

      {isAdmin && logoModalAberto && (
        <LogoModal
          isOpen={logoModalAberto}
          logoAtual={logoUrl}
          onClose={() => setLogoModalAberto(false)}
          onSave={handleSalvarLogo}
        />
      )}

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold shadow-xl flex items-center gap-2 whitespace-nowrap print:hidden"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
