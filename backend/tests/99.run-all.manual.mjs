// ======================================================
// PATH: backend/tests/99.run-all.manual.mjs
// Runner general de pruebas manuales NominaCes
// Ejecuta todas las validaciones desde 1 en orden.
// ======================================================

import {
  BASE_URL,
  ADMIN_USER,
  colors,
  info,
  isDirectRun,
  line,
  paint,
  title,
} from "./_testKit.mjs";

import { runAll as runHealth } from "./00.health.manual.mjs";
import { runAll as runLogin } from "./01.login.manual.mjs";
import { runAll as runRoles } from "./02.roles.manual.mjs";
import { runAll as runUsers } from "./03.users.manual.mjs";

/**
 * Orden oficial de validaciones.
 *
 * 00 Health:
 *   Valida que el backend esté vivo y que el fallback 404 funcione.
 *
 * 01 Login:
 *   Valida flujo completo de autenticación:
 *   validaciones, login correcto, sesión, revocación de sesión anterior y logout.
 *
 * 02 Roles:
 *   Valida CRUD lógico del módulo Roles:
 *   listar, crear, duplicado, editar, desactivar, activar y confirmar en listado.
 *
 * 03 Users:
 *   Valida CRUD lógico del módulo Users:
 *   listar, crear, duplicado, editar, desactivar, activar, desbloquear,
 *   resetear contraseña y confirmar en listado.
 */
const suites = [
  {
    key: "00",
    name: "Health",
    description: "Backend vivo, /health y fallback 404.",
    run: runHealth,
  },
  {
    key: "01",
    name: "Login",
    description: "Autenticación, sesión, cookie, /me, revocación y logout.",
    run: runLogin,
  },
  {
    key: "02",
    name: "Roles",
    description: "CRUD lógico de roles y permisos.",
    run: runRoles,
  },
  {
    key: "03",
    name: "Users",
    description: "CRUD lógico de usuarios, activar/desactivar, unlock y reset password.",
    run: runUsers,
  },
];

function printMainHeader() {
  title("NOMINACES - EJECUTAR TODAS LAS VALIDACIONES DESDE 1");

  info("Base URL:", BASE_URL);
  info("Usuario admin:", ADMIN_USER.username);
  info("Orden:", "00 Health -> 01 Login -> 02 Roles -> 03 Users");

  console.log("");
  console.log(paint("Validaciones incluidas:", colors.bold + colors.white));

  for (const suite of suites) {
    console.log(
      `  ${paint(suite.key, colors.cyan)} ${suite.name.padEnd(10)} ${paint(
        suite.description,
        colors.gray
      )}`
    );
  }

  console.log("");
}

function printSuiteStart(suite) {
  title(`INICIANDO ${suite.key} - ${suite.name}`);

  info("Módulo:", suite.name);
  info("Descripción:", suite.description);
  info("Debe ejecutar:", "Todas las pruebas internas del módulo.");
}

function printSuiteEnd(suite, result, ms) {
  const status = result?.failed ? "FAILED" : "PASSED";

  console.log("");
  line();

  if (status === "PASSED") {
    console.log(
      paint(
        `SUITE ${suite.key} - ${suite.name}: PASSED (${result?.total ?? 0} pruebas, ${ms} ms)`,
        colors.green
      )
    );
  } else {
    console.log(
      paint(
        `SUITE ${suite.key} - ${suite.name}: FAILED (${result?.total ?? 0} pruebas, ${ms} ms)`,
        colors.red
      )
    );
    console.log(
      paint(
        "Se continúa con las demás suites para mostrar diagnóstico completo.",
        colors.yellow
      )
    );
  }

  line();
}

function printSuiteCrash(suite, error, ms) {
  const message = error instanceof Error ? error.message : String(error);

  console.log("");
  line();
  console.log(
    paint(`SUITE ${suite.key} - ${suite.name}: ERROR (${ms} ms)`, colors.red)
  );
  console.log(paint(message, colors.red));
  line();

  return message;
}

function printGeneralSummary(summary) {
  title("RESUMEN GENERAL DE VALIDACIONES");

  const columns = {
    suite: 8,
    module: 16,
    status: 12,
    total: 10,
    time: 12,
  };

  const totalWidth =
    columns.suite +
    columns.module +
    columns.status +
    columns.total +
    columns.time +
    15;

  console.log(paint("─".repeat(totalWidth), colors.gray));

  console.log(
    paint("Suite".padEnd(columns.suite), colors.gray) +
      " | " +
      paint("Módulo".padEnd(columns.module), colors.gray) +
      " | " +
      paint("Estado".padEnd(columns.status), colors.gray) +
      " | " +
      paint("Pruebas".padEnd(columns.total), colors.gray) +
      " | " +
      paint("Tiempo".padEnd(columns.time), colors.gray)
  );

  console.log(paint("─".repeat(totalWidth), colors.gray));

  for (const item of summary) {
    const statusText =
      item.status === "PASSED"
        ? paint(item.status.padEnd(columns.status), colors.green)
        : paint(item.status.padEnd(columns.status), colors.red);

    console.log(
      String(item.key).padEnd(columns.suite) +
        " | " +
        String(item.name).padEnd(columns.module) +
        " | " +
        statusText +
        " | " +
        String(item.total).padEnd(columns.total) +
        " | " +
        `${item.ms} ms`.padEnd(columns.time)
    );

    if (item.error) {
      console.log(paint(`  Error: ${item.error}`, colors.red));
    }
  }

  console.log(paint("─".repeat(totalWidth), colors.gray));

  const totalSuites = summary.length;
  const passedSuites = summary.filter((item) => item.status === "PASSED").length;
  const failedSuites = summary.filter((item) => item.status === "FAILED").length;
  const totalTests = summary.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const totalTime = summary.reduce((sum, item) => sum + Number(item.ms || 0), 0);

  console.log("");
  console.log(paint(`Suites correctas: ${passedSuites} / ${totalSuites}`, colors.cyan));
  console.log(paint(`Suites fallidas:  ${failedSuites}`, failedSuites > 0 ? colors.red : colors.green));
  console.log(paint(`Pruebas totales:  ${totalTests}`, colors.cyan));
  console.log(paint(`Tiempo total:     ${totalTime} ms`, colors.cyan));
  console.log("");

  if (failedSuites > 0) {
    console.log(paint("RESULTADO GENERAL: FAILED", colors.red));
  } else {
    console.log(paint("RESULTADO GENERAL: PASSED", colors.green));
  }

  console.log("");
}

export async function runAll() {
  printMainHeader();

  const summary = [];

  for (const suite of suites) {
    printSuiteStart(suite);

    const startedAt = Date.now();

    try {
      const result = await suite.run();
      const ms = Date.now() - startedAt;

      const normalizedResult = {
        passed: Boolean(result?.passed),
        failed: Boolean(result?.failed),
        total: Number(result?.total || 0),
      };

      summary.push({
        key: suite.key,
        name: suite.name,
        status: normalizedResult.failed ? "FAILED" : "PASSED",
        total: normalizedResult.total,
        ms,
      });

      printSuiteEnd(suite, normalizedResult, ms);
    } catch (error) {
      const ms = Date.now() - startedAt;
      const message = printSuiteCrash(suite, error, ms);

      summary.push({
        key: suite.key,
        name: suite.name,
        status: "FAILED",
        total: 0,
        ms,
        error: message,
      });
    }
  }

  printGeneralSummary(summary);

  const failed = summary.some((item) => item.status === "FAILED");

  return {
    passed: !failed,
    failed,
    suites: summary,
  };
}

if (isDirectRun(import.meta.url)) {
  const result = await runAll();
  process.exitCode = result.failed ? 1 : 0;
}