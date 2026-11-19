import React, { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  Lock,
  MapPin,
  Plus,
  Printer,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import {
  ClienteCadastro,
  ItemOS,
  OrdemServico,
  STATUS_LISTA,
  SUBSISTEMAS_LISTA,
  StatusOS,
  SubsistemaOS,
} from '../types/os';
import {
  calcularSubtotalItem,
  calcularTotalOS,
  formatarMoeda,
  gerarResumoWhatsApp,
} from '../utils/formatters';
import { SignaturePad } from './SignaturePad';

interface OSModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  usuarioNome?: string;
  osInicial: OrdemServico | null;
  tecnicoPadrao: string;
  clientesCadastrados: ClienteCadastro[];
  clientePrefill?: { cliente: string; telefone: string; endereco?: string } | null;
  onClose: () => void;
  onSave: (dados: Omit<OrdemServico, 'id' | 'data'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onPrint: (os: OrdemServico) => void;
  onNotify: (msg: string) => void;
  onOpenMap: (cliente: string, endereco: string) => void;
  onSalvarCliente?: (dados: Omit<ClienteCadastro, 'id'> & { id?: string }) => void;
  onExcluirCliente?: (id: string) => void;
}

export const OSModal: React.FC<OSModalProps> = ({
  isOpen,
  isAdmin,
  usuarioNome,
  osInicial,
  tecnicoPadrao,
  clientesCadastrados,
  clientePrefill,
  onClose,
  onSave,
  onDelete,
  onPrint,
  onNotify,
  onOpenMap,
  onSalvarCliente,
  onExcluirCliente,
}) => {
  const [status, setStatus] = useState<StatusOS>('Aberta');
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [subsistema, setSubsistema] = useState<SubsistemaOS | ''>('');
  const [tecnico, setTecnico] = useState(tecnicoPadrao);
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [modalGerenciarClientes, setModalGerenciarClientes] = useState(false);
  const [buscaGerenciarClientes, setBuscaGerenciarClientes] = useState('');
  const [confirmandoExclusaoClienteId, setConfirmandoExclusaoClienteId] = useState<string | null>(null);
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteEndereco, setNovoClienteEndereco] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [valoresTexto, setValoresTexto] = useState<Record<string, string>>({});

  const formatarDecimalBR = (num: number): string => {
    if (!num || num <= 0) return '';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseDecimalBR = (raw: string): number => {
    const limpo = raw.replace(/[^\d.,]/g, '');
    if (!limpo) return 0;
    const normalizado = limpo.includes(',')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo;
    const parsed = parseFloat(normalizado);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  useEffect(() => {
    if (!isOpen) return;
    setConfirmandoExclusao(false);

    if (osInicial) {
      setStatus(osInicial.status);
      setCliente(osInicial.cliente);
      setTelefone(osInicial.telefone || '');
      setEndereco(osInicial.endereco || '');
      setSubsistema(osInicial.subsistema);
      setTecnico(osInicial.tecnico || tecnicoPadrao);
      setDescricao(osInicial.descricao);
      setObservacoes(osInicial.observacoes || '');
      const itensCarregados =
        osInicial.itens.length > 0
          ? osInicial.itens.map((it) => ({ ...it }))
          : [];
      setItens(itensCarregados);
      const mapaValores: Record<string, string> = {};
      for (const it of itensCarregados) {
        mapaValores[it.id] = formatarDecimalBR(it.valor);
      }
      setValoresTexto(mapaValores);
      setAssinatura(osInicial.assinatura || null);
    } else {
      const idInicial = `it-${Date.now()}`;
      const prefillEncontrado = clientePrefill?.cliente
        ? clientesCadastrados.find(
            (c) =>
              c.nome.trim().toLowerCase() ===
              clientePrefill.cliente.trim().toLowerCase()
          )
        : undefined;
      setStatus('Aberta');
      setCliente(prefillEncontrado?.nome || clientePrefill?.cliente || '');
      setTelefone(prefillEncontrado?.telefone || clientePrefill?.telefone || '');
      setEndereco(prefillEncontrado?.endereco || clientePrefill?.endereco || '');
      setSubsistema('');
      setTecnico(tecnicoPadrao);
      setDescricao('');
      setObservacoes('');
      setItens([
        {
          id: idInicial,
          desc: 'Visita Técnica / Avaliação',
          qtd: 1,
          valor: 120,
        },
      ]);
      setValoresTexto({ [idInicial]: formatarDecimalBR(120) });
      setAssinatura(null);
    }
  }, [isOpen, osInicial, tecnicoPadrao, clientePrefill, clientesCadastrados]);

  if (!isOpen) return null;

  const clientesOrdenados = [...clientesCadastrados].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR')
  );

  const handleSelecionarCliente = (nomeSelecionado: string) => {
    const encontrado = clientesOrdenados.find((c) => c.nome === nomeSelecionado);
    if (encontrado) {
      setCliente(encontrado.nome);
      setEndereco(encontrado.endereco);
      setTelefone(encontrado.telefone || '');
    } else if (!isAdmin) {
      setCliente('');
      setEndereco('');
      setTelefone('');
    }
  };

  const SEED_CLIENTE_IDS = ['cli-1', 'cli-2', 'cli-3', 'cli-4', 'cli-5'];

  const podeExcluirCliente = (c: ClienteCadastro): boolean => {
    if (!onExcluirCliente) return false;
    if (isAdmin) return true;
    if (c.criadoPor && usuarioNome && c.criadoPor.toLowerCase() === usuarioNome.toLowerCase()) return true;
    if (!c.criadoPor && Boolean(c.id) && !SEED_CLIENTE_IDS.includes(c.id)) return true;
    return false;
  };

  const clienteCadastradoAtual = clientesOrdenados.find(
    (c) => c.nome.trim().toLowerCase() === cliente.trim().toLowerCase()
  );

  const handleExcluirClienteDaLista = (c: ClienteCadastro) => {
    if (!onExcluirCliente) return;
    onExcluirCliente(c.id);
    if (cliente.trim().toLowerCase() === c.nome.trim().toLowerCase()) {
      setCliente('');
      setEndereco('');
      setTelefone('');
    }
    setConfirmandoExclusaoClienteId(null);
  };

  const abrirCadastroNovoCliente = () => {
    setNovoClienteNome('');
    setNovoClienteEndereco('');
    setNovoClienteTelefone('');
    setModalNovoCliente(true);
  };

  const fecharCadastroNovoCliente = () => {
    setModalNovoCliente(false);
    setNovoClienteNome('');
    setNovoClienteEndereco('');
    setNovoClienteTelefone('');
  };

  const handleSalvarNovoClienteModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoClienteNome.trim()) {
      onNotify('Informe o nome do cliente.');
      return;
    }
    if (!novoClienteEndereco.trim()) {
      onNotify('Informe o endereço do cliente.');
      return;
    }
    onSalvarCliente?.({
      nome: novoClienteNome.trim(),
      endereco: novoClienteEndereco.trim(),
      telefone: novoClienteTelefone.trim(),
      criadoPor: usuarioNome || tecnico || 'Técnico',
    });
    setCliente(novoClienteNome.trim());
    setEndereco(novoClienteEndereco.trim());
    setTelefone(novoClienteTelefone.trim());
    fecharCadastroNovoCliente();
    onNotify(`Cliente "${novoClienteNome.trim()}" cadastrado com sucesso.`);
  };

  const totalOS = calcularTotalOS({ itens });

  const adicionarItem = () => {
    const novoId = `it-${Date.now()}-${itens.length}`;
    setItens((prev) => [
      ...prev,
      { id: novoId, desc: '', qtd: 1, valor: 0 },
    ]);
    setValoresTexto((prev) => ({ ...prev, [novoId]: '' }));
  };

  const removerItem = (id: string) => {
    setItens((prev) => prev.filter((it) => it.id !== id));
    setValoresTexto((prev) => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });
  };

  const atualizarItem = (
    id: string,
    campo: 'desc' | 'qtd' | 'valor',
    valorBruto: string
  ) => {
    if (campo === 'valor') {
      const filtrado = valorBruto.replace(/[^\d.,]/g, '');
      setValoresTexto((prev) => ({ ...prev, [id]: filtrado }));
      const numerico = parseDecimalBR(filtrado);
      setItens((prev) =>
        prev.map((it) => (it.id === id ? { ...it, valor: numerico } : it))
      );
      return;
    }

    setItens((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (campo === 'desc') return { ...it, desc: valorBruto };
        const parsed = parseInt(valorBruto, 10);
        return { ...it, qtd: Number.isNaN(parsed) || parsed < 1 ? 1 : parsed };
      })
    );
  };

  const finalizarEdicaoValor = (id: string, valorAtual: number) => {
    setValoresTexto((prev) => ({
      ...prev,
      [id]: formatarDecimalBR(valorAtual),
    }));
  };

  const tecnicoFinal = isAdmin
    ? tecnico.trim() || tecnicoPadrao
    : osInicial?.tecnico || tecnicoPadrao;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim()) {
      onNotify('Selecione um cliente cadastrado.');
      return;
    }
    if (!subsistema) {
      onNotify('Selecione equipamentos / subsistema.');
      return;
    }
    const itensValidos = itens.filter(
      (i) => i.desc.trim() !== '' || i.valor > 0
    );

    onSave({
      id: osInicial?.id,
      cliente: isAdmin || !osInicial ? cliente.trim() : osInicial.cliente,
      telefone: isAdmin ? telefone.trim() : osInicial?.telefone || telefone.trim(),
      endereco: isAdmin || !osInicial ? endereco.trim() : osInicial.endereco || '',
      subsistema,
      tecnico: tecnicoFinal,
      descricao: descricao.trim(),
      observacoes: observacoes.trim(),
      status,
      itens: itensValidos,
      assinatura,
    });
  };

  const buildSnapshot = (): OrdemServico => ({
    id: osInicial?.id || 'OS-RASCUNHO',
    data: osInicial?.data || new Date().toLocaleDateString('pt-BR'),
    cliente: cliente.trim() || 'Cliente',
    telefone: telefone.trim(),
    endereco: endereco.trim(),
    subsistema: (subsistema as SubsistemaOS) || SUBSISTEMAS_LISTA[0],
    tecnico: tecnicoFinal,
    descricao: descricao.trim(),
    observacoes: observacoes.trim(),
    status,
    itens,
    assinatura,
  });

  const handleCopiarWhatsApp = async () => {
    const texto = gerarResumoWhatsApp(buildSnapshot());
    try {
      await navigator.clipboard.writeText(texto);
      onNotify('Resumo da O.S. copiado para o WhatsApp.');
    } catch {
      onNotify('Não foi possível copiar automaticamente.');
    }
  };

  const handleImprimir = () => {
    onPrint(buildSnapshot());
  };

  const getStatusIcon = (s: StatusOS) => {
    if (s === 'Concluída') return <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />;
    if (s === 'Em Andamento') return <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />;
    return <Clock3 className="w-4 h-4 shrink-0" aria-hidden="true" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0b1120] sm:bg-black/75 sm:backdrop-blur-sm overflow-y-auto print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="os-modal-title"
    >
      <div className="min-h-full sm:py-8 sm:px-4 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-[#0b1120] sm:bg-[#111827] sm:border sm:border-slate-800 sm:rounded-2xl overflow-hidden">
          <div className="sticky top-0 z-20 bg-[#111827]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] inline-flex items-center gap-1.5 text-slate-300 hover:text-white pr-3 rounded-lg text-sm font-medium whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              <span>Voltar</span>
            </button>

            <h2
              id="os-modal-title"
              className="text-sm sm:text-base font-bold text-white truncate"
            >
              {osInicial ? `Ordem de Serviço ${osInicial.id}` : 'Nova Ordem de Serviço'}
            </h2>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopiarWhatsApp}
                title="Copiar resumo para WhatsApp"
                aria-label="Copiar resumo para WhatsApp"
                className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-200 border border-slate-700 inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
              >
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span className="hidden md:inline">Copiar</span>
              </button>

              <button
                type="button"
                onClick={handleImprimir}
                title="Imprimir ou salvar PDF"
                aria-label="Imprimir ou salvar PDF"
                className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-200 border border-slate-700 inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                <span className="hidden md:inline">Imprimir</span>
              </button>

              {osInicial && (
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao((v) => !v)}
                  title="Excluir Ordem de Serviço"
                  aria-label="Excluir Ordem de Serviço"
                  className="min-h-[40px] min-w-[40px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 inline-flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {confirmandoExclusao && osInicial && (
            <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl bg-red-950/60 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-red-200">
                Excluir permanentemente a <span className="font-mono font-semibold">{osInicial.id}</span>?
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(false)}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(osInicial.id)}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                >
                  Confirmar exclusão
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 pb-28 sm:pb-6">
            <div>
              <span className="block text-xs font-semibold text-slate-400 mb-2">
                Status do atendimento
              </span>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_LISTA.map((itemStatus) => {
                  const active = status === itemStatus;
                  let activeClass = 'bg-amber-500/15 border-amber-500 text-amber-300';
                  if (itemStatus === 'Em Andamento') {
                    activeClass = 'bg-blue-600/20 border-blue-500 text-blue-300';
                  } else if (itemStatus === 'Concluída') {
                    activeClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-300';
                  }

                  return (
                    <button
                      key={itemStatus}
                      type="button"
                      onClick={() => setStatus(itemStatus)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        active
                          ? activeClass
                          : 'bg-[#0b1120] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {getStatusIcon(itemStatus)}
                      <span>{itemStatus}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">
                Dados do cliente e equipamento
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="os-cliente"
                      className="block text-xs font-medium text-slate-300"
                    >
                      Cliente / Condomínio *
                    </label>
                    <div className="flex items-center gap-2">
                      {onSalvarCliente && !osInicial && (
                        <button
                          type="button"
                          onClick={abrirCadastroNovoCliente}
                          className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-semibold transition-colors"
                          title="Cadastrar novo cliente"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Cadastrar</span>
                        </button>
                      )}
                      {onExcluirCliente && clientesOrdenados.length > 0 && !osInicial && (
                        <button
                          type="button"
                          onClick={() => {
                            setBuscaGerenciarClientes('');
                            setConfirmandoExclusaoClienteId(null);
                            setModalGerenciarClientes(true);
                          }}
                          className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 font-semibold transition-colors"
                          title="Excluir clientes desta lista um a um"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Excluir da lista</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isAdmin ? (
                    <select
                      id="os-cliente"
                      required
                      value={
                        clientesOrdenados.some((c) => c.nome === cliente)
                          ? cliente
                          : ''
                      }
                      onChange={(e) => {
                        if (e.target.value === '__cadastrar__') {
                          abrirCadastroNovoCliente();
                          return;
                        }
                        if (e.target.value) {
                          handleSelecionarCliente(e.target.value);
                        } else {
                          handleSelecionarCliente('');
                        }
                      }}
                      aria-label="Selecionar ou cadastrar novos clientes"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">
                        Selecionar ou cadastrar novos clientes
                      </option>
                      {clientesOrdenados.map((c) => (
                        <option key={c.id} value={c.nome}>
                          {c.nome}
                        </option>
                      ))}
                      <option value="__cadastrar__">
                        Cadastrar novos clientes
                      </option>
                    </select>
                  ) : osInicial ? (
                    <div className="relative">
                      <input
                        id="os-cliente"
                        type="text"
                        value={cliente}
                        disabled
                        readOnly
                        title="Somente o administrador pode alterar o cliente"
                        className="w-full min-h-[44px] pl-3.5 pr-10 py-2.5 bg-[#0b1120]/70 border border-slate-800 rounded-xl text-slate-300 text-sm cursor-not-allowed select-none opacity-90"
                      />
                      <Lock
                        className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                  ) : (
                    <select
                      id="os-cliente"
                      required
                      value={cliente}
                      onChange={(e) => {
                        if (e.target.value === '__cadastrar__') {
                          abrirCadastroNovoCliente();
                          return;
                        }
                        handleSelecionarCliente(e.target.value);
                      }}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecionar ou cadastrar novos clientes</option>
                      {clientesOrdenados.map((c) => (
                        <option key={c.id} value={c.nome}>
                          {c.nome}
                        </option>
                      ))}
                      <option value="__cadastrar__">Cadastrar novos clientes</option>
                    </select>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="os-endereco"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Endereço / Local do atendimento
                  </label>
                  <div className="flex items-stretch gap-2">
                    <div className="relative flex-1 min-w-0">
                      <input
                        id="os-endereco"
                        type="text"
                        value={endereco}
                        onChange={(e) => {
                          if (isAdmin) setEndereco(e.target.value);
                        }}
                        disabled={!isAdmin}
                        readOnly={!isAdmin}
                        title={
                          isAdmin
                            ? 'Endereço do atendimento'
                            : 'Campo preenchido pelo pré-cadastro — alteração restrita ao administrador'
                        }
                        placeholder={
                          isAdmin
                            ? 'Quadra, bloco, sala ou bairro'
                            : 'Preenchido automaticamente ao escolher o cliente'
                        }
                        className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-sm placeholder-slate-500 ${
                          isAdmin
                            ? 'text-white focus:outline-none focus:border-blue-500'
                            : 'pr-10 text-slate-300 bg-[#0b1120]/70 cursor-not-allowed select-none opacity-90'
                        }`}
                      />
                      {!isAdmin && (
                        <Lock
                          className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!endereco.trim()) {
                          onNotify('Selecione um cliente com endereço para abrir o mapa.');
                          return;
                        }
                        onOpenMap(cliente.trim(), endereco.trim());
                      }}
                      title={
                        endereco.trim()
                          ? 'Abrir localização e rota no Google Maps'
                          : 'Selecione o cliente para abrir o mapa'
                      }
                      aria-label="Abrir localização no Google Maps"
                      className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 ${
                        endereco.trim()
                          ? 'bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border-blue-500/35'
                          : 'bg-[#0b1120] text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="hidden sm:inline text-xs font-semibold">Mapa</span>
                    </button>
                  </div>
                  {!isAdmin && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {osInicial
                        ? 'Cliente e endereço bloqueados — somente o administrador pode alterar.'
                        : 'Endereço preenchido pelo pré-cadastro. Somente o administrador pode alterar.'}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div>
                    <label
                      htmlFor="os-telefone"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Telefone / WhatsApp
                    </label>
                    <input
                      id="os-telefone"
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(61) 99999-0000"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="os-subsistema"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Subsistema *
                  </label>
                  <select
                    id="os-subsistema"
                    required
                    value={subsistema}
                    onChange={(e) => setSubsistema(e.target.value as SubsistemaOS)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Selecione equipamentos
                    </option>
                    {SUBSISTEMAS_LISTA.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={isAdmin ? 'sm:col-span-2' : ''}>
                  <label
                    htmlFor="os-tecnico"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Técnico responsável
                  </label>
                  <div className="relative">
                    <input
                      id="os-tecnico"
                      type="text"
                      value={isAdmin ? tecnico : tecnicoFinal}
                      onChange={(e) => {
                        if (isAdmin) setTecnico(e.target.value);
                      }}
                      disabled={!isAdmin}
                      readOnly={!isAdmin}
                      placeholder="Nome do técnico"
                      title={
                        isAdmin
                          ? 'Técnico responsável pela O.S.'
                          : 'Campo bloqueado por segurança e responsabilidade técnica'
                      }
                      className={`w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-sm placeholder-slate-500 ${
                        isAdmin
                          ? 'text-white focus:outline-none focus:border-blue-500'
                          : 'pr-10 text-slate-300 bg-[#0b1120]/70 cursor-not-allowed select-none opacity-90'
                      }`}
                    />
                    {!isAdmin && (
                      <Lock
                        className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  {!isAdmin && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Bloqueado para alteração por segurança e responsabilidade técnica.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="os-descricao"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Defeito relatado / Serviço executado *
                  </label>
                  <textarea
                    id="os-descricao"
                    rows={3}
                    required
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o problema encontrado, testes realizados ou equipamentos instalados..."
                    className="w-full px-3.5 py-3 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="os-obs"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Observações e garantia (opcional)
                  </label>
                  <input
                    id="os-obs"
                    type="text"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: Garantia de 90 dias sobre a mão de obra e peça substituída"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-200">
                  Peças, equipamentos e mão de obra
                </h3>
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Adicionar item</span>
                </button>
              </div>

              {itens.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded-xl">
                  Nenhum item ou peça adicionado. Clique em Adicionar item para lançar valores.
                </p>
              ) : (
                <div className="space-y-3">
                  {itens.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 items-center pb-3 border-b border-slate-800/60 last:border-b-0 last:pb-0"
                    >
                      <div className="col-span-12 sm:col-span-6 relative">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none select-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono tabular-nums font-semibold text-slate-400"
                        >
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) =>
                            atualizarItem(item.id, 'desc', e.target.value)
                          }
                          placeholder="Peça ou serviço (ex: Câmera Intelbras VHD)"
                          aria-label={`Descrição do item ${index + 1}`}
                          className={`w-full min-h-[44px] ${
                            index + 1 >= 10 ? 'pl-10' : 'pl-8'
                          } pr-3 py-2 bg-[#0b1120] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500`}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 relative">
                        <input
                          type="number"
                          min={1}
                          value={item.qtd}
                          onChange={(e) =>
                            atualizarItem(item.id, 'qtd', e.target.value)
                          }
                          aria-label={`Quantidade do item ${index + 1} em unidades`}
                          title="Quantidade (Un)"
                          className="w-full min-h-[44px] pl-3 pr-8 py-2 bg-[#0b1120] border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono tabular-nums text-center focus:outline-none focus:border-blue-500"
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none select-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400"
                        >
                          Un
                        </span>
                      </div>
                      <div className="col-span-6 sm:col-span-3 relative">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none select-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400"
                        >
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={
                            valoresTexto[item.id] !== undefined
                              ? valoresTexto[item.id]
                              : formatarDecimalBR(item.valor)
                          }
                          onChange={(e) =>
                            atualizarItem(item.id, 'valor', e.target.value)
                          }
                          onBlur={() => finalizarEdicaoValor(item.id, item.valor)}
                          placeholder="0,00"
                          aria-label={`Valor unitário do item ${index + 1} em reais`}
                          className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-[#0b1120] border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono tabular-nums placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removerItem(item.id)}
                          aria-label={`Remover item ${index + 1}`}
                          className="min-h-[44px] min-w-[44px] rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 inline-flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                      {item.qtd > 1 && (
                        <div className="col-span-12 text-right text-[11px] text-slate-400 font-mono tabular-nums -mt-1 pr-1">
                          Subtotal ({item.qtd}x): {formatarMoeda(calcularSubtotalItem(item))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">
                  Valor total da O.S.
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
                  {formatarMoeda(totalOS)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <SignaturePad
                initialSignature={assinatura}
                onChange={setAssinatura}
              />
            </div>

            <div className="fixed sm:static bottom-0 left-0 right-0 bg-[#111827]/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t border-slate-800 p-4 sm:p-0 sm:pt-4 z-30">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 sm:w-auto min-h-[46px] px-5 py-3 bg-[#1e293b] hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 sm:flex-1 min-h-[46px] px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Salvar Ordem de Serviço</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Gerenciar / Excluir Clientes da Lista */}
      {modalGerenciarClientes && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-gerenciar-clientes-title"
        >
          <div className="w-full max-w-lg bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header Clean & Profissional */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#111827]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3
                      id="modal-gerenciar-clientes-title"
                      className="text-sm sm:text-base font-semibold text-white tracking-tight"
                    >
                      Clientes Cadastrados
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Selecione para preencher a O.S. ou exclua clientes da lista
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalGerenciarClientes(false);
                    setConfirmandoExclusaoClienteId(null);
                  }}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Busca integrada */}
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={buscaGerenciarClientes}
                  onChange={(e) => setBuscaGerenciarClientes(e.target.value)}
                  placeholder="Buscar por nome ou endereço..."
                  className="w-full h-10 pl-9 pr-8 bg-[#0b1120] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {buscaGerenciarClientes && (
                  <button
                    type="button"
                    onClick={() => setBuscaGerenciarClientes('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de clientes limpa e sem redundâncias */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {(() => {
                const termo = buscaGerenciarClientes.trim().toLowerCase();
                const filtrados = clientesOrdenados.filter(
                  (c) =>
                    !termo ||
                    c.nome.toLowerCase().includes(termo) ||
                    c.endereco.toLowerCase().includes(termo)
                );

                if (filtrados.length === 0) {
                  return (
                    <div className="py-8 text-center text-xs sm:text-sm text-slate-400">
                      {termo
                        ? 'Nenhum cliente encontrado para este filtro.'
                        : 'Nenhum cliente cadastrado na lista.'}
                    </div>
                  );
                }

                return filtrados.map((c) => {
                  const podeExcluir = podeExcluirCliente(c);
                  const emConfirmacao = confirmandoExclusaoClienteId === c.id;
                  const isAtual =
                    cliente.trim().toLowerCase() === c.nome.trim().toLowerCase();

                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        isAtual
                          ? 'bg-blue-950/20 border-blue-500/40'
                          : 'bg-[#0b1120] border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div
                          onClick={() => {
                            if (!isAtual) {
                              handleSelecionarCliente(c.nome);
                              setModalGerenciarClientes(false);
                            }
                          }}
                          className={`min-w-0 flex-1 ${!isAtual ? 'cursor-pointer group' : ''}`}
                          title={!isAtual ? 'Clique para selecionar na O.S.' : undefined}
                        >
                          <h4
                            className={`font-semibold text-xs sm:text-sm text-white truncate transition-colors ${
                              !isAtual ? 'group-hover:text-blue-300' : ''
                            }`}
                          >
                            {c.nome}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                            {c.endereco || 'Sem endereço informado'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 mt-1">
                            <span>
                              Por: <span className="text-slate-400">{c.criadoPor || 'Sistema'}</span>
                            </span>
                            {c.telefone && <span>· {c.telefone}</span>}
                          </div>
                        </div>

                        {/* Ações diretas e limpas: sem redundância entre Selecionado e Selecionar */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAtual ? (
                            <span className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Selecionado</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelecionarCliente(c.nome);
                                setModalGerenciarClientes(false);
                              }}
                              className="h-8 px-3 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/25 text-xs font-semibold transition-colors"
                              title="Selecionar este cliente para a O.S."
                            >
                              Selecionar
                            </button>
                          )}

                          {podeExcluir ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmandoExclusaoClienteId((prev) =>
                                  prev === c.id ? null : c.id
                                )
                              }
                              className={`w-8 h-8 rounded-lg border inline-flex items-center justify-center transition-colors ${
                                emConfirmacao
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                              }`}
                              title={`Excluir "${c.nome}"`}
                              aria-label={`Excluir ${c.nome}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          ) : (
                            <span
                              className="h-8 px-2 rounded-lg bg-slate-800/40 text-slate-500 text-[10px] inline-flex items-center"
                              title="Apenas quem criou ou o Administrador pode excluir este cliente"
                            >
                              Protegido
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Confirmação de exclusão moderna e compacta */}
                      {emConfirmacao && (
                        <div className="mt-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <p className="text-xs text-red-200">
                            Excluir <strong className="text-white">"{c.nome}"</strong> da lista?
                          </p>
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setConfirmandoExclusaoClienteId(null)}
                              className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirClienteDaLista(c)}
                              className="h-7 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-sm"
                            >
                              <Trash2 className="w-3 h-3" aria-hidden="true" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer limpo */}
            <div className="px-4 sm:px-5 py-3 border-t border-slate-800 bg-[#0b1120] flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total na lista: <strong className="text-white font-mono">{clientesOrdenados.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setModalGerenciarClientes(false);
                  setConfirmandoExclusaoClienteId(null);
                }}
                className="h-8 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Novo Cliente com Botão para Salvar */}
      {modalNovoCliente && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-novo-cliente-title"
        >
          <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3
                  id="modal-novo-cliente-title"
                  className="text-base font-bold text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Cadastrar Novo Cliente</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Preencha os dados e clique no botão para salvar o cliente na lista
                </p>
              </div>
              <button
                type="button"
                onClick={fecharCadastroNovoCliente}
                className="min-h-[36px] min-w-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoClienteModal} className="p-4 sm:p-5 space-y-4">
              <div>
                <label
                  htmlFor="novo-cliente-nome"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Nome do Cliente / Condomínio *
                </label>
                <input
                  id="novo-cliente-nome"
                  type="text"
                  required
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  placeholder="Ex: Condomínio Solar das Flores"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="novo-cliente-endereco"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Endereço / Local do atendimento *
                </label>
                <input
                  id="novo-cliente-endereco"
                  type="text"
                  required
                  value={novoClienteEndereco}
                  onChange={(e) => setNovoClienteEndereco(e.target.value)}
                  placeholder="Ex: SQN 308, Bloco B — Brasília/DF"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="novo-cliente-telefone"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Telefone / WhatsApp (opcional)
                </label>
                <input
                  id="novo-cliente-telefone"
                  type="tel"
                  value={novoClienteTelefone}
                  onChange={(e) => setNovoClienteTelefone(e.target.value)}
                  placeholder="(61) 99999-0000"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={fecharCadastroNovoCliente}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Salvar Novo Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
