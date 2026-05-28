// ======================================================
// PATH: backend/tests/_testKit.mjs
// Kit común para pruebas manuales NominaCes
// ======================================================

import { fileURLToPath } from "node:url";
import path from "node:path";

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:4002";

export const ADMIN_USER = {
  username: process.env.TEST_LOGIN_USER || "wsolis",
  password: process.env.TEST_LOGIN_PASSWORD || "Nomina@2026",
};

export const WRONG_PASSWORD =
  process.env.TEST_LOGIN_WRONG_PASSWORD || "Incorrecta@123";

export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

export function isDirectRun(metaUrl) {
  const currentFile = fileURLToPath(metaUrl);
  const entryFile = path.resolve(process.argv[1] || "");
  return currentFile === entryFile;
}

export function paint(text, colorCode) {
  return `${colorCode}${text}${colors.reset}`;
}

export function stripAnsi(value) {
  return String(value).replace(/\x1b\[[0-9;]*m/g, "");
}

export function visibleLength(value) {
  return stripAnsi(value).length;
}

export function padRight(value, width) {
  const text = String(value);
  const diff = width - visibleLength(text);
  return diff > 0 ? text + " ".repeat(diff) : text;
}

export function truncate(value, width) {
  const clean = stripAnsi(value);
  if (clean.length <= width) return String(value);
  return clean.slice(0, Math.max(0, width - 1)) + "…";
}

export function line(char = "─", width = 118) {
  console.log(paint(char.repeat(width), colors.gray));
}

export function title(text) {
  console.log("");
  line();
  console.log(paint(` ${text}`, colors.bold + colors.cyan));
  line();
}

export function section(text) {
  console.log("");
  console.log(paint(`▶ ${text}`, colors.bold + colors.white));
  line("·");
}

export function info(label, value) {
  console.log(`${paint(label.padEnd(24), colors.gray)} ${value}`);
}

export function successIcon() {
  return paint("✓", colors.green);
}

export function failIcon() {
  return paint("✕", colors.red);
}

export function warnIcon() {
  return paint("!", colors.yellow);
}

export function prettyJson(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function printBlock(label, value) {
  console.log(paint(label, colors.gray));

  const text = prettyJson(value);
  const lines = text.split("\n");

  for (const lineText of lines) {
    console.log(`  ${lineText}`);
  }
}

export function getCookieFromResponse(response) {
  if (typeof response.headers.getSetCookie === "function") {
    const setCookies = response.headers.getSetCookie();
    return setCookies?.[0]?.split(";")?.[0] || "";
  }

  const setCookie = response.headers.get("set-cookie");
  return setCookie?.split(";")?.[0] || "";
}

export function buildHeaders({ cookie = "", json = true } = {}) {
  const headers = {};

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  if (cookie) {
    headers.Cookie = cookie;
  }

  return headers;
}

export async function readJsonSafe(response) {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

export async function request(method, requestPath, options = {}) {
  const { body, cookie = "", json = true, baseUrl = BASE_URL } = options;

  const url = `${baseUrl}${requestPath}`;

  const response = await fetch(url, {
    method,
    headers: buildHeaders({ cookie, json }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await readJsonSafe(response);
  const setCookie = getCookieFromResponse(response);

  return {
    method,
    path: requestPath,
    url,
    status: response.status,
    ok: response.ok,
    data,
    setCookie,
    cookie: setCookie,
  };
}

export function getErrorCode(result) {
  return result?.data?.error?.code || "";
}

export function getErrorMessage(result) {
  return result?.data?.error?.message || "";
}

export function getData(result) {
  return result?.data?.data;
}

export function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertHttp(result, expectedStatus) {
  assertCondition(
    result.status === expectedStatus,
    `HTTP esperado ${expectedStatus}, recibido ${result.status}.`
  );
}

export function assertHttpAny(result, expectedStatuses) {
  assertCondition(
    expectedStatuses.includes(result.status),
    `HTTP esperado uno de [${expectedStatuses.join(", ")}], recibido ${result.status}.`
  );
}

export function assertSuccess(result, expectedStatus = 200) {
  assertHttp(result, expectedStatus);

  assertCondition(
    result.data?.ok === true,
    `Se esperaba ok=true. Recibido: ${prettyJson(result.data)}`
  );
}

export function assertError(
  result,
  expectedStatus,
  expectedCode,
  expectedMessageContains = ""
) {
  assertHttp(result, expectedStatus);

  assertCondition(
    result.data?.ok === false,
    `Se esperaba ok=false. Recibido: ${prettyJson(result.data)}`
  );

  assertCondition(
    getErrorCode(result) === expectedCode,
    `Código esperado ${expectedCode}, recibido ${getErrorCode(result) || "(vacío)"}.`
  );

  if (expectedMessageContains) {
    assertCondition(
      getErrorMessage(result)
        .toLowerCase()
        .includes(expectedMessageContains.toLowerCase()),
      `Mensaje esperado contiene "${expectedMessageContains}", recibido "${getErrorMessage(result)}".`
    );
  }
}

export function assertErrorAnyCode(
  result,
  expectedStatus,
  expectedCodes,
  expectedMessageContains = ""
) {
  assertHttp(result, expectedStatus);

  assertCondition(
    result.data?.ok === false,
    `Se esperaba ok=false. Recibido: ${prettyJson(result.data)}`
  );

  assertCondition(
    expectedCodes.includes(getErrorCode(result)),
    `Código esperado uno de [${expectedCodes.join(", ")}], recibido ${getErrorCode(result) || "(vacío)"}.`
  );

  if (expectedMessageContains) {
    assertCondition(
      getErrorMessage(result)
        .toLowerCase()
        .includes(expectedMessageContains.toLowerCase()),
      `Mensaje esperado contiene "${expectedMessageContains}", recibido "${getErrorMessage(result)}".`
    );
  }
}

export function createResultStore() {
  const results = [];

  return {
    add(item) {
      results.push(item);
    },

    all() {
      return results;
    },

    reset() {
      results.splice(0, results.length);
    },

    hasFailed() {
      return results.some((item) => item.status === "FAILED");
    },

    countPassed() {
      return results.filter((item) => item.status === "PASSED").length;
    },

    countFailed() {
      return results.filter((item) => item.status === "FAILED").length;
    },
  };
}

export async function runTest(results, config) {
  const {
    name,
    before,
    action,
    expected,
    expectedResponse,
    fn,
    showResponse = true,
  } = config;

  const startedAt = Date.now();

  console.log("");
  console.log(paint(`Prueba: ${name}`, colors.bold + colors.cyan));
  console.log(paint(`Antes:          ${before}`, colors.gray));
  console.log(paint(`Hace:           ${action}`, colors.gray));
  console.log(paint(`Debe arrojar:   ${expected}`, colors.gray));

  if (expectedResponse) {
    printBlock("Respuesta esperada:", expectedResponse);
  }

  try {
    const output = await fn();
    const ms = Date.now() - startedAt;

    if (showResponse && output?.response) {
      printBlock("Respuesta recibida:", {
        status: output.response.status,
        ok: output.response.ok,
        body: output.response.data,
        setCookie: output.response.setCookie ? "Sí" : "No",
      });
    }

    results.add({
      status: "PASSED",
      name,
      detail: output?.detail || "Correcto.",
      ms,
      expected,
      received: output?.response?.data ?? null,
    });

    console.log(
      `${successIcon()} ${paint("PASSED", colors.green)} ${paint(`(${ms} ms)`, colors.gray)}`
    );
  } catch (error) {
    const ms = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);

    results.add({
      status: "FAILED",
      name,
      detail: message,
      ms,
      expected,
      received: null,
    });

    console.log(
      `${failIcon()} ${paint("FAILED", colors.red)} ${paint(`(${ms} ms)`, colors.gray)}`
    );
    console.log(`  ${paint(message, colors.red)}`);
  }
}

export function printResults(results, suiteName = "RESULTADOS") {
  title(suiteName);

  const rows = results.all();

  const terminalWidth = process.stdout.columns || 150;
  const maxWidth = Math.max(110, Math.min(terminalWidth - 2, 180));

  const columns = {
    number: 4,
    status: 10,
    test: 48,
  };

  const detailWidth =
    maxWidth -
    columns.number -
    columns.status -
    columns.test -
    13;

  const border =
    "┌" +
    "─".repeat(columns.number + 2) +
    "┬" +
    "─".repeat(columns.status + 2) +
    "┬" +
    "─".repeat(columns.test + 2) +
    "┬" +
    "─".repeat(detailWidth + 2) +
    "┐";

  const middle =
    "├" +
    "─".repeat(columns.number + 2) +
    "┼" +
    "─".repeat(columns.status + 2) +
    "┼" +
    "─".repeat(columns.test + 2) +
    "┼" +
    "─".repeat(detailWidth + 2) +
    "┤";

  const bottom =
    "└" +
    "─".repeat(columns.number + 2) +
    "┴" +
    "─".repeat(columns.status + 2) +
    "┴" +
    "─".repeat(columns.test + 2) +
    "┴" +
    "─".repeat(detailWidth + 2) +
    "┘";

  console.log(paint(border, colors.gray));

  console.log(
    paint("│", colors.gray) +
      " " +
      padRight("#", columns.number) +
      " " +
      paint("│", colors.gray) +
      " " +
      padRight("Estado", columns.status) +
      " " +
      paint("│", colors.gray) +
      " " +
      padRight("Prueba", columns.test) +
      " " +
      paint("│", colors.gray) +
      " " +
      padRight("Detalle", detailWidth) +
      " " +
      paint("│", colors.gray)
  );

  console.log(paint(middle, colors.gray));

  rows.forEach((item, index) => {
    const status =
      item.status === "PASSED"
        ? paint("PASSED", colors.green)
        : paint("FAILED", colors.red);

    const detail = `${item.detail} (${item.ms} ms)`;

    console.log(
      paint("│", colors.gray) +
        " " +
        padRight(String(index + 1), columns.number) +
        " " +
        paint("│", colors.gray) +
        " " +
        padRight(status, columns.status) +
        " " +
        paint("│", colors.gray) +
        " " +
        padRight(truncate(item.name, columns.test), columns.test) +
        " " +
        paint("│", colors.gray) +
        " " +
        padRight(truncate(detail, detailWidth), detailWidth) +
        " " +
        paint("│", colors.gray)
    );
  });

  console.log(paint(bottom, colors.gray));

  const passed = results.countPassed();
  const total = rows.length;
  const failed = results.countFailed();

  console.log("");
  console.log(paint(`Resumen: ${passed} / ${total} pruebas correctas.`, colors.cyan));

  if (failed === 0) {
    console.log(paint("Test run completed. Result: PASSED", colors.green));
  } else {
    console.log(paint("Test run completed. Result: FAILED", colors.red));
  }

  console.log("");
}

export function extractList(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.roles)) return data.roles;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export function extractObject(data, keys = []) {
  if (!data || typeof data !== "object") return null;

  for (const key of keys) {
    if (data?.[key] && typeof data[key] === "object") {
      return data[key];
    }
  }

  return data;
}

export async function loginAndGetCookie() {
  const result = await request("POST", "/login", {
    body: ADMIN_USER,
  });

  assertSuccess(result, 200);

  assertCondition(
    Boolean(result.setCookie),
    "Login correcto, pero no regresó Set-Cookie."
  );

  return {
    cookie: result.setCookie,
    user: result.data?.data?.user,
    expiresAt: result.data?.data?.expiresAt,
    response: result,
  };
}