export interface Campus {
  idCampus: number;
  codigoCampus: string;
  nombreCampus: string;
  estadoCampus: boolean;
  usuarioRegistro: string;
  fechaRegistro: string;
  usuarioActualizacion: string | null;
  fechaActualizacion: string | null;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
