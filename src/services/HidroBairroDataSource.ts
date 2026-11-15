import {
  DEMO_ALERTS,
  DEMO_GUIDANCE_ITEMS,
  DEMO_MONITORING_POINTS,
  DEMO_REQUEST_CATEGORIES,
  DEMO_SERVICE_REQUESTS,
  DEMO_WATER_LEVEL_READINGS,
} from '@/data/demoData';
import type {
  DataCollection,
  FloodAlert,
  GuidanceItem,
  MonitoringPoint,
  RequestCategory,
  ServiceRequest,
  WaterLevelReading,
} from '@/types/domain';

const DEMO_NOTICE =
  'Todos os registros são demonstrativos. Coordenadas, limiares, leituras e alertas são fictícios e não representam sensores, ocorrências ou risco atual.';

export interface MonitoringDataSource {
  listMonitoringPoints(): Promise<DataCollection<readonly MonitoringPoint[]>>;
  listWaterLevelReadings(): Promise<DataCollection<readonly WaterLevelReading[]>>;
  listAlerts(): Promise<DataCollection<readonly FloodAlert[]>>;
}

export interface GuidanceDataSource {
  listGuidanceItems(): Promise<DataCollection<readonly GuidanceItem[]>>;
}

export interface ServiceRequestDataSource {
  listRequestCategories(): Promise<DataCollection<readonly RequestCategory[]>>;
  listServiceRequests(): Promise<DataCollection<readonly ServiceRequest[]>>;
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

const demoDataSource: HidroBairroDataSource = {
  async listMonitoringPoints() {
    return collection(DEMO_MONITORING_POINTS);
  },
  async listWaterLevelReadings() {
    return collection(DEMO_WATER_LEVEL_READINGS);
  },
  async listAlerts() {
    return collection(DEMO_ALERTS);
  },
  async listGuidanceItems() {
    return collection(DEMO_GUIDANCE_ITEMS);
  },
  async listRequestCategories() {
    return collection(DEMO_REQUEST_CATEGORIES);
  },
  async listServiceRequests() {
    return collection(DEMO_SERVICE_REQUESTS);
  },
};

export const hidroBairroDataSource: HidroBairroDataSource = demoDataSource;
