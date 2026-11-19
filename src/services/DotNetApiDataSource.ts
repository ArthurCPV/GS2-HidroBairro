import type {
  DataCollection,
  RequestCategory,
  RequestStatus,
  RequestStatusHistory,
  ServiceRequest,
  ServiceRequestDraft,
  ServiceRequestUpdateDraft,
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

const VALID_REQUEST_STATUSES = [
  'RECEBIDA',
  'EM_VISTORIA',
  'CONCLUIDA',
  'CANCELADA',
] as const;

function parseStatus(value: string): RequestStatus {
  if (VALID_REQUEST_STATUSES.some((status) => status === value)) {
    return value as RequestStatus;
  }
  throw new Error('A API .NET retornou um status de solicitação inválido.');
}

function mapCategory(value: unknown): RequestCategory {
  const record = apiRecord(value, 'categoria de solicitação');
  return {
    id: apiNumber(record, ['id']),
    name: apiString(record, ['nome', 'name']),
    description: apiNullableString(record, ['descricao', 'description']),
    active: apiBoolean(record, ['ativo', 'active']),
  };
}

function mapServiceRequest(value: unknown): ServiceRequest {
  const record = apiRecord(value, 'solicitação');
  const latitude = apiNullableNumber(record, ['latitude']);
  const longitude = apiNullableNumber(record, ['longitude']);

  if ((latitude === null) !== (longitude === null)) {
    throw new Error(
      'A API .NET retornou uma localização incompleta para a solicitação.',
    );
  }

  return {
    id: apiNumber(record, ['id']),
    protocol: apiString(record, ['protocolo', 'protocol']),
    userId: apiNumber(record, ['usuarioId', 'userId']),
    categoryId: apiNumber(record, ['categoriaId', 'categoryId']),
    categoryName: apiNullableString(record, ['categoriaNome', 'categoryName']),
    pointId: apiNullableNumber(record, ['pontoId', 'pointId']),
    title: apiString(record, ['titulo', 'title']),
    description: apiString(record, ['descricao', 'description']),
    location:
      latitude === null || longitude === null
        ? null
        : { latitude, longitude },
    status: parseStatus(apiString(record, ['status'])),
    createdAt: apiString(record, ['criadoEm', 'createdAt']),
    updatedAt: apiString(record, ['atualizadoEm', 'updatedAt']),
  };
}

function mapHistory(value: unknown): RequestStatusHistory {
  const record = apiRecord(value, 'histórico de status');
  const previousStatus = apiNullableString(record, [
    'statusAnterior',
    'previousStatus',
  ]);
  return {
    id: apiNumber(record, ['id']),
    requestId: apiNumber(record, ['solicitacaoId', 'requestId']),
    previousStatus:
      previousStatus === null ? null : parseStatus(previousStatus),
    newStatus: parseStatus(apiString(record, ['statusNovo', 'newStatus'])),
    userId: apiNumber(record, ['usuarioId', 'userId']),
    observation: apiNullableString(record, ['observacao', 'observation']),
    createdAt: apiString(record, ['criadoEm', 'createdAt']),
  };
}

async function getList<T>(
  path: string,
  token: string,
  label: string,
  map: (item: unknown) => T,
): Promise<DataCollection<readonly T[]>> {
  const response = await apiRequest('dotnet', path, { token });
  return apiCollection(apiList(response, label).map(map));
}

function mapRequestResponse(value: unknown) {
  return apiCollection(mapServiceRequest(value));
}

export const dotNetApiDataSource = {
  listRequestCategories(token: string) {
    return getList(
      '/api/categorias',
      token,
      'categorias de solicitação',
      mapCategory,
    );
  },

  listServiceRequests(token: string, onlyCurrentUser: boolean) {
    const query = new URLSearchParams({
      page: '1',
      pageSize: '100',
      somenteDoUsuario: String(onlyCurrentUser),
    });
    return getList(
      `/api/solicitacoes?${query.toString()}`,
      token,
      'solicitações',
      mapServiceRequest,
    );
  },

  async getServiceRequest(token: string, requestId: number) {
    const response = await apiRequest(
      'dotnet',
      `/api/solicitacoes/${requestId}`,
      { token },
    );
    return mapRequestResponse(response);
  },

  listRequestHistory(token: string, requestId: number) {
    return getList(
      `/api/solicitacoes/${requestId}/historico`,
      token,
      'histórico de solicitações',
      mapHistory,
    );
  },

  async createServiceRequest(
    token: string,
    draft: ServiceRequestDraft,
    idempotencyKey: string,
  ) {
    const response = await apiRequest('dotnet', '/api/solicitacoes', {
      method: 'POST',
      token,
      idempotencyKey,
      body: {
        categoriaId: draft.categoryId,
        pontoId: draft.pointId,
        titulo: draft.title.trim(),
        descricao: draft.description.trim(),
        latitude: draft.location.latitude,
        longitude: draft.location.longitude,
      },
    });
    return mapRequestResponse(response);
  },

  async updateServiceRequest(
    token: string,
    requestId: number,
    draft: ServiceRequestUpdateDraft,
  ) {
    const response = await apiRequest(
      'dotnet',
      `/api/solicitacoes/${requestId}`,
      {
        method: 'PUT',
        token,
        body: {
          titulo: draft.title.trim(),
          descricao: draft.description.trim(),
        },
      },
    );
    return mapRequestResponse(response);
  },

  async cancelServiceRequest(token: string, requestId: number) {
    const response = await apiRequest(
      'dotnet',
      `/api/solicitacoes/${requestId}/cancelar?observacao=${encodeURIComponent('Cancelamento solicitado no aplicativo.')}`,
      { method: 'POST', token },
    );
    return mapRequestResponse(response);
  },

  async changeServiceRequestStatus(
    token: string,
    requestId: number,
    status: RequestStatus,
    observation: string,
  ) {
    const response = await apiRequest(
      'dotnet',
      `/api/solicitacoes/${requestId}/status`,
      {
        method: 'PATCH',
        token,
        body: { statusNovo: status, observacao: observation },
      },
    );
    return mapRequestResponse(response);
  },
};
