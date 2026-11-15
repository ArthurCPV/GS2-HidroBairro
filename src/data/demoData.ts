import type {
  FloodAlert,
  GuidanceItem,
  MonitoringPoint,
  RequestCategory,
  ServiceRequest,
  WaterLevelReading,
} from '@/types/domain';

export const DEMO_MONITORING_POINTS: readonly MonitoringPoint[] = [
  {
    id: 9001,
    name: 'Ponto demonstrativo — Campo Limpo',
    subprefecture: 'Campo Limpo',
    neighborhood: 'Campo Limpo',
    zone: 'SUL',
    latitude: -23.6337,
    longitude: -46.7585,
    alertThresholdCm: 80,
    active: true,
    createdAt: '2026-11-01T12:00:00-03:00',
  },
  {
    id: 9002,
    name: 'Ponto demonstrativo — Capão Redondo',
    subprefecture: 'Campo Limpo',
    neighborhood: 'Capão Redondo',
    zone: 'SUL',
    latitude: -23.6684,
    longitude: -46.7714,
    alertThresholdCm: 80,
    active: true,
    createdAt: '2026-11-01T12:00:00-03:00',
  },
  {
    id: 9003,
    name: 'Ponto demonstrativo — M’Boi Mirim',
    subprefecture: 'M’Boi Mirim',
    neighborhood: 'Jardim Ângela',
    zone: 'SUL',
    latitude: -23.6842,
    longitude: -46.7581,
    alertThresholdCm: 80,
    active: true,
    createdAt: '2026-11-01T12:00:00-03:00',
  },
];

export const DEMO_WATER_LEVEL_READINGS: readonly WaterLevelReading[] = [
  {
    id: 9901,
    pointId: 9001,
    levelCm: 42,
    collectedAt: '2026-11-14T14:00:00-03:00',
    origin: 'SIMULADO',
  },
  {
    id: 9902,
    pointId: 9002,
    levelCm: 86.5,
    collectedAt: '2026-11-14T14:05:00-03:00',
    origin: 'SIMULADO',
  },
  {
    id: 9903,
    pointId: 9003,
    levelCm: 58,
    collectedAt: '2026-11-14T14:10:00-03:00',
    origin: 'SIMULADO',
  },
];

export const DEMO_ALERTS: readonly FloodAlert[] = [
  {
    id: 9801,
    pointId: 9002,
    readingId: 9902,
    levelCm: 86.5,
    severity: 'ATENCAO',
    message:
      'Alerta demonstrativo: valor simulado acima do limiar de exemplo.',
    status: 'ATIVO',
    createdAt: '2026-11-14T14:06:00-03:00',
    endedAt: null,
  },
];

export const DEMO_GUIDANCE_ITEMS: readonly GuidanceItem[] = [
  {
    id: 'demo-guidance-1',
    category: 'PREVENCAO',
    title: 'Acompanhe os canais oficiais',
    content:
      'Consulte comunicados da Defesa Civil e da Prefeitura. Este conteúdo é apenas uma demonstração e não considera condições locais em tempo real.',
    source: 'DEMONSTRACAO',
    updatedAt: '2026-11-14T09:00:00-03:00',
  },
  {
    id: 'demo-guidance-2',
    category: 'DURANTE_CHUVA',
    title: 'Evite atravessar áreas alagadas',
    content:
      'Não atravesse trechos alagados a pé ou de veículo. Siga orientações de equipes e autoridades locais.',
    source: 'DEMONSTRACAO',
    updatedAt: '2026-11-14T09:00:00-03:00',
  },
  {
    id: 'demo-guidance-3',
    category: 'POS_CHUVA',
    title: 'Peça apoio pelos canais adequados',
    content:
      'Se identificar um problema de zeladoria, registre uma solicitação quando for seguro fazê-lo. Este exemplo não foi enviado a nenhum serviço público.',
    source: 'DEMONSTRACAO',
    updatedAt: '2026-11-14T09:00:00-03:00',
  },
];

export const DEMO_REQUEST_CATEGORIES: readonly RequestCategory[] = [
  {
    id: 1,
    name: 'Bueiro entupido',
    description: 'Verificação demonstrativa de bueiro ou boca de lobo.',
    active: true,
  },
  {
    id: 2,
    name: 'Drenagem danificada',
    description: 'Verificação demonstrativa de estrutura de drenagem.',
    active: true,
  },
  {
    id: 3,
    name: 'Descarte irregular',
    description: 'Registro demonstrativo de descarte irregular.',
    active: true,
  },
];

export const DEMO_SERVICE_REQUESTS: readonly ServiceRequest[] = [
  {
    id: 9701,
    protocol: 'DEMO-HB-2026-001',
    userId: 1,
    categoryId: 1,
    pointId: 9001,
    title: 'Solicitação demonstrativa de zeladoria',
    description:
      'Registro fictício para apresentar o fluxo de solicitações no aplicativo.',
    location: null,
    status: 'RECEBIDA',
    createdAt: '2026-11-14T13:30:00-03:00',
    updatedAt: '2026-11-14T13:30:00-03:00',
  },
  {
    id: 9702,
    protocol: 'DEMO-HB-2026-002',
    userId: 1,
    categoryId: 2,
    pointId: 9003,
    title: 'Verificação demonstrativa de drenagem',
    description: 'Este registro não foi enviado à Prefeitura.',
    location: null,
    status: 'EM_VISTORIA',
    createdAt: '2026-11-13T10:15:00-03:00',
    updatedAt: '2026-11-14T08:20:00-03:00',
  },
];
