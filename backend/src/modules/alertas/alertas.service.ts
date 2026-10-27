import * as repository from "./alertas.repository.js";

export const summary = repository.summary;
export const listPending = repository.listPending;
export const listApprovedWithoutAssignment = repository.listApprovedWithoutAssignment;
export const listUpcoming = repository.listUpcoming;
export const listExpired = repository.listExpired;
export const listInconsistencies = repository.listInconsistencies;
