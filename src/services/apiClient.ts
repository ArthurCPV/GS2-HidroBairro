function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

export const API_BASE_URLS = {
  java: normalizeBaseUrl(
    process.env.EXPO_PUBLIC_JAVA_API_URL ??
      'https://hidrobairro-java-gs2.onrender.com',
  ),
  dotnet: normalizeBaseUrl(
    process.env.EXPO_PUBLIC_DOTNET_API_URL ??
      'https://hidrobairro-api-dotnet.onrender.com',
  ),
};

export type ApiService = keyof typeof API_BASE_URLS;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function apiRecord(value: unknown, label: string) {
  if (!isApiRecord(value)) {
    throw new Error(`A resposta da API não contém um objeto válido para ${label}.`);
  }
  return value;
}

export function apiList(value: unknown, label: string): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (isApiRecord(value)) {
    for (const key of ['content', 'items', 'data', 'results']) {
      if (Array.isArray(value[key])) {
        return value[key];
      }
    }
    for (const key of ['data', 'result']) {
      if (isApiRecord(value[key])) {
        return apiList(value[key], label);
      }
    }
  }
  throw new Error(`A resposta da API não contém uma lista válida de ${label}.`);
}

function getField(record: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }
  throw new Error(`A resposta da API não contém o campo ${keys[0]}.`);
}

export function apiString(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  const value = getField(record, keys);
  if (typeof value !== 'string') {
    throw new Error(`O campo ${keys[0]} retornado pela API não é texto.`);
  }
  return value;
}

export function apiNumber(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  const value = getField(record, keys);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`O campo ${keys[0]} retornado pela API não é numérico.`);
  }
  return value;
}

export function apiNullableNumber(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  const key = keys.find((candidate) => candidate in record);
  if (key === undefined || record[key] === null) {
    return null;
  }
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`O campo ${keys[0]} retornado pela API não é numérico.`);
  }
  return value;
}

export function apiNullableString(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  const key = keys.find((candidate) => candidate in record);
  if (key === undefined || record[key] === null) {
    return null;
  }
  const value = record[key];
  if (typeof value !== 'string') {
    throw new Error(`O campo ${keys[0]} retornado pela API não é texto.`);
  }
  return value;
}

export function apiBoolean(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  const value = getField(record, keys);
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'S') {
    return true;
  }
  if (value === 'N') {
    return false;
  }
  throw new Error(`O campo ${keys[0]} retornado pela API não é booleano.`);
}

export function apiCollection<T>(data: T) {
  return { data, provider: 'API' as const };
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (isApiRecord(payload)) {
    for (const key of ['detail', 'message', 'title', 'error']) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    const errors = payload.errors;
    if (isApiRecord(errors)) {
      const firstError = Object.values(errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .find((value): value is string => typeof value === 'string');
      if (firstError) {
        return firstError;
      }
    }
  }

  return fallback;
}

export async function apiRequest(
  service: ApiService,
  path: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URLS[service]}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (error) {
    console.error(`A API ${service} não respondeu à solicitação.`, error);
    throw new ApiError(
      error instanceof Error && error.name === 'AbortError'
        ? 'A API demorou demais para responder. Tente novamente.'
        : `Não foi possível conectar à API ${service}. Verifique sua conexão e tente novamente.`,
      null,
    );
  } finally {
    clearTimeout(timeout);
  }

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = responseText;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(
        payload,
        `A API ${service} respondeu com erro (${response.status}).`,
      ),
      response.status,
    );
  }

  return payload;
}
