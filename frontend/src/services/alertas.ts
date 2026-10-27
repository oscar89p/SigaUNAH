import { get } from "./http";

export interface AlertThresholds { pendingMediumDays: number; pendingHighDays: number; assignmentUpcomingDays: number; approvedWithoutAssignmentDays: number }
export interface AlertSummary { thresholds: AlertThresholds; totals: { solicitudesPendientes: number | string; aprobadasSinAsignacion: number | string; asignacionesProximas: number | string; asignacionesVencidas: number | string; inconsistenciasOperativas: number | string } }
export interface AlertPage { items: Array<Record<string, unknown>>; pagination: { page: number; pageSize: number; total: number; totalPages: number } }
export type AlertType = "pending" | "approved" | "upcoming" | "expired" | "inconsistency";

const paths: Record<AlertType, string> = { pending: "solicitudes-pendientes", approved: "aprobadas-sin-asignacion", upcoming: "asignaciones-proximas", expired: "asignaciones-vencidas", inconsistency: "inconsistencias" };
function query(page: number, search: string) { const params = new URLSearchParams({ page: String(page), pageSize: "10", search }); return `?${params}`; }
export const getAlertSummary = () => get<AlertSummary>("/api/v1/alertas/resumen");
export const listAlerts = (type: AlertType, page = 1, search = "") => get<AlertPage>(`/api/v1/alertas/${paths[type]}${query(page, search)}`);
