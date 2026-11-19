export type MonitoringZone = 'SUL' | 'LESTE' | 'NORTE' | 'OESTE' | 'CENTRO';

export type SensorReadingOrigin = 'IOT' | 'SIMULADO';

export type AlertSeverity = 'ATENCAO' | 'CRITICO';
export type AlertStatus = 'ATIVO' | 'ENCERRADO';

export type RequestStatus =
  | 'RECEBIDA'
  | 'EM_VISTORIA'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type DataProvider = 'DEMONSTRACAO' | 'API';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MonitoringPoint extends Coordinates {
  id: number;
  name: string;
  subprefecture: string;
  neighborhood: string;
  zone: MonitoringZone;
  alertThresholdCm: number;
  active: boolean;
  createdAt: string;
}

export interface WaterLevelReading {
  id: number;
  pointId: number;
  levelCm: number;
  collectedAt: string;
  origin: SensorReadingOrigin;
}

export interface FloodAlert {
  id: number;
  pointId: number;
  readingId: number | null;
  levelCm: number;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  createdAt: string;
  endedAt: string | null;
}

export interface RequestCategory {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

export interface ServiceRequest {
  id: number;
  protocol: string;
  userId: number;
  categoryId: number;
  categoryName?: string | null;
  pointId: number | null;
  title: string;
  description: string;
  location: Coordinates | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RequestStatusHistory {
  id: number;
  requestId: number;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  userId: number;
  observation: string | null;
  createdAt: string;
}

export interface ServiceRequestDraft {
  categoryId: number;
  pointId: number;
  title: string;
  description: string;
  location: Coordinates;
}

export interface ServiceRequestUpdateDraft {
  title: string;
  description: string;
}

export interface DataCollection<T> {
  data: T;
  provider: DataProvider;
  notice?: string;
}
