import type {
  DataCollection,
  FloodAlert,
  MonitoringPoint,
  WaterLevelReading,
} from '@/types/domain';
import {
  apiBoolean,
  apiCollection,
  apiList,
  apiNullableNumber,
  apiNullableString,
  apiNumber,
  apiRecord,
  apiRequest,
  apiString,
} from '@/services/apiClient';

const VALID_ZONES = ['SUL', 'LESTE', 'NORTE', 'OESTE', 'CENTRO'] as const;
const VALID_SEVERITIES = ['ATENCAO', 'CRITICO'] as const;
const VALID_ALERT_STATUSES = ['ATIVO', 'ENCERRADO'] as const;
const VALID_ORIGINS = ['IOT', 'SIMULADO'] as const;

function parseEnum<T extends string>(
  value: string,
  values: readonly T[],
  field: string,
): T {
  if (values.some((candidate) => candidate === value)) {
    return value as T;
  }
  throw new Error(`A API retornou um valor inválido para ${field}.`);
}

function mapMonitoringPoint(value: unknown): MonitoringPoint {
  const record = apiRecord(value, 'ponto de monitoramento');
  const active = apiBoolean(record, ['ativo', 'active']);

  return {
    id: apiNumber(record, ['id']),
    name: apiString(record, ['nome', 'name']),
    subprefecture: apiString(record, ['subprefeitura', 'subprefecture']),
    neighborhood: apiString(record, ['bairro', 'neighborhood']),
    zone: parseEnum(
      apiString(record, ['zona', 'zone']),
      VALID_ZONES,
      'zona',
    ),
    latitude: apiNumber(record, ['latitude']),
    longitude: apiNumber(record, ['longitude']),
    alertThresholdCm: apiNumber(record, ['limiarAlertaCm', 'alertThresholdCm']),
    active,
    createdAt: apiString(record, ['criadoEm', 'createdAt']),
  };
}

function mapAlert(value: unknown): FloodAlert {
  const record = apiRecord(value, 'alerta');
  return {
    id: apiNumber(record, ['id']),
    pointId: apiNumber(record, ['pontoId', 'pointId']),
    readingId: apiNullableNumber(record, ['leituraId', 'readingId']),
    levelCm: apiNumber(record, ['nivelCm', 'levelCm']),
    severity: parseEnum(
      apiString(record, ['severidade', 'severity']),
      VALID_SEVERITIES,
      'severidade',
    ),
    message: apiString(record, ['mensagem', 'message']),
    status: parseEnum(
      apiString(record, ['status']),
      VALID_ALERT_STATUSES,
      'status do alerta',
    ),
    createdAt: apiString(record, ['criadoEm', 'createdAt']),
    endedAt: apiNullableString(record, ['encerradoEm', 'endedAt']),
  };
}

function mapReading(value: unknown): WaterLevelReading {
  const record = apiRecord(value, 'leitura');
  return {
    id: apiNumber(record, ['id']),
    pointId: apiNumber(record, ['pontoId', 'pointId']),
    levelCm: apiNumber(record, ['nivelCm', 'levelCm']),
    collectedAt: apiString(record, ['coletadoEm', 'collectedAt']),
    origin: parseEnum(
      apiString(record, ['origem', 'origin']),
      VALID_ORIGINS,
      'origem da leitura',
    ),
  };
}

async function getList<T>(
  path: string,
  token: string,
  label: string,
  map: (item: unknown) => T,
): Promise<DataCollection<readonly T[]>> {
  const response = await apiRequest('java', path, { token });
  return apiCollection(apiList(response, label).map(map));
}

export const javaApiDataSource = {
  listMonitoringPoints(token: string) {
    return getList(
      '/api/pontos-monitoramento?page=0&size=100',
      token,
      'pontos de monitoramento',
      mapMonitoringPoint,
    );
  },

  listWaterLevelReadings(token: string) {
    return getList(
      '/api/leituras?page=0&size=100',
      token,
      'leituras',
      mapReading,
    );
  },

  listAlerts(token: string) {
    return getList(
      '/api/alertas?page=0&size=100',
      token,
      'alertas',
      mapAlert,
    );
  },

  async askGuidance(
    token: string,
    question: string,
  ): Promise<DataCollection<string>> {
    const response = apiRecord(
      await apiRequest('java', '/api/ia/orientacoes', {
        method: 'POST',
        token,
        body: { pergunta: question },
      }),
      'resposta da orientação',
    );
    return apiCollection(apiString(response, ['orientacao']));
  },
};
