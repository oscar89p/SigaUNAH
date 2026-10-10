import { get } from "./http";
import type { HealthResponse } from "@/types/health";

export function getHealth(): Promise<HealthResponse> {
  return get<HealthResponse>("/health");
}
