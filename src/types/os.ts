export type StatusOS = 'Aberta' | 'Em Andamento' | 'Concluída';

export type SubsistemaOS =
  | 'Segurança Eletrônica'
  | 'CFTV (Câmeras / DVR)'
  | 'Controle de Acesso'
  | 'Automatizador de Portão'
  | 'Alarme / Cerca Elétrica'
  | 'Interfonia / Intelbras'
  | 'Antena coletiva'
  | 'Outros'
  | 'Elétrica';

export const SUBSISTEMAS_LISTA: SubsistemaOS[] = [
  'Segurança Eletrônica',
  'CFTV (Câmeras / DVR)',
  'Controle de Acesso',
  'Automatizador de Portão',
  'Alarme / Cerca Elétrica',
  'Interfonia / Intelbras',
  'Antena coletiva',
  'Outros',
  'Elétrica',
];

export const STATUS_LISTA: StatusOS[] = ['Aberta', 'Em Andamento', 'Concluída'];

export interface ItemOS {
  id: string;
  desc: string;
  qtd: number;
  valor: number;
}

export interface OrdemServico {
  id: string;
  data: string;
  cliente: string;
  telefone: string;
  endereco?: string;
  subsistema: SubsistemaOS;
  descricao: string;
  observacoes?: string;
  status: StatusOS;
  tecnico: string;
  itens: ItemOS[];
  assinatura: string | null;
}

export type PerfilKey = 'tecnico' | 'admin';

export interface UsuarioAtivo {
  nome: string;
  perfil: 'Técnico' | 'Administrador';
}

export const STORAGE_KEY = 'spc_ordens_servico_v2';
export const USER_KEY = 'spc_usuario_ativo_v2';
export const LOGO_KEY = 'spc_logo_empresa_v2';
export const CLIENTES_KEY = 'spc_clientes_cadastrados_v2';

export interface ClienteCadastro {
  id: string;
  nome: string;
  endereco: string;
  telefone?: string;
  criadoPor?: string;
}

export const CLIENTES_INICIAIS: ClienteCadastro[] = [
  {
    id: 'cli-1',
    nome: 'Condomínio Residencial Alvorada',
    endereco: 'SQN 308, Bloco B — Brasília/DF',
    telefone: '(61) 98455-1234',
  },
  {
    id: 'cli-2',
    nome: 'Edifício Comercial Horizonte',
    endereco: 'SBS Quadra 02, Lote 14 — Brasília/DF',
    telefone: '(61) 99122-8877',
  },
  {
    id: 'cli-3',
    nome: 'Residência Sr. Roberto Martins',
    endereco: 'SHIS QI 11, Conjunto 04 — Lago Sul/DF',
    telefone: '(61) 98111-4590',
  },
  {
    id: 'cli-4',
    nome: 'Clínica Vida & Saúde Integrada',
    endereco: 'SEPS 709/909, Sala 212 — Asa Sul/DF',
    telefone: '(61) 99834-2109',
  },
  {
    id: 'cli-5',
    nome: 'Condomínio Jardins do Cerrado',
    endereco: 'Rua das Paineiras, Lote 08 — Águas Claras/DF',
    telefone: '(61) 98220-3315',
  },
];

export const DADOS_INICIAIS: OrdemServico[] = [
  {
    id: 'OS-2026-001',
    data: '19/11/2026',
    cliente: 'Condomínio Residencial Alvorada',
    telefone: '(61) 98455-1234',
    endereco: 'SQN 308, Bloco B — Brasília/DF',
    subsistema: 'Interfonia / Intelbras',
    descricao:
      'Configuração de ramais na Central Intelbras CP48 e substituição da placa de tronco com oxidação.',
    observacoes: 'Testado áudio nos apartamentos 101 ao 404 com síndico presente.',
    status: 'Em Andamento',
    tecnico: 'Carlos Técnico',
    itens: [
      { id: 'it-1', desc: 'Placa Tronco Intelbras CP48', qtd: 1, valor: 280.0 },
      { id: 'it-2', desc: 'Mão de Obra Técnica Especializada', qtd: 1, valor: 180.0 },
    ],
    assinatura: null,
  },
  {
    id: 'OS-2026-002',
    data: '18/11/2026',
    cliente: 'Edifício Comercial Horizonte',
    telefone: '(61) 99122-8877',
    endereco: 'SBS Quadra 02, Lote 14 — Brasília/DF',
    subsistema: 'CFTV (Câmeras / DVR)',
    descricao:
      'Câmeras da garagem G1 sem sinal de vídeo. Substituição de fonte colmeia 12V 10A e conectores BNC/P4.',
    observacoes: 'DVR MHDX 3116 gravando normalmente após troca da fonte.',
    status: 'Concluída',
    tecnico: 'Carlos Técnico',
    itens: [
      { id: 'it-3', desc: 'Fonte Colmeia 12V 10A Estabilizada', qtd: 1, valor: 95.0 },
      { id: 'it-4', desc: 'Kit Conectores BNC + P4 Borne', qtd: 4, valor: 12.5 },
      { id: 'it-5', desc: 'Visita Técnica e Reparo CFTV', qtd: 1, valor: 150.0 },
    ],
    assinatura: null,
  },
  {
    id: 'OS-2026-003',
    data: '19/11/2026',
    cliente: 'Residência Sr. Roberto Martins',
    telefone: '(61) 98111-4590',
    endereco: 'SHIS QI 11, Conjunto 04 — Lago Sul/DF',
    subsistema: 'Automatizador de Portão',
    descricao:
      'Portão deslizante PPA travando no fim de curso de abertura. Necessário ajustar ímãs e lubrificar cremalheira.',
    status: 'Aberta',
    tecnico: 'Carlos Técnico',
    itens: [
      { id: 'it-6', desc: 'Sensor Fim de Curso Reed + Par de Ímãs', qtd: 1, valor: 45.0 },
      { id: 'it-7', desc: 'Manutenção Preventiva Motor Deslizante', qtd: 1, valor: 140.0 },
    ],
    assinatura: null,
  },
  {
    id: 'OS-2026-004',
    data: '17/11/2026',
    cliente: 'Clínica Vida & Saúde Integrada',
    telefone: '(61) 99834-2109',
    endereco: 'SEPS 709/909, Sala 212 — Asa Sul/DF',
    subsistema: 'Controle de Acesso',
    descricao:
      'Cadastro de 18 novos tags RFID 125kHz na controladora SS 311E e regulagem da mola hidráulica da porta principal.',
    status: 'Concluída',
    tecnico: 'Marcos Admin',
    itens: [
      { id: 'it-8', desc: 'Chaveiro TAG RFID 125kHz', qtd: 18, valor: 9.0 },
      { id: 'it-9', desc: 'Parametrização e Regulagem de Fechadura Eletroímã', qtd: 1, valor: 160.0 },
    ],
    assinatura: null,
  },
  {
    id: 'OS-2026-005',
    data: '19/11/2026',
    cliente: 'Condomínio Jardins do Cerrado',
    telefone: '(61) 98220-3315',
    endereco: 'Rua das Paineiras, Lote 08 — Águas Claras/DF',
    subsistema: 'Alarme / Cerca Elétrica',
    descricao:
      'Disparo falso no setor 02 da central ELC 5002 durante período noturno. Revisão de isoladores e haste de aterramento.',
    status: 'Aberta',
    tecnico: 'Carlos Técnico',
    itens: [
      { id: 'it-10', desc: 'Jogo de Isoladores Tipo Castanha (12 un)', qtd: 2, valor: 28.0 },
      { id: 'it-11', desc: 'Inspeção Técnica Perimetral', qtd: 1, valor: 150.0 },
    ],
    assinatura: null,
  },
];
