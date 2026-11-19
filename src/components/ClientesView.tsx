import React, { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ClienteCadastro, OrdemServico } from '../types/os';
import { calcularTotalOS, formatarMoeda } from '../utils/formatters';

interface ClientesViewProps {
  ordens: OrdemServico[];
  clientesCadastrados: ClienteCadastro[];
  isAdmin: boolean;
  usuarioNome: string;
  onFiltrarPorCliente: (nomeCliente: string) => void;
  onNovaOSParaCliente: (cliente: {
    cliente: string;
    telefone: string;
    endereco?: string;
  }) => void;
  onOpenMap: (cliente: string, endereco: string) => void;
  onSalvarCliente: (dados: Omit<ClienteCadastro, 'id'> & { id?: string }) => void;
  onExcluirCliente: (id: string) => void;
}

interface ClienteResumo {
  id: string | null;
  nome: string;
  telefone: string;
  endereco: string;
  totalOrdens: number;
  abertas: number;
  valorTotal: number;
  cadastrado: boolean;
  criadoPor?: string;
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  ordens,
  clientesCadastrados,
  isAdmin,
  usuarioNome,
  onFiltrarPorCliente,
  onNovaOSParaCliente,
  onOpenMap,
  onSalvarCliente,
  onExcluirCliente,
}) => {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeInput, setNomeInput] = useState('');
  const [enderecoInput, setEnderecoInput] = useState('');
  const [telefoneInput, setTelefoneInput] = useState('');
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');

  const clientes = useMemo<ClienteResumo[]>(() => {
    const statsMap = new Map<
      string,
      { totalOrdens: number; abertas: number; valorTotal: number; telefone: string; endereco: string; nome: string }
    >();

    for (const os of ordens) {
      const chave = os.cliente.trim().toLowerCase();
      if (!chave) continue;

      const totalOs = calcularTotalOS(os);
      const existente = statsMap.get(chave);
      if (!existente) {
        statsMap.set(chave, {
          nome: os.cliente,
          telefone: os.telefone || '',
          endereco: os.endereco || '',
          totalOrdens: 1,
          abertas: os.status !== 'Concluída' ? 1 : 0,
          valorTotal: totalOs,
        });
      } else {
        existente.totalOrdens += 1;
        if (os.status !== 'Concluída') existente.abertas += 1;
        existente.valorTotal += totalOs;
        if (!existente.telefone && os.telefone) existente.telefone = os.telefone;
        if (!existente.endereco && os.endereco) existente.endereco = os.endereco;
      }
    }

    const resultado: ClienteResumo[] = [];
    const chavesIncluidas = new Set<string>();

    for (const cad of clientesCadastrados) {
      const chave = cad.nome.trim().toLowerCase();
      if (!chave) continue;
      chavesIncluidas.add(chave);
      const stats = statsMap.get(chave);
      resultado.push({
        id: cad.id,
        nome: cad.nome,
        endereco: cad.endereco,
        telefone: cad.telefone || stats?.telefone || '',
        totalOrdens: stats?.totalOrdens || 0,
        abertas: stats?.abertas || 0,
        valorTotal: stats?.valorTotal || 0,
        cadastrado: true,
        criadoPor: cad.criadoPor,
      });
    }

    for (const [chave, stats] of statsMap.entries()) {
      if (chavesIncluidas.has(chave)) continue;
      resultado.push({
        id: null,
        nome: stats.nome,
        endereco: stats.endereco,
        telefone: stats.telefone,
        totalOrdens: stats.totalOrdens,
        abertas: stats.abertas,
        valorTotal: stats.valorTotal,
        cadastrado: false,
      });
    }

    const termo = buscaCliente.trim().toLowerCase();
    return resultado
      .filter(
        (c) =>
          !termo ||
          c.nome.toLowerCase().includes(termo) ||
          c.endereco.toLowerCase().includes(termo)
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [ordens, clientesCadastrados, buscaCliente]);

  const abrirNovoCliente = () => {
    setEditandoId(null);
    setNomeInput('');
    setEnderecoInput('');
    setTelefoneInput('');
    setConfirmandoId(null);
    setFormAberto(true);
  };

  const abrirEditarCliente = (c: ClienteResumo) => {
    setEditandoId(c.id);
    setNomeInput(c.nome);
    setEnderecoInput(c.endereco);
    setTelefoneInput(c.telefone || '');
    setConfirmandoId(null);
    setFormAberto(true);
  };

  const fecharForm = () => {
    setFormAberto(false);
    setEditandoId(null);
    setNomeInput('');
    setEnderecoInput('');
    setTelefoneInput('');
  };

  const handleSubmitCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeInput.trim() || !enderecoInput.trim()) return;

    onSalvarCliente({
      id: editandoId || undefined,
      nome: nomeInput.trim(),
      endereco: enderecoInput.trim(),
      telefone: telefoneInput.trim(),
    });
    fecharForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Pré-cadastro de Clientes e Condomínios
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'Gerencie clientes e endereços pré-cadastrados para preenchimento automático nas O.S.'
              : 'Clientes e endereços pré-cadastrados pelo administrador (somente leitura).'}
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovoCliente}
          className="min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm inline-flex items-center justify-center gap-2 transition-colors shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {isAdmin && formAberto && (
        <form
          onSubmit={handleSubmitCliente}
          className="bg-[#111827] border border-blue-500/40 rounded-2xl p-5 space-y-4 shadow-lg"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">
              {editandoId ? 'Editar Cliente Pré-cadastrado' : 'Cadastrar Novo Cliente'}
            </h3>
            <button
              type="button"
              onClick={fecharForm}
              aria-label="Fechar formulário de cliente"
              className="min-h-[36px] min-w-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 inline-flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="cad-cliente-nome"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Cliente / Condomínio *
              </label>
              <input
                id="cad-cliente-nome"
                type="text"
                required
                value={nomeInput}
                onChange={(e) => setNomeInput(e.target.value)}
                placeholder="Ex: Condomínio Residencial Alvorada"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="cad-cliente-endereco"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Endereço / Local do atendimento *
              </label>
              <input
                id="cad-cliente-endereco"
                type="text"
                required
                value={enderecoInput}
                onChange={(e) => setEnderecoInput(e.target.value)}
                placeholder="Ex: SQN 308, Bloco B — Brasília/DF"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="cad-cliente-telefone"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Telefone / WhatsApp (opcional)
              </label>
              <input
                id="cad-cliente-telefone"
                type="tel"
                value={telefoneInput}
                onChange={(e) => setTelefoneInput(e.target.value)}
                placeholder="(61) 99999-0000"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#0b1120] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={fecharForm}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>{editandoId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search
          className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={buscaCliente}
          onChange={(e) => setBuscaCliente(e.target.value)}
          placeholder="Buscar cliente ou endereço cadastrado..."
          aria-label="Buscar cliente ou endereço cadastrado"
          className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#111827] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {clientes.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
          {buscaCliente.trim()
            ? 'Nenhum cliente encontrado para esta busca.'
            : 'Nenhum cliente pré-cadastrado ainda.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => {
            const emConfirmacao = c.id !== null && confirmandoId === c.id;
            return (
              <div
                key={c.id || c.nome}
                className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Building2
                        className="w-4 h-4 text-blue-400 shrink-0"
                        aria-hidden="true"
                      />
                      <h3 className="text-base font-semibold text-white truncate">
                        {c.nome}
                      </h3>
                    </div>

                    {(() => {
                      const podeGerenciar =
                        isAdmin ||
                        Boolean(c.criadoPor && usuarioNome && c.criadoPor === usuarioNome) ||
                        (!c.criadoPor && Boolean(c.id) && !['cli-1', 'cli-2', 'cli-3', 'cli-4', 'cli-5'].includes(c.id || ''));
                      return podeGerenciar ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => abrirEditarCliente(c)}
                            title={c.cadastrado ? 'Editar cliente' : 'Adicionar ao pré-cadastro'}
                            aria-label={`Editar ${c.nome}`}
                            className="min-h-[32px] min-w-[32px] rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 hover:text-white inline-flex items-center justify-center transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          {c.id && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmandoId((prev) => (prev === c.id ? null : c.id))
                              }
                              title="Remover do pré-cadastro"
                              aria-label={`Remover ${c.nome}`}
                              className="min-h-[32px] min-w-[32px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 inline-flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {emConfirmacao && c.id && (
                    <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-between gap-2 text-xs">
                      <span className="text-red-200">Remover do pré-cadastro?</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmandoId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                        >
                          Não
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (c.id) onExcluirCliente(c.id);
                            setConfirmandoId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold"
                        >
                          Sim
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 space-y-1">
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                        <span>{c.telefone || 'Telefone não informado'}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate">
                        {c.endereco || 'Endereço não informado'}
                      </p>
                      {c.endereco && (
                        <button
                          type="button"
                          onClick={() => onOpenMap(c.nome, c.endereco)}
                          title="Abrir localização no Google Maps"
                          aria-label={`Abrir localização de ${c.nome} no Google Maps`}
                          className="min-h-[32px] min-w-[32px] rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 inline-flex items-center justify-center shrink-0 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono tabular-nums">
                    {c.totalOrdens} O.S. ·{' '}
                    {c.abertas > 0 ? `${c.abertas} em aberto` : c.totalOrdens > 0 ? 'Tudo concluído' : 'Sem O.S.'}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-white text-sm">
                    {formatarMoeda(c.valorTotal)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onFiltrarPorCliente(c.nome)}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Search className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ver O.S.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNovaOSParaCliente({
                        cliente: c.nome,
                        telefone: c.telefone,
                        endereco: c.endereco,
                      })
                    }
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Nova O.S.</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
