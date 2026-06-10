import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// URL del backend (funciona en local y con Docker porque los puertos están publicados)
export const API_URL = 'http://localhost:3000/api';

// Servicio central: un método por endpoint del backend
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ---------- Usuarios ----------
  getUsers(params: any = {}) { return this.http.get<any[]>(`${API_URL}/users`, { params }); }
  getPendingUsers() { return this.http.get<any[]>(`${API_URL}/users/pending`); }
  createUser(data: any) { return this.http.post<any>(`${API_URL}/users`, data); }
  bulkUsers(users: any[]) { return this.http.post<any>(`${API_URL}/users/bulk`, { users }); }
  approveUser(id: number) { return this.http.put<any>(`${API_URL}/users/${id}/approve`, {}); }
  updateUser(id: number, data: any) { return this.http.put<any>(`${API_URL}/users/${id}`, data); }
  deleteUser(id: number) { return this.http.delete<any>(`${API_URL}/users/${id}`); }

  // ---------- Clientes ----------
  getClients(params: any = {}) { return this.http.get<any>(`${API_URL}/clients`, { params }); }
  createClient(data: any) { return this.http.post<any>(`${API_URL}/clients`, data); }
  bulkClients(clients: any[]) { return this.http.post<any>(`${API_URL}/clients/bulk`, { clients }); }
  updateClient(id: number, data: any) { return this.http.put<any>(`${API_URL}/clients/${id}`, data); }
  deleteClient(id: number) { return this.http.delete<any>(`${API_URL}/clients/${id}`); }

  // ---------- Turnos ----------
  getTurns(params: any = {}) { return this.http.get<any[]>(`${API_URL}/turns`, { params }); }
  getTurnStats() { return this.http.get<any>(`${API_URL}/turns/stats/today`); }
  createTurn(data: any) { return this.http.post<any>(`${API_URL}/turns`, data); }
  attendTurn(id: number, data: any = {}) { return this.http.put<any>(`${API_URL}/turns/${id}/attend`, data); }
  deleteTurn(id: number) { return this.http.delete<any>(`${API_URL}/turns/${id}`); }

  // ---------- Contratos y pagos ----------
  getContracts(params: any = {}) { return this.http.get<any[]>(`${API_URL}/contracts`, { params }); }
  createContract(data: any) { return this.http.post<any>(`${API_URL}/contracts`, data); }
  changeService(id: number, service_serviceid: number) { return this.http.put<any>(`${API_URL}/contracts/${id}/change-service`, { service_serviceid }); }
  changePaymentMethod(id: number, methodpayment_methodpaymentid: number) { return this.http.put<any>(`${API_URL}/contracts/${id}/payment-method`, { methodpayment_methodpaymentid }); }
  cancelContract(id: number) { return this.http.put<any>(`${API_URL}/contracts/${id}/cancel`, {}); }
  getPayments(params: any = {}) { return this.http.get<any[]>(`${API_URL}/payments`, { params }); }
  createPayment(data: any) { return this.http.post<any>(`${API_URL}/payments`, data); }

  // ---------- Catálogos y cajas ----------
  getRoles() { return this.http.get<any[]>(`${API_URL}/catalogs/roles`); }
  getUserStatuses() { return this.http.get<any[]>(`${API_URL}/catalogs/userstatuses`); }
  getServices() { return this.http.get<any[]>(`${API_URL}/catalogs/services`); }
  getMethodPayments() { return this.http.get<any[]>(`${API_URL}/catalogs/methodpayments`); }
  getAttentionTypes() { return this.http.get<any[]>(`${API_URL}/catalogs/attentiontypes`); }
  getCashes() { return this.http.get<any[]>(`${API_URL}/catalogs/cashes`); }
  getCajeros() { return this.http.get<any[]>(`${API_URL}/catalogs/cajeros`); }
  assignCajero(cashId: number, user_userid: number) { return this.http.post<any>(`${API_URL}/catalogs/cashes/${cashId}/assign`, { user_userid }); }
  openCash(cashId: number) { return this.http.post<any>(`${API_URL}/catalogs/cashes/${cashId}/open`, {}); }
  closeCash(cashId: number) { return this.http.post<any>(`${API_URL}/catalogs/cashes/${cashId}/close`, {}); }

  // ---------- Dashboard y menú ----------
  getDashboardUsers() { return this.http.get<any>(`${API_URL}/dashboard/users`); }
  getDashboardSummary(params: any = {}) { return this.http.get<any>(`${API_URL}/dashboard/summary`, { params }); }
  getMenu() { return this.http.get<any[]>(`${API_URL}/menu`); }
}
