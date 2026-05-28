// ======================================================
// PATH: backend/tests/03.users.manual.mjs
// Pruebas manuales detalladas - Users NominaCes
// CRUD lógico: listar, crear, validar duplicado, editar,
// desactivar, activar, desbloquear y resetear contraseña.
// ======================================================

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  ADMIN_USER,
  BASE_URL,
  assertCondition,
  assertError,
  assertSuccess,
  colors,
  createResultStore,
  extractList,
  extractObject,
  info,
  isDirectRun,
  loginAndGetCookie,
  paint,
  printResults,
  request,
  runTest,
  title,
  warnIcon,
} from "./_testKit.mjs";

const results = createResultStore();

let cookieJar = "";
let createdUserId = null;

const uniqueSuffix = Date.now();

const TEST_USER = {
  username: `test_user_${uniqueSuffix}`,
  fullName: "Usuario Manual Test",
  email: `test_user_${uniqueSuffix}@nominaces.local`,
  password: "Temporal@2026",
  newPassword: "TemporalEditado@2026",

  // El backend actual valida roleId como string.
  roleId: "1",

  updatedFullName: "Usuario Manual Test Editado",
  updatedEmail: `test_user_${uniqueSuffix}_editado@nominaces.local`,
};

/**
 * Obtiene un usuario desde la respuesta del backend.
 *
 * Soporta varias llaves comunes para que la prueba no dependa
 * de un solo nombre interno.
 */
function getUserFromResponse(response) {
  const data = response?.data?.data;

  return extractObject(data, [
    "user",
    "item",
    "createdUser",
    "updatedUser",
    "data",
  ]);
}

/**
 * Obtiene el listado de usuarios desde la respuesta.
 */
function getUsersFromResponse(response) {
  return extractList(response?.data?.data, ["users", "items", "rows"]);
}

/**
 * Inicia sesión como administrador y guarda cookie.
 */
async function loginAsAdmin() {
  const login = await loginAndGetCookie();
  cookieJar = login.cookie;

  return {
    response: login.response,
    detail: `Sesión admin iniciada para ${login.user?.username}.`,
  };
}

/**
 * Valida que Users exija sesión.
 */
async function testUsersWithoutSession() {
  const response = await request("GET", "/users");

  assertError(response, 401, "UNAUTHORIZED");

  return {
    response,
    detail: "Users exige sesión.",
  };
}

/**
 * Lista usuarios con sesión válida.
 */
async function testListUsers() {
  const response = await request("GET", "/users", {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  const users = getUsersFromResponse(response);

  assertCondition(
    Array.isArray(users),
    "La respuesta debe contener arreglo de usuarios."
  );

  return {
    response,
    detail: `Listado de usuarios correcto. Total detectado: ${users.length}.`,
  };
}

/**
 * Intenta crear usuario con body vacío.
 */
async function testCreateUserInvalidBody() {
  const response = await request("POST", "/users", {
    cookie: cookieJar,
    body: {},
  });

  assertError(response, 400, "VALIDATION_ERROR");

  return {
    response,
    detail: "Crear usuario con body vacío fue rechazado.",
  };
}

/**
 * Crea usuario válido.
 *
 * Payload mínimo esperado por el backend:
 * - username
 * - fullName
 * - roleId como string
 *
 * Se envía password/email también porque son útiles si el backend
 * los acepta, pero el test no depende de que email regrese en la respuesta.
 */
async function testCreateUserOk() {
  const response = await request("POST", "/users", {
    cookie: cookieJar,
    body: {
      username: TEST_USER.username,
      fullName: TEST_USER.fullName,
      email: TEST_USER.email,
      password: TEST_USER.password,
      roleId: TEST_USER.roleId,
    },
  });

  assertSuccess(response, 201);

  const user = getUserFromResponse(response);

  assertCondition(user, "La respuesta debe traer el usuario creado.");
  assertCondition(user.id, "El usuario creado debe traer id.");

  createdUserId = user.id;

  return {
    response,
    detail: `Usuario creado id=${createdUserId}, username=${TEST_USER.username}.`,
  };
}

/**
 * Valida duplicado por username.
 */
async function testCreateUserDuplicated() {
  const response = await request("POST", "/users", {
    cookie: cookieJar,
    body: {
      username: TEST_USER.username,
      fullName: TEST_USER.fullName,
      email: TEST_USER.email,
      password: TEST_USER.password,
      roleId: TEST_USER.roleId,
    },
  });

  assertError(response, 409, "CONFLICT");

  return {
    response,
    detail: "Usuario duplicado rechazado correctamente.",
  };
}

/**
 * Intenta editar usuario con nombre vacío.
 */
async function testUpdateUserInvalidBody() {
  assertCondition(createdUserId, "No existe createdUserId para editar.");

  const response = await request("PATCH", `/users/${createdUserId}`, {
    cookie: cookieJar,
    body: {
      fullName: "",
    },
  });

  assertError(response, 400, "VALIDATION_ERROR");

  return {
    response,
    detail: "Edición inválida rechazada.",
  };
}

/**
 * Edita datos generales del usuario.
 */
async function testUpdateUserOk() {
  assertCondition(createdUserId, "No existe createdUserId para editar.");

  const response = await request("PATCH", `/users/${createdUserId}`, {
    cookie: cookieJar,
    body: {
      fullName: TEST_USER.updatedFullName,
      email: TEST_USER.updatedEmail,
      roleId: TEST_USER.roleId,
    },
  });

  assertSuccess(response, 200);

  return {
    response,
    detail: "Usuario editado correctamente.",
  };
}

/**
 * Desactiva usuario.
 */
async function testDeactivateUser() {
  assertCondition(createdUserId, "No existe createdUserId para desactivar.");

  const response = await request("POST", `/users/${createdUserId}/deactivate`, {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  return {
    response,
    detail: "Usuario desactivado correctamente.",
  };
}

/**
 * Activa usuario.
 */
async function testActivateUser() {
  assertCondition(createdUserId, "No existe createdUserId para activar.");

  const response = await request("POST", `/users/${createdUserId}/activate`, {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  return {
    response,
    detail: "Usuario activado correctamente.",
  };
}

/**
 * Desbloquea usuario.
 *
 * Aunque el usuario no esté bloqueado, el endpoint debe responder OK
 * si la operación es idempotente.
 */
async function testUnlockUser() {
  assertCondition(createdUserId, "No existe createdUserId para desbloquear.");

  const response = await request("POST", `/users/${createdUserId}/unlock`, {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  return {
    response,
    detail: "Usuario desbloqueado correctamente.",
  };
}

/**
 * Resetea contraseña del usuario.
 */
async function testResetPassword() {
  assertCondition(createdUserId, "No existe createdUserId para resetear contraseña.");

  const response = await request("POST", `/users/${createdUserId}/reset-password`, {
    cookie: cookieJar,
    body: {
      password: TEST_USER.newPassword,
      newPassword: TEST_USER.newPassword,
      new_password: TEST_USER.newPassword,
    },
  });

  assertSuccess(response, 200);

  return {
    response,
    detail: "Contraseña reseteada correctamente.",
  };
}

/**
 * Confirma que el usuario creado aparece en listado.
 */
async function testListContainsCreatedUser() {
  const response = await request("GET", "/users", {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  const users = getUsersFromResponse(response);

  const found = users.some((user) => {
    return (
      String(user.id) === String(createdUserId) ||
      user.username === TEST_USER.username ||
      user.userName === TEST_USER.username
    );
  });

  assertCondition(found, "El listado debe contener el usuario creado.");

  return {
    response,
    detail: "El usuario creado aparece en el listado.",
  };
}

export async function runAll() {
  results.reset();
  cookieJar = "";
  createdUserId = null;

  title("NOMINACES - 03 USERS");
  info("Base URL:", BASE_URL);
  info("Usuario admin:", ADMIN_USER.username);
  info("Usuario prueba:", TEST_USER.username);

  await runTest(results, {
    name: "Users sin sesión",
    before: "No hay cookie.",
    action: "GET /users sin Cookie.",
    expected: "HTTP 401, UNAUTHORIZED.",
    expectedResponse: {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sesión requerida",
      },
    },
    fn: testUsersWithoutSession,
  });

  await runTest(results, {
    name: "Login admin para Users",
    before:
      "Usuario admin activo, desbloqueado y con permisos USERS_VIEW, USERS_CREATE, USERS_EDIT.",
    action: "POST /login y guarda Cookie.",
    expected: "HTTP 200, ok=true y Set-Cookie.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          username: ADMIN_USER.username,
          permissions: ["USERS_VIEW", "USERS_CREATE", "USERS_EDIT"],
        },
      },
    },
    fn: loginAsAdmin,
  });

  await runTest(results, {
    name: "Listar usuarios",
    before: "Sesión admin válida.",
    action: "GET /users.",
    expected: "HTTP 200, ok=true, listado de usuarios.",
    expectedResponse: {
      ok: true,
      data: {
        users: [
          {
            id: "number",
            username: ADMIN_USER.username,
          },
        ],
      },
    },
    fn: testListUsers,
  });

  await runTest(results, {
    name: "Crear usuario inválido",
    before: "Sesión admin válida.",
    action: "POST /users con body vacío.",
    expected: "HTTP 400, VALIDATION_ERROR.",
    expectedResponse: {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de usuario inválidos",
      },
    },
    fn: testCreateUserInvalidBody,
  });

  await runTest(results, {
    name: "Crear usuario",
    before: "Sesión admin válida y rol ADMINISTRADOR existente.",
    action: "POST /users con username, nombre, email, password y rol.",
    expected: "HTTP 201, ok=true, usuario creado con id.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          id: "number",
          username: TEST_USER.username,
          fullName: TEST_USER.fullName,
          isActive: true,
        },
      },
    },
    fn: testCreateUserOk,
  });

  await runTest(results, {
    name: "Crear usuario duplicado",
    before: "Ya existe el usuario creado en la prueba anterior.",
    action: "POST /users con el mismo username.",
    expected: "HTTP 409, CONFLICT.",
    expectedResponse: {
      ok: false,
      error: {
        code: "CONFLICT",
        message: "El usuario ya existe",
      },
    },
    fn: testCreateUserDuplicated,
  });

  await runTest(results, {
    name: "Editar usuario inválido",
    before: "Existe usuario de prueba creado.",
    action: "PATCH /users/:userId con fullName vacío.",
    expected: "HTTP 400, VALIDATION_ERROR.",
    expectedResponse: {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de usuario inválidos",
      },
    },
    fn: testUpdateUserInvalidBody,
  });

  await runTest(results, {
    name: "Editar usuario",
    before: "Existe usuario de prueba creado.",
    action: "PATCH /users/:userId con nuevo nombre, email y rol.",
    expected: "HTTP 200, ok=true.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          id: createdUserId || "number",
          username: TEST_USER.username,
          fullName: TEST_USER.updatedFullName,
        },
      },
    },
    fn: testUpdateUserOk,
  });

  await runTest(results, {
    name: "Desactivar usuario",
    before: "Existe usuario de prueba activo.",
    action: "POST /users/:userId/deactivate.",
    expected: "HTTP 200, ok=true, usuario inactivo.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          id: createdUserId || "number",
          isActive: false,
        },
      },
    },
    fn: testDeactivateUser,
  });

  await runTest(results, {
    name: "Activar usuario",
    before: "Existe usuario de prueba inactivo.",
    action: "POST /users/:userId/activate.",
    expected: "HTTP 200, ok=true, usuario activo.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          id: createdUserId || "number",
          isActive: true,
        },
      },
    },
    fn: testActivateUser,
  });

  await runTest(results, {
    name: "Desbloquear usuario",
    before: "Existe usuario de prueba.",
    action: "POST /users/:userId/unlock.",
    expected: "HTTP 200, ok=true.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          id: createdUserId || "number",
          isLocked: false,
        },
      },
    },
    fn: testUnlockUser,
  });

  await runTest(results, {
    name: "Reset password",
    before: "Existe usuario de prueba.",
    action: "POST /users/:userId/reset-password.",
    expected: "HTTP 200, ok=true.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          id: createdUserId || "number",
        },
      },
    },
    fn: testResetPassword,
  });

  await runTest(results, {
    name: "Usuario creado aparece en listado",
    before: "Usuario creado/editado/activado.",
    action: "GET /users y busca el username creado.",
    expected: "HTTP 200 y el listado debe contener el usuario de prueba.",
    expectedResponse: {
      ok: true,
      data: {
        users: [
          {
            id: createdUserId || "number",
            username: TEST_USER.username,
          },
        ],
      },
    },
    fn: testListContainsCreatedUser,
  });

  printResults(results, "RESULTADOS USERS");

  return {
    passed: !results.hasFailed(),
    failed: results.hasFailed(),
    total: results.all().length,
  };
}

async function interactiveMenu() {
  const rl = readline.createInterface({ input, output });

  while (true) {
    title("NOMINACES - TEST USERS");
    info("Base URL:", BASE_URL);
    info("Usuario admin:", ADMIN_USER.username);
    info("Cookie en memoria:", cookieJar ? "Sí" : "No");

    console.log("");
    console.log("1) Ejecutar flujo completo Users");
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