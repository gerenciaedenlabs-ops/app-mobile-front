const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  if (!API_URL) throw new ApiError('EXPO_PUBLIC_API_URL no está configurada.', 0);

  const { token, headers, ...requestOptions } = options;
  let response: Response;
  try {
    response = await fetch(`${API_URL}/${path.replace(/^\//, '')}`, {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.', 0);
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.errors?.[0] ?? payload?.message ?? 'La solicitud no pudo completarse.',
      response.status,
    );
  }
  return payload.data;
}
