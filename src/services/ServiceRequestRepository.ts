import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEMO_MONITORING_POINTS,
  DEMO_REQUEST_CATEGORIES,
  DEMO_SERVICE_REQUESTS,
} from '@/data/demoData';
import type {
  Coordinates,
  RequestStatus,
  RequestStatusHistory,
  ServiceRequest,
  ServiceRequestDraft,
} from '@/types/domain';

const STORAGE_KEY = '@hidrobairro/service-requests/v1';
const DEMO_USER_ID = 1;
const REQUEST_STATUSES: readonly RequestStatus[] = [
  'RECEBIDA',
  'EM_VISTORIA',
  'CONCLUIDA',
  'CANCELADA',
];

type StoredRequest = {
  request: ServiceRequest;
  history: RequestStatusHistory[];
};

type StoredState = {
  version: 1;
  records: StoredRequest[];
};

let statePromise: Promise<StoredState> | null = null;
let mutationQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCoordinates(value: unknown): value is Coordinates {
  return (
    isRecord(value) &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

function isRequestStatus(value: unknown): value is RequestStatus {
  return (
    typeof value === 'string' &&
    REQUEST_STATUSES.some((status) => status === value)
  );
}

function isServiceRequest(value: unknown): value is ServiceRequest {
  return (
    isRecord(value) &&
    isFiniteNumber(value.id) &&
    typeof value.protocol === 'string' &&
    isFiniteNumber(value.userId) &&
    isFiniteNumber(value.categoryId) &&
    (value.pointId === null || isFiniteNumber(value.pointId)) &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    (value.location === null || isCoordinates(value.location)) &&
    (value.pointId !== null || value.location !== null) &&
    isRequestStatus(value.status) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isHistoryEntry(value: unknown): value is RequestStatusHistory {
  return (
    isRecord(value) &&
    isFiniteNumber(value.id) &&
    isFiniteNumber(value.requestId) &&
    (value.previousStatus === null || isRequestStatus(value.previousStatus)) &&
    isRequestStatus(value.newStatus) &&
    isFiniteNumber(value.userId) &&
    (value.observation === null || typeof value.observation === 'string') &&
    typeof value.createdAt === 'string'
  );
}

function parseStoredState(value: unknown): StoredState {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.records)
  ) {
    throw new Error('O formato dos dados locais de solicitações é inválido.');
  }

  const records: StoredRequest[] = [];
  for (const candidate of value.records) {
    if (
      !isRecord(candidate) ||
      !isServiceRequest(candidate.request) ||
      !Array.isArray(candidate.history)
    ) {
      throw new Error('Há uma solicitação local com dados inválidos.');
    }

    const request = candidate.request;
    const history = candidate.history.filter(isHistoryEntry);
    if (
      history.length !== candidate.history.length ||
      history.some((entry) => entry.requestId !== request.id)
    ) {
      throw new Error('Há um histórico local com dados inválidos.');
    }

    records.push({ request, history });
  }

  return { version: 1, records };
}

async function persist(state: StoredState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadState(): Promise<StoredState> {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (storedValue === null) {
    const initialState: StoredState = {
      version: 1,
      records: DEMO_SERVICE_REQUESTS.map((request) => ({
        request,
        history: [],
      })),
    };
    await persist(initialState);
    return initialState;
  }

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(storedValue);
  } catch (error) {
    console.error('Os dados locais de solicitações não são JSON válido.', error);
    throw new Error('Não foi possível ler os dados locais de solicitações.');
  }

  try {
    return parseStoredState(parsedValue);
  } catch (error) {
    console.error('Os dados locais de solicitações são inválidos.', error);
    throw new Error('Os dados locais de solicitações estão inválidos.');
  }
}

function getState(): Promise<StoredState> {
  if (!statePromise) {
    statePromise = loadState().catch((error: unknown) => {
      statePromise = null;
      throw error;
    });
  }
  return statePromise;
}

function validateDraft(draft: ServiceRequestDraft): void {
  const category = DEMO_REQUEST_CATEGORIES.find(
    (item) => item.id === draft.categoryId && item.active,
  );
  const point = DEMO_MONITORING_POINTS.find(
    (item) => item.id === draft.pointId && item.active,
  );

  if (
    !category ||
    !point ||
    !Number.isInteger(draft.categoryId) ||
    !Number.isInteger(draft.pointId) ||
    !draft.title.trim() ||
    draft.title.trim().length > 120 ||
    !draft.description.trim() ||
    draft.description.trim().length > 1000 ||
    !isCoordinates(draft.location) ||
    draft.location.latitude !== point.latitude ||
    draft.location.longitude !== point.longitude
  ) {
    throw new Error('Os dados da solicitação não passaram pela validação.');
  }
}

function createHistoryEntry(
  state: StoredState,
  request: ServiceRequest,
  previousStatus: RequestStatus | null,
  observation: string,
): RequestStatusHistory {
  const highestId = state.records.reduce(
    (maximum, record) =>
      record.history.reduce(
        (historyMaximum, entry) => Math.max(historyMaximum, entry.id),
        maximum,
      ),
    0,
  );

  return {
    id: highestId + 1,
    requestId: request.id,
    previousStatus,
    newStatus: request.status,
    userId: request.userId,
    observation,
    createdAt: request.updatedAt,
  };
}

async function mutate<T>(
  operation: (state: StoredState) => { nextState: StoredState; result: T },
): Promise<T> {
  const pending = mutationQueue.then(async () => {
    const currentState = await getState();
    const { nextState, result } = operation(currentState);
    await persist(nextState);
    statePromise = Promise.resolve(nextState);
    return result;
  });
  mutationQueue = pending.then(
    () => undefined,
    () => undefined,
  );
  return pending;
}

function findRequest(state: StoredState, requestId: number): StoredRequest {
  const record = state.records.find(({ request }) => request.id === requestId);
  if (!record) {
    throw new Error('A solicitação não foi encontrada.');
  }
  return record;
}

function toUpdatedRequest(
  request: ServiceRequest,
  draft: ServiceRequestDraft,
): ServiceRequest {
  return {
    ...request,
    categoryId: draft.categoryId,
    pointId: draft.pointId,
    title: draft.title.trim(),
    description: draft.description.trim(),
    location: draft.location,
    updatedAt: new Date().toISOString(),
  };
}

export const serviceRequestRepository = {
  async list(): Promise<readonly ServiceRequest[]> {
    const state = await getState();
    return state.records
      .map(({ request }) => request)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },

  async listHistory(
    requestId: number,
  ): Promise<readonly RequestStatusHistory[]> {
    const state = await getState();
    return [...findRequest(state, requestId).history].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  },

  async create(draft: ServiceRequestDraft): Promise<ServiceRequest> {
    validateDraft(draft);
    return mutate((state) => {
      const highestId = state.records.reduce(
        (maximum, record) => Math.max(maximum, record.request.id),
        0,
      );
      const now = new Date().toISOString();
      const currentYear = new Date().getFullYear();
      const protocolPrefix = `DEMO-HB-${currentYear}-`;
      const highestProtocolNumber = state.records.reduce(
        (maximum, record) => {
          if (!record.request.protocol.startsWith(protocolPrefix)) {
            return maximum;
          }
          const suffix = Number(
            record.request.protocol.slice(protocolPrefix.length),
          );
          return Number.isInteger(suffix) ? Math.max(maximum, suffix) : maximum;
        },
        0,
      );
      const request: ServiceRequest = {
        id: highestId + 1,
        protocol: `${protocolPrefix}${String(highestProtocolNumber + 1).padStart(3, '0')}`,
        userId: DEMO_USER_ID,
        categoryId: draft.categoryId,
        pointId: draft.pointId,
        title: draft.title.trim(),
        description: draft.description.trim(),
        location: draft.location,
        status: 'RECEBIDA',
        createdAt: now,
        updatedAt: now,
      };
      const history = createHistoryEntry(
        state,
        request,
        null,
        'Solicitação demonstrativa criada localmente.',
      );

      return {
        nextState: {
          ...state,
          records: [...state.records, { request, history: [history] }],
        },
        result: request,
      };
    });
  },

  async update(
    requestId: number,
    draft: ServiceRequestDraft,
  ): Promise<ServiceRequest> {
    validateDraft(draft);
    return mutate((state) => {
      const existing = findRequest(state, requestId);
      if (existing.request.status !== 'RECEBIDA') {
        throw new Error(
          'Só é possível editar solicitações que ainda foram recebidas.',
        );
      }

      const request = toUpdatedRequest(existing.request, draft);
      return {
        nextState: {
          ...state,
          records: state.records.map((record) =>
            record.request.id === requestId
              ? { ...record, request }
              : record,
          ),
        },
        result: request,
      };
    });
  },

  async cancel(requestId: number): Promise<ServiceRequest> {
    return mutate((state) => {
      const existing = findRequest(state, requestId);
      if (existing.request.status !== 'RECEBIDA') {
        throw new Error(
          'Só é possível cancelar solicitações que ainda foram recebidas.',
        );
      }

      const request: ServiceRequest = {
        ...existing.request,
        status: 'CANCELADA',
        updatedAt: new Date().toISOString(),
      };
      const history = createHistoryEntry(
        state,
        request,
        existing.request.status,
        'Solicitação demonstrativa cancelada localmente.',
      );

      return {
        nextState: {
          ...state,
          records: state.records.map((record) =>
            record.request.id === requestId
              ? { ...record, request, history: [...record.history, history] }
              : record,
          ),
        },
        result: request,
      };
    });
  },
};
