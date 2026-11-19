import { ItemOS, OrdemServico } from '../types/os';

export function formatarMoeda(valor: number): string {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function normalizarItens(itens: unknown): ItemOS[] {
  if (!Array.isArray(itens)) return [];
  return itens.map((raw, idx) => {
    const obj = (raw ?? {}) as Partial<ItemOS>;
    return {
      id: typeof obj.id === 'string' && obj.id ? obj.id : `item-${Date.now()}-${idx}`,
      desc: typeof obj.desc === 'string' ? obj.desc : '',
      qtd: typeof obj.qtd === 'number' && obj.qtd > 0 ? obj.qtd : 1,
      valor: typeof obj.valor === 'number' && !Number.isNaN(obj.valor) ? obj.valor : Number(obj.valor) || 0,
    };
  });
}

export function normalizarListaOS(raw: unknown): OrdemServico[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const os = item as OrdemServico;
    return {
      ...os,
      itens: normalizarItens(os.itens),
      telefone: os.telefone || '',
      endereco: os.endereco || '',
      observacoes: os.observacoes || '',
      assinatura: os.assinatura || null,
    };
  });
}

export function calcularSubtotalItem(item: ItemOS): number {
  return (Number(item.qtd) || 1) * (Number(item.valor) || 0);
}

export function calcularTotalOS(os: Pick<OrdemServico, 'itens'>): number {
  if (!os.itens || !Array.isArray(os.itens)) return 0;
  return os.itens.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
}

export function gerarProximoIdOS(lista: OrdemServico[]): string {
  const anoAtual = new Date().getFullYear();
  let maxNum = 0;
  for (const os of lista) {
    const match = os.id.match(/(\d+)$/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed > maxNum) maxNum = parsed;
    }
  }
  return `OS-${anoAtual}-${String(maxNum + 1).padStart(3, '0')}`;
}

export function gerarResumoWhatsApp(os: OrdemServico): string {
  const total = calcularTotalOS(os);
  const linhasItens =
    os.itens.length > 0
      ? os.itens
          .map(
            (it) =>
              `- ${it.qtd}x ${it.desc || 'Serviço'}: ${formatarMoeda(calcularSubtotalItem(it))}`
          )
          .join('\n')
      : '- Sem itens discriminados';

  return [
    `*Segurança no Preço Certo — ${os.id}*`,
    `Data: ${os.data} | Status: *${os.status}*`,
    `Cliente: ${os.cliente}`,
    os.endereco ? `Local: ${os.endereco}` : null,
    `Subsistema: ${os.subsistema}`,
    `Técnico: ${os.tecnico}`,
    ``,
    `*Serviço / Relato:*`,
    `${os.descricao}`,
    os.observacoes ? `\n*Observações:* ${os.observacoes}` : null,
    ``,
    `*Peças e Serviços:*`,
    linhasItens,
    ``,
    `*Valor Total: ${formatarMoeda(total)}*`,
    os.assinatura ? `Assinatura digital coletada no local.` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');
}
