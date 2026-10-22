export interface NavigationItem {
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
  children: NavigationItem[];
}
