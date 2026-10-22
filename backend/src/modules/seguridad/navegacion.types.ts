export interface NavigationRow {
  idNavegacion: number;
  codigoNavegacion: string;
  nombreNavegacion: string;
  tituloNavegacion: string;
  descripcionNavegacion: string | null;
  tipoNavegacion: string;
  enlaceNavegacion: string | null;
  claseNavegacion: string | null;
  ordenNavegacion: number;
  idNavegacionPadre: number | null;
}

export interface NavigationItem extends NavigationRow {
  children: NavigationItem[];
}
