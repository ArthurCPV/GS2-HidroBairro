import {
  DEMO_ALERTS,
  DEMO_GUIDANCE_ITEMS,
  DEMO_MONITORING_POINTS,
  DEMO_REQUEST_CATEGORIES,
  DEMO_WATER_LEVEL_READINGS,
} from '@/data/demoData';
import type {
  DataCollection,
  FloodAlert,
  GuidanceItem,
  MonitoringPoint,
  RequestCategory,
  RequestStatus,
  RequestStatusHistory,
  ServiceRequest,
  ServiceRequestDraft,
  ServiceRequestUpdateDraft,
  WaterLevelReading,
} from '@/types/domain';
import { authStorage } from '@/services/authStorage';
import { dotNetApiDataSource } from '@/services/DotNetApiDataSource';
import { javaApiDataSource } from '@/services/JavaApiDataSource';
import { serviceRequestRepository } from '@/services/ServiceRequestRepository';

const DEMO_NOTICE =
  'Todos os registros são demonstrativos. Coordenadas, limiares, leituras e alertas são fictícios e não representam sensores, ocorrências ou risco atual.';

export interface MonitoringDataSource {
  listMonitoringPoints(): Promise<DataCollection<readonly MonitoringPoint[]>>;
  listWaterLevelReadings(): Promise<DataCollection<readonly WaterLevelReading[]>>;
  listAlerts(): Promise<DataCollection<readonly FloodAlert[]>>;
}

export interface GuidanceDataSource {
  listGuidanceItems(): Promise<DataCollection<readonly GuidanceItem[]>>;
  askGuidance(question: string): Promise<DataCollection<string>>;
}

export interface ServiceRequestDataSource {
  listRequestCategories(): Promise<DataCollection<readonly RequestCategory[]>>;
  listServiceRequests(
    onlyCurrentUser?: boolean,
  ): Promise<DataCollection<readonly ServiceRequest[]>>;
  getServiceRequest(requestId: number): Promise<DataCollection<ServiceRequest>>;
  listRequestHistory(
    requestId: number,
  ): Promise<DataCollection<readonly RequestStatusHistory[]>>;
  createServiceRequest(
    draft: ServiceRequestDraft,
    idempotencyKey: string,
  ): Promise<DataCollection<ServiceRequest>>;
  updateServiceRequest(
    requestId: number,
    draft: ServiceRequestDraft | ServiceRequestUpdateDraft,
  ): Promise<DataCollection<ServiceRequest>>;
  cancelServiceRequest(
    requestId: number,
  ): Promise<DataCollection<ServiceRequest>>;
  changeServiceRequestStatus(
    requestId: number,
    status: RequestStatus,
    observation: string,
  ): Promise<DataCollection<ServiceRequest>>;
}

export type HidroBairroDataSource = MonitoringDataSource &
  GuidanceDataSource &
  ServiceRequestDataSource;

function collection<T>(data: readonly T[]): DataCollection<readonly T[]> {
  return {
    data,
    provider: 'DEMONSTRACAO',
    notice: DEMO_NOTICE,
  };
}

function itemCollection<T>(data: T): DataCollection<T> {
  return {
    data,
    provider: 'DEMONSTRACAO',
    notice: DEMO_NOTICE,
  };
}

async function getApiToken() {
  return authStorage.getToken();
}

export const hidroBairroDataSource: HidroBairroDataSource = {
  async listMonitoringPoints() {
    const token = await getApiToken();
    return token
      ? javaApiDataSource.listMonitoringPoints(token)
      : collection(DEMO_MONITORING_POINTS);
  },

  async listWaterLevelReadings() {
    const token = await getApiToken();
    return token
      ? javaApiDataSource.listWaterLevelReadings(token)
      : collection(DEMO_WATER_LEVEL_READINGS);
  },

  async listAlerts() {
    const token = await getApiToken();
    return token
      ? javaApiDataSource.listAlerts(token)
      : collection(DEMO_ALERTS);
  },

  async listGuidanceItems() {
    const token = await getApiToken();
    if (token) {
      return javaApiDataSource.listGuidanceItems();
    }
    return collection(DEMO_GUIDANCE_ITEMS);
  },

  async askGuidance(question) {
    const token = await getApiToken();
    if (token) {
      return javaApiDataSource.askGuidance(token, question);
    }
    return itemCollection(
      'O chat com a IA fica disponível quando a API Java estiver conectada. Enquanto isso, consulte as orientações educativas demonstrativas acima.',
    );
  },

  async listRequestCategories() {
    const token = await getApiToken();
    return token
      ? dotNetApiDataSource.listRequestCategories(token)
      : collection(DEMO_REQUEST_CATEGORIES);
  },

  async listServiceRequests(onlyCurrentUser = true) {
    const token = await getApiToken();
    if (token) {
      return dotNetApiDataSource.listServiceRequests(token, onlyCurrentUser);
    }
    return collection(await serviceRequestRepository.list());
  },

  async getServiceRequest(requestId) {
    const token = await getApiToken();
    if (token) {
      return dotNetApiDataSource.getServiceRequest(token, requestId);
    }
    const request = (await serviceRequestRepository.list()).find(
      (item) => item.id === requestId,
    );
    if (!request) {
      throw new Error('A solicitação não foi encontrada.');
    }
    return itemCollection(request);
  },

  async listRequestHistory(requestId) {
    const token = await getApiToken();
    if (token) {
      return dotNetApiDataSource.listRequestHistory(token, requestId);
    }
    return collection(await serviceRequestRepository.listHistory(requestId));
  },

  async createServiceRequest(draft, idempotencyKey) {
    const token = await getApiToken();
    if (token) {
      return dotNetApiDataSource.createServiceRequest(
        token,
        draft,
        idempotencyKey,
      );
    }
    return itemCollection(await serviceRequestRepository.create(draft));
  },

  async updateServiceRequest(requestId, draft) {
    const token = await getApiToken();
    if (token) {
      return dotNetApiDataSource.updateServiceRequest(
        token,
        requestId,
        {
          title: draft.title,
          description: draft.description,
        },
      );
    }
    if (!('categoryId' in draft)) {
      throw new Error(
        'A edição demonstrativa exige categoria e local para manter o registro.',
      );
    }
    return itemCollection(
      await serviceRequestRepository.update(requestId, draft),
    );
  },

  async cancelServiceRequest(requestId) {
    const token = await getApiToken();
    if (token) {
      return dotNetApiDataSource.cancelServiceRequest(token, requestId);
    }
    return itemCollection(await serviceRequestRepository.cancel(requestId));
  },

  async changeServiceRequestStatus(requestId, status, observation) {
    const token = await getApiToken();
    if (!token) {
      throw new Error(
        'A atualização de status pelo gestor exige uma sessão autenticada.',
      );
    }
    return dotNetApiDataSource.changeServiceRequestStatus(
      token,
      requestId,
      status,
      observation,
    );
  },
};
