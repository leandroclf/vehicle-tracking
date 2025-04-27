import { useAuth } from "./auth"; // Assuming auth.ts is in the same lib folder

/**
 * Utility function to make authenticated API requests.
 * Automatically adds the JWT token to the Authorization header.
 *
 * @param url - The API endpoint URL.
 * @param options - Optional fetch options (method, body, etc.).
 * @param token - The JWT token from AuthContext.
 * @returns The fetch Response object.
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
  token: string | null
): Promise<Response> => {
  const headers = new Headers(options.headers || {});

  // Add Authorization header if token exists
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure Content-Type is set for POST/PUT/PATCH requests with body
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // Make the fetch request
  const response = await fetch(url, fetchOptions);

  // Optional: Handle common error cases like 401 Unauthorized globally?
  // if (response.status === 401) {
  //   // Token might be expired or invalid, trigger logout?
  //   // const { logout } = useAuth(); // Cannot use hook here directly
  //   // Consider triggering a custom event or using a different pattern
  //   console.error("Unauthorized request to", url);
  // }

  return response;
};

// Example usage within a component:
/*
import { useAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/lib/apiClient";

function MyComponent() {
  const { token, logout } = useAuth();

  const fetchData = async () => {
    try {
      const response = await fetchWithAuth("/api/vehicles", {}, token);
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized, maybe logout user
          logout();
          throw new Error("Não autorizado");
        }
        throw new Error("Falha ao buscar dados");
      }
      const data = await response.json();
      // Process data
    } catch (error) {
      console.error(error);
    }
  };

  // ... rest of component
}
*/

