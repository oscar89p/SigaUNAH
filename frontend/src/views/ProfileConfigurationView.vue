<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useNavigation } from "@/composables/useNavigation";
import { getAdminProfile, getProfileNavigationIds, getProfilePermissionIds, listNavigations, listPermissions, listProfileUsers, setProfileNavigations, setProfilePermissions, updateAdminProfile, type Navigation, type Permission, type Profile } from "@/services/administracion";

type Tab = "general" | "users" | "permissions" | "navigation";
const route = useRoute();
const navigation = useNavigation();
const profileId = Number(route.params.id);
const profile = ref<Profile | null>(null); const activeTab = ref<Tab>("general");
const loadingProfile = ref(false); const loading = ref(false); const saving = ref(false); const error = ref(""); const success = ref("");
const form = ref({ codigoPerfil: "", nombrePerfil: "", descripcionPerfil: "" });
const users = ref<Array<{ idUsuario: number; nombreUsuario: string; nombreAcceso: string; correoElectronico: string; estadoUsuario: boolean }>>([]);
const userSearch = ref(""); const userPage = ref(1); const userPagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
const permissions = ref<Permission[]>([]); const navigationItems = ref<Navigation[]>([]); const selectedPermissionIds = ref<number[]>([]); const selectedNavigationIds = ref<number[]>([]);
const tabLabels = computed(() => [
  { id: "general" as const, label: "General" },
  { id: "users" as const, label: "Usuarios" },
  { id: "permissions" as const, label: "Permisos" },
  { id: "navigation" as const, label: "Navegación" }
]);
const message = (cause: unknown) => cause instanceof Error ? cause.message : "Ocurrió un error inesperado";

async function loadProfile() {
  loadingProfile.value = true; error.value = "";
  try { profile.value = await getAdminProfile(profileId); form.value = { codigoPerfil: profile.value.codigoPerfil, nombrePerfil: profile.value.nombrePerfil, descripcionPerfil: profile.value.descripcionPerfil ?? "" }; }
  catch (cause) { error.value = message(cause); }
  finally { loadingProfile.value = false; }
}
async function loadUsers() {
  loading.value = true; error.value = "";
  try { const result = await listProfileUsers(profileId, { page: userPage.value, pageSize: 10, search: userSearch.value, estado: "all" }); users.value = result.items; userPagination.value = result.pagination; }
  catch (cause) { error.value = message(cause); }
  finally { loading.value = false; }
}
async function loadPermissions() {
  loading.value = true; error.value = "";
  try { const [catalog, assigned] = await Promise.all([listPermissions({ page: 1, pageSize: 100, estado: "active" }), getProfilePermissionIds(profileId)]); permissions.value = catalog.items; selectedPermissionIds.value = assigned; }
  catch (cause) { error.value = message(cause); }
  finally { loading.value = false; }
}
async function loadNavigation() {
  loading.value = true; error.value = "";
  try { const [catalog, assigned] = await Promise.all([listNavigations({ page: 1, pageSize: 100, estado: "active" }), getProfileNavigationIds(profileId)]); navigationItems.value = catalog.items; selectedNavigationIds.value = assigned.filter(id => catalog.items.some(item => item.idNavegacion === id)); }
  catch (cause) { error.value = message(cause); }
  finally { loading.value = false; }
}
async function selectTab(tab: Tab) {
  activeTab.value = tab; success.value = "";
  if (tab === "users") await loadUsers();
  if (tab === "permissions") await loadPermissions();
  if (tab === "navigation") await loadNavigation();
}
async function saveGeneral() {
  if (!profile.value) return;
  saving.value = true; error.value = ""; success.value = "";
  try { await updateAdminProfile(profileId, { codigoPerfil: form.value.codigoPerfil.trim(), nombrePerfil: form.value.nombrePerfil.trim(), descripcionPerfil: form.value.descripcionPerfil.trim() || null }); success.value = "Información general actualizada."; await loadProfile(); }
  catch (cause) { error.value = message(cause); }
  finally { saving.value = false; }
}
async function savePermissions() {
  if (!window.confirm("¿Confirma guardar los permisos seleccionados para este perfil?")) return;
  saving.value = true; error.value = ""; success.value = "";
  try { await setProfilePermissions(profileId, selectedPermissionIds.value); success.value = "Permisos actualizados."; await loadProfile(); }
  catch (cause) { error.value = message(cause); }
  finally { saving.value = false; }
}
function navigationDepth(item: Navigation): number {
  let depth = 0; let parentId = item.idNavegacionPadre; const seen = new Set<number>();
  while (parentId && !seen.has(parentId)) { seen.add(parentId); depth++; parentId = navigationItems.value.find(candidate => candidate.idNavegacion === parentId)?.idNavegacionPadre ?? null; }
  return depth;
}
function toggleNavigation(item: Navigation, checked: boolean) {
  const selected = new Set(selectedNavigationIds.value);
  if (checked) {
    selected.add(item.idNavegacion);
    let parentId = item.idNavegacionPadre;
    while (parentId) { selected.add(parentId); parentId = navigationItems.value.find(candidate => candidate.idNavegacion === parentId)?.idNavegacionPadre ?? null; }
  } else {
    selected.delete(item.idNavegacion);
    const isDescendant = (candidate: Navigation): boolean => {
      let parentId = candidate.idNavegacionPadre; const seen = new Set<number>();
      while (parentId && !seen.has(parentId)) { if (parentId === item.idNavegacion) return true; seen.add(parentId); parentId = navigationItems.value.find(option => option.idNavegacion === parentId)?.idNavegacionPadre ?? null; }
      return false;
    };
    navigationItems.value.filter(isDescendant).forEach(child => selected.delete(child.idNavegacion));
  }
  selectedNavigationIds.value = [...selected];
}
async function saveNavigation() {
  if (!window.confirm("¿Confirma guardar las opciones de navegación seleccionadas?")) return;
  saving.value = true; error.value = ""; success.value = "";
  try { await setProfileNavigations(profileId, selectedNavigationIds.value); await navigation.load(true); success.value = "Navegación actualizada."; await loadProfile(); }
  catch (cause) { error.value = message(cause); }
  finally { saving.value = false; }
}
async function changeUserPage(page: number) { userPage.value = page; await loadUsers(); }
onMounted(() => { void loadProfile(); });
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Administración' }, { label: 'Perfiles', to: '/administracion/perfiles' }, { label: profile?.nombrePerfil ?? 'Configurar perfil' }]" />
  <div class="bo-page-head"><div><p class="bo-eyebrow">Administración · Seguridad</p><h1>Configuración de perfil</h1><p v-if="profile"><strong>{{ profile.codigoPerfil }}</strong> · {{ profile.nombrePerfil }}</p><p v-else>Gestione información y relaciones del perfil.</p></div><RouterLink class="bo-btn" to="/administracion/perfiles">Volver a perfiles</RouterLink></div>
  <div v-if="error" class="bo-state-error bo-profile-config-error" role="alert">{{ error }} <button class="bo-link" @click="activeTab === 'general' ? loadProfile() : selectTab(activeTab)">Reintentar</button></div>
  <div v-if="success" class="bo-notice bo-notice-success" role="status">{{ success }}</div>
  <div class="bo-profile-tabs" role="tablist" aria-label="Configuración del perfil">
    <button v-for="tab in tabLabels" :key="tab.id" type="button" role="tab" :aria-selected="activeTab === tab.id" :class="{ active: activeTab === tab.id }" @click="selectTab(tab.id)">{{ tab.label }}<span v-if="profile && tab.id === 'users'">{{ profile.usuarios }}</span><span v-if="profile && tab.id === 'permissions'">{{ profile.permisos }}</span></button>
  </div>

  <section v-if="activeTab === 'general'" class="bo-card bo-profile-tab-panel" role="tabpanel">
    <header class="bo-section-head"><div><h2>Información general</h2><p>Datos básicos y estado del perfil.</p></div><StatusBadge v-if="profile" :active="profile.estadoPerfil" /></header>
    <div v-if="loadingProfile" class="bo-state" role="status">Cargando perfil...</div>
    <form v-else-if="profile" class="bo-form bo-profile-general" @submit.prevent="saveGeneral"><div class="bo-form-grid"><label>Código<input v-model="form.codigoPerfil" maxlength="30" pattern="[A-Za-z0-9_-]+" required /></label><label>Nombre<input v-model="form.nombrePerfil" maxlength="100" required /></label><label class="bo-form-wide">Descripción<textarea v-model="form.descripcionPerfil" maxlength="500" rows="3" /></label></div><footer class="bo-form-actions"><button class="bo-btn bo-btn-primary" type="submit" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar cambios' }}</button></footer></form>
  </section>

  <section v-else-if="activeTab === 'users'" class="bo-card bo-profile-tab-panel" role="tabpanel"><header class="bo-section-head"><div><h2>Usuarios asociados</h2><p>Usuarios con una asignación activa a este perfil.</p></div></header><form class="bo-toolbar" @submit.prevent="userPage = 1; loadUsers()"><input v-model="userSearch" placeholder="Buscar nombre, acceso o correo..." aria-label="Buscar usuarios asociados" /><button class="bo-btn bo-btn-primary">Buscar</button></form><div v-if="loading" class="bo-state">Cargando usuarios...</div><div v-else-if="!users.length" class="bo-state"><strong>No hay usuarios asociados para esta búsqueda.</strong></div><div v-else class="bo-table-wrap bo-profile-related-table"><table><thead><tr><th>Usuario</th><th>Nombre de acceso</th><th>Correo</th><th>Estado</th></tr></thead><tbody><tr v-for="user in users" :key="user.idUsuario"><td>{{ user.nombreUsuario }}</td><td>{{ user.nombreAcceso }}</td><td>{{ user.correoElectronico }}</td><td>{{ user.estadoUsuario ? 'Activo' : 'Inactivo' }}</td></tr></tbody></table></div><footer class="bo-pagination"><span>{{ userPagination.total }} usuarios · Página {{ userPagination.page }} de {{ Math.max(userPagination.totalPages, 1) }}</span><div><button class="bo-page-button" :disabled="userPage <= 1 || loading" @click="changeUserPage(userPage - 1)">Anterior</button><button class="bo-page-button" :disabled="userPage >= userPagination.totalPages || loading" @click="changeUserPage(userPage + 1)">Siguiente</button></div></footer></section>

  <section v-else-if="activeTab === 'permissions'" class="bo-card bo-profile-tab-panel" role="tabpanel"><header class="bo-section-head"><div><h2>Permisos</h2><p>Los cambios se aplican sobre el catálogo operativo validado por el backend.</p></div></header><div v-if="loading" class="bo-state">Cargando permisos...</div><div v-else-if="!permissions.length" class="bo-state">No hay permisos operativos activos para asignar.</div><div v-else class="bo-profile-assignment-list"><label v-for="permission in permissions" :key="permission.idPermiso"><input v-model="selectedPermissionIds" type="checkbox" :value="permission.idPermiso" /><span><strong>{{ permission.codigoPermiso }} · {{ permission.nombrePermiso }}</strong><small>{{ permission.moduloPermiso }} · {{ permission.descripcionPermiso || 'Sin descripción' }}</small></span></label></div><footer v-if="!loading" class="bo-profile-assignment-footer"><span>{{ selectedPermissionIds.length }} permisos seleccionados</span><button class="bo-btn bo-btn-primary" :disabled="saving" @click="savePermissions">{{ saving ? 'Guardando...' : 'Guardar permisos' }}</button></footer></section>

  <section v-else class="bo-card bo-profile-tab-panel" role="tabpanel"><header class="bo-section-head"><div><h2>Navegación</h2><p>Seleccione opciones. Al marcar un elemento se incluyen sus padres para conservar la jerarquía del menú.</p></div></header><div v-if="loading" class="bo-state">Cargando navegación...</div><div v-else-if="!navigationItems.length" class="bo-state">No hay opciones de navegación activas.</div><div v-else class="bo-profile-assignment-list bo-profile-navigation-list"><label v-for="item in navigationItems" :key="item.idNavegacion" :style="{ '--nav-depth': navigationDepth(item) }"><input type="checkbox" :checked="selectedNavigationIds.includes(item.idNavegacion)" @change="toggleNavigation(item, ($event.target as HTMLInputElement).checked)" /><span><strong>{{ item.tituloPadre ? `${item.tituloPadre} / ` : '' }}{{ item.tituloNavegacion }}</strong><small>{{ item.codigoNavegacion }} · {{ item.enlaceNavegacion || 'Grupo de navegación' }}</small></span></label></div><footer v-if="!loading" class="bo-profile-assignment-footer"><span>{{ selectedNavigationIds.length }} opciones seleccionadas</span><button class="bo-btn bo-btn-primary" :disabled="saving" @click="saveNavigation">{{ saving ? 'Guardando...' : 'Guardar navegación' }}</button></footer></section>
</template>

<style scoped>
.bo-profile-config-error { margin-bottom: 12px; padding: 12px 14px; border: 1px solid #e4bebe; border-radius: 7px; background: #fff1f1; font-size: 12px; }
.bo-profile-tabs { display: flex; gap: 4px; overflow-x: auto; margin-bottom: 12px; padding: 4px; border: 1px solid var(--bo-line); border-radius: 9px; background: #fff; }
.bo-profile-tabs button { display: inline-flex; align-items: center; gap: 7px; padding: 9px 13px; border: 0; border-radius: 6px; color: var(--bo-muted); background: transparent; cursor: pointer; font-size: 12px; font-weight: 700; white-space: nowrap; }
.bo-profile-tabs button.active { color: var(--bo-dark); background: #e8f2f7; }
.bo-profile-tabs button span { min-width: 18px; padding: 2px 5px; border-radius: 999px; background: #edf1f3; font-size: 10px; text-align: center; }
.bo-profile-tab-panel { min-width: 0; }
.bo-section-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px 14px; border-bottom: 1px solid var(--bo-line); }
.bo-section-head h2 { margin: 0; color: var(--bo-dark); font-size: 17px; }.bo-section-head p { margin: 4px 0 0; color: var(--bo-muted); font-size: 11px; }
.bo-profile-general { padding: 18px; }.bo-profile-general textarea { box-sizing: border-box; width: 100%; padding: 9px 10px; border: 1px solid var(--bo-line); border-radius: 6px; font: inherit; }
.bo-profile-related-table table { min-width: 0; table-layout: fixed; }.bo-profile-related-table td { overflow-wrap: anywhere; white-space: normal; }
.bo-profile-assignment-list { display: grid; gap: 7px; max-height: min(60vh, 620px); overflow-y: auto; padding: 14px; }
.bo-profile-assignment-list label { display: flex; align-items: flex-start; gap: 10px; min-width: 0; padding: 10px; border: 1px solid var(--bo-line); border-radius: 7px; cursor: pointer; }
.bo-profile-assignment-list span { display: grid; min-width: 0; gap: 4px; }.bo-profile-assignment-list strong { color: var(--bo-dark); font-size: 12px; overflow-wrap: anywhere; }.bo-profile-assignment-list small { color: var(--bo-muted); font-size: 11px; line-height: 1.4; overflow-wrap: anywhere; }
.bo-profile-navigation-list label { margin-left: calc(var(--nav-depth, 0) * 18px); }
.bo-profile-assignment-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 14px; border-top: 1px solid var(--bo-line); color: var(--bo-muted); font-size: 11px; }
@media (max-width: 680px) { .bo-profile-related-table table { min-width: 580px; }.bo-profile-assignment-footer { align-items: flex-start; flex-direction: column; } }
</style>
