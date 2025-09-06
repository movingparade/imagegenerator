export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  return res;
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiRequest("GET", url);
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(result.error?.message || "API request failed");
  }
  
  return result.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiRequest("POST", url, data);
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(result.error?.message || "API request failed");
  }
  
  return result.data;
}

export async function apiPatch<T>(url: string, data: unknown): Promise<T> {
  const response = await apiRequest("PATCH", url, data);
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(result.error?.message || "API request failed");
  }
  
  return result.data;
}

export async function apiDelete(url: string): Promise<void> {
  const response = await apiRequest("DELETE", url);
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(result.error?.message || "API request failed");
  }
}
