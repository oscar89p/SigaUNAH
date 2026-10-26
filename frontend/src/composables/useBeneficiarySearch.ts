import { onUnmounted, ref, watch } from "vue";
import { ApiError } from "@/services/http";
import { searchBeneficiaries, type BeneficiarySearchResult } from "@/services/beneficiarios";

export function useBeneficiarySearch() {
  const search = ref(""); const results = ref<BeneficiarySearchResult[]>([]); const resultPage = ref(1); const resultPages = ref(0); const resultPagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 }); const resultLoading = ref(false); const resultError = ref("");
  let searchTimer: ReturnType<typeof setTimeout> | undefined; let searchController: AbortController | undefined; let searchSequence = 0;
  const message = (cause: unknown) => cause instanceof ApiError ? cause.message : "Ocurrió un error inesperado";
  async function findBeneficiaries(page = 1) {
    if (search.value.trim().length < 2) { results.value = []; resultPagination.value = { page: 1, pageSize: 10, total: 0, totalPages: 0 }; resultPages.value = 0; return; }
    searchController?.abort(); const controller = new AbortController(); searchController = controller; const sequence = ++searchSequence; resultLoading.value = true; resultError.value = "";
    try { const response = await searchBeneficiaries(search.value.trim(), page, controller.signal); if (sequence !== searchSequence) return; results.value = response.items; resultPage.value = response.pagination.page; resultPages.value = response.pagination.totalPages; resultPagination.value = response.pagination; }
    catch (cause) { if ((cause as Error).name !== "AbortError") resultError.value = message(cause); }
    finally { if (sequence === searchSequence) resultLoading.value = false; }
  }
  function scheduleSearch() { clearTimeout(searchTimer); searchTimer = setTimeout(() => void findBeneficiaries(1), 350); }
  function searchNow() { clearTimeout(searchTimer); void findBeneficiaries(1); }
  function clearSearch() { clearTimeout(searchTimer); searchController?.abort(); search.value = ""; results.value = []; resultError.value = ""; resultPagination.value = { page: 1, pageSize: 10, total: 0, totalPages: 0 }; resultPages.value = 0; }
  watch(search, scheduleSearch);
  onUnmounted(() => { clearTimeout(searchTimer); searchController?.abort(); });
  return { search, results, resultPage, resultPages, resultPagination, resultLoading, resultError, findBeneficiaries, searchNow, clearSearch };
}
