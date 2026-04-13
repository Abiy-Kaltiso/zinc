const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Origin used to resolve relative media file URLs returned by the backend
 * (e.g. "/media/documents/foo.pdf"). In production with R2, file URLs are
 * already absolute, so this helper is a no-op for those.
 */
export function resolveMediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = API_BASE.replace(/\/api\/v1\/?$/, "");
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

interface TokenPair {
  access: string;
  refresh: string;
}

function getTokens(): TokenPair | null {
  if (typeof window === "undefined") return null;
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  if (!access || !refresh) return null;
  return { access, refresh };
}

function setTokens(tokens: TokenPair) {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    setTokens({ access: data.access, refresh: data.refresh || tokens.refresh });
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // If 401, try refreshing the token
  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers["Authorization"] = `Bearer ${newAccess}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  return res;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const data = await res.json();
    setTokens(data);
    return data;
  },

  logout() {
    clearTokens();
  },

  isAuthenticated() {
    return !!getTokens()?.access;
  },

  // User
  async getMe() {
    const res = await apiFetch("/auth/me/");
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  },

  // Properties
  async getProperties() {
    const res = await apiFetch("/properties/");
    if (!res.ok) throw new Error("Failed to fetch properties");
    return res.json();
  },

  async getUnits(propertyId: number) {
    const res = await apiFetch(`/properties/${propertyId}/units/`);
    if (!res.ok) throw new Error("Failed to fetch units");
    return res.json();
  },

  async getMyUnits() {
    const res = await apiFetch("/properties/my-units/");
    if (!res.ok) throw new Error("Failed to fetch units");
    return res.json();
  },

  // Leases
  async getLeases(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await apiFetch(`/leases/${query}`);
    if (!res.ok) throw new Error("Failed to fetch leases");
    return res.json();
  },

  async getLease(id: number) {
    const res = await apiFetch(`/leases/${id}/`);
    if (!res.ok) throw new Error("Failed to fetch lease");
    return res.json();
  },

  async createLease(data: Record<string, unknown>) {
    const res = await apiFetch("/leases/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }
    return res.json();
  },

  async updateLease(id: number, data: Record<string, unknown>) {
    const res = await apiFetch(`/leases/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }
    return res.json();
  },

  async submitLease(id: number) {
    const res = await apiFetch(`/leases/${id}/submit/`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || JSON.stringify(err));
    }
    return res.json();
  },

  async reviewLease(id: number, decision: string, comments: string) {
    const res = await apiFetch(`/leases/${id}/review/`, {
      method: "POST",
      body: JSON.stringify({ decision, comments }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || JSON.stringify(err));
    }
    return res.json();
  },

  async activateLease(id: number) {
    const res = await apiFetch(`/leases/${id}/activate/`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || JSON.stringify(err));
    }
    return res.json();
  },

  async terminateLease(id: number, reason: string) {
    const res = await apiFetch(`/leases/${id}/terminate/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || JSON.stringify(err));
    }
    return res.json();
  },

  async getLeaseReviews(leaseId: number) {
    const res = await apiFetch(`/leases/${leaseId}/reviews/`);
    if (!res.ok) throw new Error("Failed to fetch reviews");
    return res.json();
  },

  async getExpiringLeases(days: number = 90) {
    const res = await apiFetch(`/leases/expiring/?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch expiring leases");
    return res.json();
  },

  // Amendments
  async getAmendments(leaseId: number) {
    const res = await apiFetch(`/leases/${leaseId}/amendments/`);
    if (!res.ok) throw new Error("Failed to fetch amendments");
    return res.json();
  },

  async createAmendment(leaseId: number, data: Record<string, unknown>) {
    const res = await apiFetch(`/leases/${leaseId}/amendments/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || JSON.stringify(err));
    }
    return res.json();
  },

  // Screening
  async getScreening(leaseId: number) {
    const res = await apiFetch(`/screening/leases/${leaseId}/`);
    if (!res.ok) throw new Error("Failed to fetch screening");
    return res.json();
  },

  async updateScreeningCheck(leaseId: number, checkId: number, data: Record<string, unknown>) {
    const res = await apiFetch(`/screening/leases/${leaseId}/checks/${checkId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update check");
    return res.json();
  },

  async verifyScreening(leaseId: number) {
    const res = await apiFetch(`/screening/leases/${leaseId}/verify/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to verify screening");
    return res.json();
  },

  async unverifyScreening(leaseId: number) {
    const res = await apiFetch(`/screening/leases/${leaseId}/unverify/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to unverify screening");
    return res.json();
  },

  async submitAttestation(leaseId: number, data: { confirmed: boolean; company: string; date: string }) {
    const res = await apiFetch(`/screening/leases/${leaseId}/attest/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || JSON.stringify(err));
    }
    return res.json();
  },

  async retractAttestation(leaseId: number) {
    const res = await apiFetch(`/screening/leases/${leaseId}/attest/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to retract attestation");
    return res.json();
  },

  // Documents
  async getLeaseDocuments(leaseId: number) {
    const res = await apiFetch(`/documents/lease/${leaseId}/`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    return res.json();
  },

  async uploadDocument(leaseId: number, formData: FormData) {
    const res = await apiFetch(`/documents/lease/${leaseId}/upload/`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload document");
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await apiFetch("/notifications/");
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  async getUnreadCount() {
    const res = await apiFetch("/notifications/unread-count/");
    if (!res.ok) throw new Error("Failed to fetch unread count");
    return res.json();
  },

  async markRead(id: number) {
    const res = await apiFetch(`/notifications/${id}/read/`, { method: "PATCH" });
    if (!res.ok) throw new Error("Failed to mark notification read");
    return res.json();
  },

  async markAllRead() {
    const res = await apiFetch("/notifications/mark-all-read/", { method: "POST" });
    if (!res.ok) throw new Error("Failed to mark all read");
    return res.json();
  },

  // Communications
  async getCommunications(leaseId: number) {
    const res = await apiFetch(`/notifications/leases/${leaseId}/communications/`);
    if (!res.ok) throw new Error("Failed to fetch communications");
    return res.json();
  },

  async sendCommunication(leaseId: number, message: string) {
    const res = await apiFetch(`/notifications/leases/${leaseId}/communications/`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  async updateCommunication(leaseId: number, msgId: number, message: string) {
    const res = await apiFetch(`/notifications/leases/${leaseId}/communications/${msgId}/`, {
      method: "PATCH",
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to update message");
    return res.json();
  },

  async deleteCommunication(leaseId: number, msgId: number) {
    const res = await apiFetch(`/notifications/leases/${leaseId}/communications/${msgId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete message");
  },

  // Reports
  async getDashboard() {
    const res = await apiFetch("/reports/dashboard/");
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    return res.json();
  },

  async getComplianceReport() {
    const res = await apiFetch("/reports/leases/compliance/");
    if (!res.ok) throw new Error("Failed to fetch compliance report");
    return res.json();
  },

  async getOccupancy() {
    const res = await apiFetch("/reports/occupancy/");
    if (!res.ok) throw new Error("Failed to fetch occupancy");
    return res.json();
  },

  getExportUrl(type: "csv") {
    return `${API_BASE}/reports/export/leases/${type}/`;
  },
};
