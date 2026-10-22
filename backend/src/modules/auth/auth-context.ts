import type { FastifyRequest } from "fastify";

export interface AuthContext { idUsuario: number; nombreAcceso: string; nombreUsuario: string; perfiles: string[]; permisos: string[]; }
export type AuthenticatedRequest = FastifyRequest & { auth: AuthContext };
