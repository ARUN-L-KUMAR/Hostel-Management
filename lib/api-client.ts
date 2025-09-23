// API client utilities for frontend components
export class ApiClient {
  private static baseUrl = "/api"

  static async get(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }

  static async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }

  static async put(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }

  static async delete(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }

  // Specific API methods
  static students = {
    getAll: (filters?: { hostel?: string; year?: string; status?: string; isMando?: string; search?: string }) => this.get("/students", filters),
    getById: (id: string) => this.get(`/students/${id}`),
    create: (data: any) => this.post("/students", data),
    update: (id: string, data: any) => this.put(`/students/${id}`, data),
    delete: (id: string) => this.delete(`/students/${id}`),
  }

  static attendance = {
    get: (month: number, year: number) => this.get("/attendance", { month: month.toString(), year: year.toString() }),
    update: (data: any) => this.post("/attendance", data),
    bulkUpdate: (updates: any[]) => this.post("/attendance/bulk", { updates }),
  }

  static provisions = {
    getAll: () => this.get("/provisions"),
    create: (data: any) => this.post("/provisions", data),
  }

  static billing = {
    calculate: (data: any) => this.post("/billing/calculate", data),
    publish: (data: any) => this.post("/billing/publish", data),
  }

  static reports = {
    monthly: (month: number, year: number) =>
      this.get("/reports/monthly", { month: month.toString(), year: year.toString() }),
  }
}
