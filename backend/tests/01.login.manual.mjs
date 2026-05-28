// ======================================================
// PATH: backend/tests/01.login.manual.mjs
// Pruebas manuales detalladas - Login NominaCes
// ======================================================

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  ADMIN_USER,
  BASE_URL,
  WRONG_PASSWORD,
  assertCondition,
  assertError,
  assertSuccess,
  colors,
  createResultStore,
  info,
  isDirectRun,
  paint,
  printResults,
  request,
  runTest,
  title,
  warnIcon,
} from "./_testKit.mjs";

const results = createResultStore();
let cookieJar = "";

async function testGetLoginNotAllowed() {
  const response = await request("GET", "/login");

  assertError(response, 404, "NOT_FOUND", "Ruta no encontrada");

  return {
    response,
    detail: "GET /login no está permitido; correcto porque login debe ser POST.",
  };
}

async function testLoginEmptyBody() {
  const response = await request("POST", "/login", {
    body: {},
  });

  assertError(response, 400, "VALIDATION_ERROR", "Datos de login inválidos");

  return {
    response,
    detail: "Body vacío rechazado correctamente.",
  };
}

async function testLoginMissingPassword() {
  const response = await request("POST", "/login", {
    body: {
      username: ADMIN_USER.username,
    },
  });

  assertError(response, 400, "VALIDATION_ERROR", "Datos de login inválidos");

  return {
    response,
    detail: "Password faltante rechazado correctamente.",
  };
}

async function testLoginMissingUsername() {
  const response = await request("POST", "/login", {
    body: {
      password: ADMIN_USER.password,
    },
  });

  assertError(response, 400, "VALIDATION_ERROR", "Datos de login inválidos");

  return {
    response,
    detail: "Username faltante rechazado correctamente.",
  };
}

async function testLoginUnknownUser() {
  const response = await request("POST", "/login", {
    body: {
      username: "usuario_no_existe",
      password: ADMIN_USER.password,
    },
  });

  assertError(response, 401, "UNAUTHORIZED", "Usuario o contraseña incorrectos");

  return {
    response,
    detail: "Usuario inexistente rechazado con mensaje genérico.",
  };
}

async function testLoginWrongPassword() {
  const response = await request("POST", "/login", {
    body: {
      username: ADMIN_USER.username,
      password: WRONG_PASSWORD,
    },
  });

  assertError(response, 401, "UNAUTHORIZED", "Usuario o contraseña incorrectos");

  return {
    response,
    detail: "Password incorrecto rechazado. Solo se prueba una vez para no bloquear.",
  };
}

async function testMeWithoutCookie() {
  const response = await request("GET", "/login/me");

  assertError(response, 401, "UNAUTHORIZED", "Sesión requerida");

  return {
    response,
    detail: "Sin cookie no permite consultar sesión actual.",
  };
}

async function testLoginOk() {
  const response = await request("POST", "/login", {
    body: ADMIN_USER,
  });

  assertSuccess(response, 200);

  assertCondition(
    response.data?.data?.user?.username === ADMIN_USER.username,
    "El username autenticado no coincide."
  );

  assertCondition(
    response.data?.data?.user?.role?.key === "ADMINISTRADOR",
    "El rol debe ser ADMINISTRADOR."
  );

  assertCondition(
    Array.isArray(response.data?.data?.user?.permissions),
    "permissions debe venir como arreglo."
  );

  assertCondition(
    response.data?.data?.user?.permissions?.includes("USERS_VIEW"),
    "El usuario debe incluir USERS_VIEW."
  );

  assertCondition(
    Boolean(response.data?.data?.expiresAt),
    "Debe regresar expiresAt."
  );

  assertCondition(
    Boolean(response.setCookie),
    "Debe regresar Set-Cookie."
  );

  cookieJar = response.setCookie;

  return {
    response,
    detail: `Login correcto para ${response.data.data.user.username}.`,
  };
}

async function testMeWithCookie() {
  const response = await request("GET", "/login/me", {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  assertCondition(
    response.data?.data?.user?.username === ADMIN_USER.username,
    "La sesión no corresponde al usuario esperado."
  );

  assertCondition(
    response.data?.data?.user?.role?.key === "ADMINISTRADOR",
    "Rol incorrecto en /login/me."
  );

  return {
    response,
    detail: `Sesión válida para ${response.data.data.user.fullName}.`,
  };
}

async function testSecondLoginRevokesPrevious() {
  const oldCookie = cookieJar;

  const loginResponse = await request("POST", "/login", {
    body: ADMIN_USER,
  });

  assertSuccess(loginResponse, 200);

  assertCondition(Boolean(loginResponse.setCookie), "Debe regresar nueva cookie.");
  assertCondition(
    loginResponse.setCookie !== oldCookie,
    "La nueva cookie debería ser diferente a la anterior."
  );

  const newCookie = loginResponse.setCookie;

  const oldSessionResponse = await request("GET", "/login/me", {
    cookie: oldCookie,
  });

  assertError(oldSessionResponse, 401, "UNAUTHORIZED", "Sesión inválida");

  cookieJar = newCookie;

  return {
    response: oldSessionResponse,
    detail: "Segundo login revocó la cookie anterior y dejó activa la nueva.",
  };
}

async function testLogout() {
  const response = await request("POST", "/login/logout", {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  assertCondition(
    response.data?.data?.loggedOut === true,
    "Debe regresar data.loggedOut=true."
  );

  cookieJar = "";

  return {
    response,
    detail: "Logout correcto.",
  };
}

async function testMeAfterLogout() {
  const response = await request("GET", "/login/me", {
    cookie: cookieJar,
  });

  assertError(response, 401, "UNAUTHORIZED", "Sesión requerida");

  return {
    response,
    detail: "Después de logout ya no hay sesión válida.",
  };
}

export async function runAll() {
  results.reset();
  cookieJar = "";

  title("NOMINACES - 01 LOGIN");
  info("Base URL:", BASE_URL);
  info("Usuario prueba:", ADMIN_USER.username);

  await runTest(results, {
    name: "GET /login no permitido",
    before: "No requiere sesión.",
    action: "GET /login",
    expected: "HTTP 404, ok=false, error.code='NOT_FOUND'.",
    expectedResponse: {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Ruta no encontrada: GET /login",
      },
    },
    fn: testGetLoginNotAllowed,
  });

  await runTest(results, {
    name: "Login con body vacío",
    before: "No requiere sesión.",
    action: "POST /login con {}.",
    expected: "HTTP 400, ok=false, error.code='VALIDATION_ERROR'.",
    expectedResponse: {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de login inválidos",
      },
    },
    fn: testLoginEmptyBody,
  });

  await runTest(results, {
    name: "Login sin password",
    before: "No requiere sesión.",
    action: "POST /login con username pero sin password.",
    expected: "HTTP 400, VALIDATION_ERROR.",
    expectedResponse: {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de login inválidos",
      },
    },
    fn: testLoginMissingPassword,
  });

  await runTest(results, {
    name: "Login sin username",
    before: "No requiere sesión.",
    action: "POST /login con password pero sin username.",
    expected: "HTTP 400, VALIDATION_ERROR.",
    expectedResponse: {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de login inválidos",
      },
    },
    fn: testLoginMissingUsername,
  });

  await runTest(results, {
    name: "Login usuario inexistente",
    before: "No requiere sesión.",
    action: "POST /login con usuario_no_existe.",
    expected: "HTTP 401, UNAUTHORIZED, mensaje genérico.",
    expectedResponse: {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Usuario o contraseña incorrectos",
      },
    },
    fn: testLoginUnknownUser,
  });

  await runTest(results, {
    name: "Login password incorrecto",
    before: "Usuario real existe, activo y desbloqueado.",
    action: "POST /login con password incorrecto.",
    expected: "HTTP 401, UNAUTHORIZED, mensaje genérico.",
    expectedResponse: {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Usuario o contraseña incorrectos",
      },
    },
    fn: testLoginWrongPassword,
  });

  await runTest(results, {
    name: "Consultar sesión sin cookie",
    before: "No hay cookie de sesión.",
    action: "GET /login/me sin Cookie.",
    expected: "HTTP 401, UNAUTHORIZED.",
    expectedResponse: {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sesión requerida",
      },
    },
    fn: testMeWithoutCookie,
  });

  await runTest(results, {
    name: "Login correcto",
    before: "Usuario real existe, activo, desbloqueado y con password_hash válido.",
    action: "POST /login con username y password correctos.",
    expected: "HTTP 200, ok=true, user, role, permissions, expiresAt y Set-Cookie.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          id: "number",
          username: ADMIN_USER.username,
          fullName: "string",
          role: {
            id: "number",
            key: "ADMINISTRADOR",
            name: "Administrador",
          },
          permissions: ["USERS_VIEW", "USERS_CREATE", "USERS_EDIT"],
        },
        expiresAt: "ISO date",
      },
    },
    fn: testLoginOk,
  });

  await runTest(results, {
    name: "Consultar sesión actual",
    before: "Existe cookie válida recibida en login correcto.",
    action: "GET /login/me con Cookie.",
    expected: "HTTP 200, ok=true, usuario actual.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          username: ADMIN_USER.username,
          role: {
            key: "ADMINISTRADOR",
          },
          permissions: "array",
        },
      },
    },
    fn: testMeWithCookie,
  });

  await runTest(results, {
    name: "Una sesión activa por usuario",
    before: "Ya existe una sesión activa.",
    action: "Hace segundo POST /login y prueba la cookie anterior.",
    expected: "La cookie anterior debe responder 401 UNAUTHORIZED y la nueva queda activa.",
    expectedResponse: {
      oldSession: {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Sesión inválida",
        },
      },
    },
    fn: testSecondLoginRevokesPrevious,
  });

  await runTest(results, {
    name: "Sesión nueva válida",
    before: "Después del segundo login quedó una nueva cookie.",
    action: "GET /login/me con cookie nueva.",
    expected: "HTTP 200, ok=true.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          username: ADMIN_USER.username,
        },
      },
    },
    fn: testMeWithCookie,
  });

  await runTest(results, {
    name: "Logout",
    before: "Existe cookie activa.",
    action: "POST /login/logout.",
    expected: "HTTP 200, ok=true, data.loggedOut=true.",
    expectedResponse: {
      ok: true,
      data: {
        loggedOut: true,
      },
    },
    fn: testLogout,
  });

  await runTest(results, {
    name: "Sesión después de logout",
    before: "La sesión fue cerrada.",
    action: "GET /login/me después de logout.",
    expected: "HTTP 401, UNAUTHORIZED.",
    expectedResponse: {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sesión requerida",
      },
    },
    fn: testMeAfterLogout,
  });

  printResults(results, "RESULTADOS LOGIN");

  return {
    passed: !results.hasFailed(),
    failed: results.hasFailed(),
    total: results.all().length,
  };
}

async function interactiveMenu() {
  const rl = readline.createInterface({ input, output });

  while (true) {
    title("NOMINACES - TEST LOGIN");
    info("Base URL:", BASE_URL);
    info("Usuario:", ADMIN_USER.username);
    info("Cookie en memoria:", cookieJar ? "Sí" : "No");

    console.log("");
    console.log("1) Ejecutar flujo completo Login");
    console.log("0) Salir");
    console.log("");

    const option = await rl.question(paint("Selecciona una opción: ", colors.cyan));

    if (option === "1") {
      await runAll();
      await rl.question(paint("Enter para continuar...", colors.gray));
      continue;
    }

    if (option === "0") {
      rl.close();
      return;
    }

    console.log(paint(`${warnIcon()} Opción inválida.`, colors.yellow));
  }
}

if (isDirectRun(import.meta.url)) {
  const mode = process.argv[2] || "menu";

  if (mode === "all") {
    await runAll();
  } else {
    await interactiveMenu();
  }

  process.exitCode = results.hasFailed() ? 1 : 0;
}