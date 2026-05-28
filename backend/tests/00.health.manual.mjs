// ======================================================
// PATH: backend/tests/00.health.manual.mjs
// Pruebas manuales detalladas - Health NominaCes
// ======================================================

import {
  BASE_URL,
  assertCondition,
  assertError,
  assertSuccess,
  createResultStore,
  info,
  isDirectRun,
  printResults,
  request,
  runTest,
  title,
} from "./_testKit.mjs";

const results = createResultStore();

async function testHealthOk() {
  const response = await request("GET", "/health");

  assertSuccess(response, 200);

  assertCondition(
    response.data?.data?.service === "NominaCes Backend",
    "service debe ser NominaCes Backend."
  );

  assertCondition(
    response.data?.data?.status === "OK",
    "status debe ser OK."
  );

  assertCondition(
    typeof response.data?.data?.secureCookies === "boolean",
    "secureCookies debe venir como boolean."
  );

  return {
    response,
    detail: "Backend vivo y respondiendo correctamente.",
  };
}

async function testUnknownRoute() {
  const response = await request("GET", "/ruta-que-no-existe");

  assertError(response, 404, "NOT_FOUND", "Ruta no encontrada");

  return {
    response,
    detail: "Fallback global 404 funciona correctamente.",
  };
}

export async function runAll() {
  results.reset();

  title("NOMINACES - 00 HEALTH");
  info("Base URL:", BASE_URL);

  await runTest(results, {
    name: "Backend vivo",
    before: "El backend debe estar levantado con npm run dev.",
    action: "GET /health",
    expected:
      "Debe responder HTTP 200, ok=true, data.service='NominaCes Backend' y data.status='OK'.",
    expectedResponse: {
      ok: true,
      data: {
        service: "NominaCes Backend",
        status: "OK",
        environment: "development | production | test",
        secureCookies: "boolean",
      },
    },
    fn: testHealthOk,
  });

  await runTest(results, {
    name: "Ruta inexistente",
    before: "El backend debe tener registrado el fallback global de rutas inexistentes.",
    action: "GET /ruta-que-no-existe",
    expected:
      "Debe responder HTTP 404, ok=false, error.code='NOT_FOUND' y mensaje con la ruta.",
    expectedResponse: {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Ruta no encontrada: GET /ruta-que-no-existe",
      },
    },
    fn: testUnknownRoute,
  });

  printResults(results, "RESULTADOS HEALTH");

  return {
    passed: !results.hasFailed(),
    failed: results.hasFailed(),
    total: results.all().length,
  };
}

if (isDirectRun(import.meta.url)) {
  await runAll();
  process.exitCode = results.hasFailed() ? 1 : 0;
}