import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "@/layouts/AdminLayout.vue";
import DashboardView from "@/views/DashboardView.vue";
import CampusView from "@/views/CampusView.vue";
import BuildingsView from "@/views/BuildingsView.vue";
import ElevatorsView from "@/views/ElevatorsView.vue";
import DevicesView from "@/views/DevicesView.vue";
import BeneficiariosView from "@/views/BeneficiariosView.vue";
import SolicitudesView from "@/views/SolicitudesView.vue";
import TarjetasView from "@/views/TarjetasView.vue";
import GestionTarjetaView from "@/views/GestionTarjetaView.vue";
import LoginView from "@/views/LoginView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import AccessDeniedView from "@/views/AccessDeniedView.vue";
import UsersView from "@/views/UsersView.vue";
import ProfilesView from "@/views/ProfilesView.vue";
import ProfileConfigurationView from "@/views/ProfileConfigurationView.vue";
import PermissionsView from "@/views/PermissionsView.vue";
import NavigationAdminView from "@/views/NavigationAdminView.vue";
import ConfigurationView from "@/views/ConfigurationView.vue";
import CatalogsView from "@/views/CatalogsView.vue";
import AuditView from "@/views/AuditView.vue";
import MonitoringView from "@/views/MonitoringView.vue";
import ReportsView from "@/views/ReportsView.vue";
import MyInformationView from "@/views/MyInformationView.vue";
import MyCardView from "@/views/MyCardView.vue";
import { useAuthSession } from "@/composables/useAuthSession";
import { useNavigation } from "@/composables/useNavigation";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
    {
      path: "/",
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", redirect: "/inicio" },
        { path: "inicio", name: "dashboard", component: DashboardView },
        { path: "campus", name: "campus", component: CampusView },
        { path: "edificios", name: "edificios", component: BuildingsView },
        { path: "elevadores", name: "elevadores", component: ElevatorsView },
        { path: "dispositivos", name: "dispositivos", component: DevicesView },
        { path: "beneficiarios", name: "beneficiarios", component: BeneficiariosView },
        { path: "solicitudes", name: "solicitudes", component: SolicitudesView },
        { path: "tarjetas", name: "tarjetas", component: TarjetasView },
        { path: "tarjetas/:id/gestionar", name: "gestionar-tarjeta", component: GestionTarjetaView, meta: { navigationPath: "/tarjetas" } },
        { path: "monitoreo", name: "monitoreo", component: MonitoringView, meta: { requiredPermission: "ACCESOS_HISTORIAL" } },
        { path: "reportes", name: "reportes", component: ReportsView, meta: { requiredPermission: "REPORTES_CONSULTAR" } },
        { path: "mi-cuenta/informacion", name: "mi-informacion", component: MyInformationView },
        { path: "mi-cuenta/tarjeta", name: "mi-tarjeta", component: MyCardView },
        { path: "administracion/usuarios", name: "usuarios", component: UsersView },
        { path: "administracion/perfiles", name: "perfiles", component: ProfilesView, meta: { requiredPermission: "PERFILES_ADMINISTRAR" } },
        { path: "administracion/perfiles/:id/configuracion", name: "configuracion-perfil", component: ProfileConfigurationView, meta: { requiredPermission: "PERFILES_ADMINISTRAR" } },
        { path: "administracion/permisos", name: "permisos", component: PermissionsView, meta: { requiredPermission: "PERMISOS_ADMINISTRAR" } },
        { path: "administracion/navegaciones", name: "navegaciones", component: NavigationAdminView, meta: { requiredPermission: "NAVEGACION_ADMINISTRAR" } },
        { path: "administracion/configuracion", name: "configuracion", component: ConfigurationView, meta: { requiredPermission: "CONFIGURACION_ADMINISTRAR" } },
        { path: "administracion/configuracion/catalogos", name: "catalogos", component: CatalogsView, meta: { requiredPermission: "CONFIGURACION_ADMINISTRAR" } },
        { path: "administracion/auditoria", name: "auditoria", component: AuditView, meta: { requiredPermission: "AUDITORIA_CONSULTAR" } }
      ]
    },
    { path: "/acceso-denegado", name: "acceso-denegado", component: AccessDeniedView, meta: { requiresAuth: true } },
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView, meta: { requiresAuth: true } }
  ]
});

router.beforeEach(async (to) => {
  const session = useAuthSession();
  const navigation = useNavigation();
  await session.restore();
  if (to.meta.guestOnly && session.isAuthenticated.value) return "/";
  if (to.matched.some((record) => record.meta.requiresAuth) && !session.isAuthenticated.value) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    try { await navigation.load(); } catch { session.expire(); return { path: "/login", query: { redirect: to.fullPath } }; }
    const requiredPermission = to.meta.requiredPermission;
    if (to.name === "acceso-denegado" || to.name === "not-found") return;
    if (typeof requiredPermission === "string" && !session.user.value?.permissions.includes(requiredPermission)) {
      const first = navigation.flatItems.value.find((item) => item.enlaceNavegacion);
      return first?.enlaceNavegacion && first.enlaceNavegacion !== to.path ? first.enlaceNavegacion : "/login";
    }
    if (typeof requiredPermission === "string") return;
    const navigationPath = typeof to.meta.navigationPath === "string" ? to.meta.navigationPath : to.path;
    if (!navigation.canAccess(navigationPath)) {
      return { path: "/acceso-denegado", query: { from: to.fullPath } };
    }
  }
});

export default router;
