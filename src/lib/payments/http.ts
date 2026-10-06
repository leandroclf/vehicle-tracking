export async function gatewayFetch<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.text();
  if (!response.ok) throw new Error(`payment_gateway_http_${response.status}: ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) as T : {} as T;
}
export function formBody(values: Record<string, string | number | boolean | undefined>): URLSearchParams {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) body.set(key, String(value));
  return body;
}
