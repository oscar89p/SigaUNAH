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
import LoginView from "@/views/LoginView.vue";
import { useAuthSession } from "@/composables/useAuthSession";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
    {
      path: "/",
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", name: "dashboard", component: DashboardView },
        { path: "campus", name: "campus", component: CampusView },
        { path: "edificios", name: "edificios", component: BuildingsView },
        { path: "elevadores", name: "elevadores", component: ElevatorsView },
        { path: "dispositivos", name: "dispositivos", component: DevicesView },
        { path: "beneficiarios", name: "beneficiarios", component: BeneficiariosView },
        { path: "solicitudes", name: "solicitudes", component: SolicitudesView },
        { path: "tarjetas", name: "tarjetas", component: TarjetasView }
      ]
    }
  ]
});

router.beforeEach((to) => {
  const session = useAuthSession();
  session.restore();
  if (to.meta.guestOnly && session.isAuthenticated.value) return "/";
  if (to.matched.some((record) => record.meta.requiresAuth) && !session.isAuthenticated.value) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
});

export default router;
