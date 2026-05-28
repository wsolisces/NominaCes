// ======================================================
// PATH: backend/tests/02.roles.manual.mjs
// Pruebas manuales detalladas - Roles NominaCes
// CRUD lógico: listar, crear, validar duplicado, editar,
// desactivar y activar.
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
let createdRoleId = null;

const uniqueSuffix = Date.now();

const TEST_ROLE = {
  roleKey: `TEST_MANUAL_${uniqueSuffix}`,
  roleName: "Rol Manual Test",
  description: "Rol creado por pruebas manuales NominaCes.",
  permissions: ["USERS_VIEW", "ROLES_VIEW"],
  updatedPermissions: ["USERS_VIEW", "ROLES_VIEW", "CATALOGS_VIEW"],
};

function getRoleFromResponse(response) {
  const data = response?.data?.data;
  return extractObject(data, ["role", "item", "createdRole", "updatedRole"]);
}

function getRolesFromResponse(response) {
  return extractList(response?.data?.data, ["roles", "items", "rows"]);
}

async function loginAsAdmin() {
  const login = await loginAndGetCookie();
  cookieJar = login.cookie;

  return {
    response: login.response,
    detail: `Sesión admin iniciada para ${login.user?.username}.`,
  };
}

async function testRolesWithoutSession() {
  const response = await request("GET", "/roles");

  assertError(response, 401, "UNAUTHORIZED", "Sesión requerida");

  return {
    response,
    detail: "Roles exige sesión.",
  };
}

async function testListRoles() {
  const response = await request("GET", "/roles", {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  const roles = getRolesFromResponse(response);

  assertCondition(
    Array.isArray(roles),
    "La respuesta debe contener arreglo de roles."
  );

  return {
    response,
    detail: `Listado de roles correcto. Total detectado: ${roles.length}.`,
  };
}

async function testCreateRoleInvalidBody() {
  const response = await request("POST", "/roles", {
    cookie: cookieJar,
    body: {},
  });

  assertError(response, 400, "VALIDATION_ERROR");

  return {
    response,
    detail: "Crear rol con body vacío fue rechazado.",
  };
}

async function testCreateRoleOk() {
  const response = await request("POST", "/roles", {
    cookie: cookieJar,
    body: {
      roleKey: TEST_ROLE.roleKey,
      roleName: TEST_ROLE.roleName,
      description: TEST_ROLE.description,
      permissionKeys: TEST_ROLE.permissions,
      permissions: TEST_ROLE.permissions,
    },
  });

  assertSuccess(response, 201);

  const role = getRoleFromResponse(response);

  assertCondition(role, "La respuesta debe traer el rol creado.");
  assertCondition(role.id, "El rol creado debe traer id.");

  createdRoleId = role.id;

  return {
    response,
    detail: `Rol creado id=${createdRoleId}, key=${TEST_ROLE.roleKey}.`,
  };
}

async function testCreateRoleDuplicated() {
  const response = await request("POST", "/roles", {
    cookie: cookieJar,
    body: {
      roleKey: TEST_ROLE.roleKey,
      roleName: TEST_ROLE.roleName,
      description: TEST_ROLE.description,
      permissionKeys: TEST_ROLE.permissions,
      permissions: TEST_ROLE.permissions,
    },
  });

  assertError(response, 409, "CONFLICT");

  return {
    response,
    detail: "Rol duplicado rechazado correctamente.",
  };
}

async function testUpdateRoleInvalidBody() {
  assertCondition(createdRoleId, "No existe createdRoleId para editar.");

  const response = await request("PATCH", `/roles/${createdRoleId}`, {
    cookie: cookieJar,
    body: {
      roleName: "",
      permissionKeys: [],
      permissions: [],
    },
  });

  assertError(response, 400, "VALIDATION_ERROR");

  return {
    response,
    detail: "Edición inválida rechazada.",
  };
}

async function testUpdateRoleOk() {
  assertCondition(createdRoleId, "No existe createdRoleId para editar.");

  const response = await request("PATCH", `/roles/${createdRoleId}`, {
    cookie: cookieJar,
    body: {
      roleName: `${TEST_ROLE.roleName} Editado`,
      description: `${TEST_ROLE.description} Editado.`,
      permissionKeys: TEST_ROLE.updatedPermissions,
      permissions: TEST_ROLE.updatedPermissions,
    },
  });

  assertSuccess(response, 200);

  return {
    response,
    detail: "Rol editado correctamente.",
  };
}

async function testDeactivateRole() {
  assertCondition(createdRoleId, "No existe createdRoleId para desactivar.");

  const response = await request("POST", `/roles/${createdRoleId}/deactivate`, {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  return {
    response,
    detail: "Rol desactivado correctamente.",
  };
}

async function testActivateRole() {
  assertCondition(createdRoleId, "No existe createdRoleId para activar.");

  const response = await request("POST", `/roles/${createdRoleId}/activate`, {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  return {
    response,
    detail: "Rol activado correctamente.",
  };
}

async function testListContainsCreatedRole() {
  const response = await request("GET", "/roles", {
    cookie: cookieJar,
  });

  assertSuccess(response, 200);

  const roles = getRolesFromResponse(response);

  const found = roles.some((role) => {
    return (
      role.id === createdRoleId ||
      role.roleKey === TEST_ROLE.roleKey ||
      role.role_key === TEST_ROLE.roleKey
    );
  });

  assertCondition(found, "El listado debe contener el rol creado.");

  return {
    response,
    detail: "El rol creado aparece en el listado.",
  };
}

export async function runAll() {
  results.reset();
  cookieJar = "";
  createdRoleId = null;

  title("NOMINACES - 02 ROLES");
  info("Base URL:", BASE_URL);
  info("Usuario admin:", ADMIN_USER.username);
  info("Rol prueba:", TEST_ROLE.roleKey);

  await runTest(results, {
    name: "Roles sin sesión",
    before: "No hay cookie.",
    action: "GET /roles sin Cookie.",
    expected: "HTTP 401, UNAUTHORIZED.",
    expectedResponse: {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sesión requerida",
      },
    },
    fn: testRolesWithoutSession,
  });

  await runTest(results, {
    name: "Login admin para Roles",
    before: "Usuario admin activo, desbloqueado y con permisos ROLES_VIEW, ROLES_CREATE, ROLES_EDIT.",
    action: "POST /login y guarda Cookie.",
    expected: "HTTP 200, ok=true y Set-Cookie.",
    expectedResponse: {
      ok: true,
      data: {
        user: {
          username: ADMIN_USER.username,
          permissions: ["ROLES_VIEW", "ROLES_CREATE", "ROLES_EDIT"],
        },
      },
    },
    fn: loginAsAdmin,
  });

  await runTest(results, {
    name: "Listar roles",
    before: "Sesión admin válida.",
    action: "GET /roles.",
    expected: "HTTP 200, ok=true, listado de roles.",
    expectedResponse: {
      ok: true,
      data: {
        roles: [
          {
            id: 1,
            roleKey: "ADMINISTRADOR",
            roleName: "Administrador",
            isActive: true,
          },
        ],
      },
    },
    fn: testListRoles,
  });

  await runTest(results, {
    name: "Crear rol inválido",
    before: "Sesión admin válida.",
    action: "POST /roles con body vacío.",
    expected: "HTTP 400, VALIDATION_ERROR.",
    expectedResponse: {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de rol inválidos",
      },
    },
    fn: testCreateRoleInvalidBody,
  });

  await runTest(results, {
    name: "Crear rol",
    before: "Sesión admin válida y permisos existentes: USERS_VIEW, ROLES_VIEW.",
    action: "POST /roles con roleKey, roleName, description y permisos.",
    expected: "HTTP 201, ok=true, rol creado con id.",
    expectedResponse: {
      ok: true,
      data: {
        role: {
          id: "number",
          roleKey: TEST_ROLE.roleKey,
          roleName: TEST_ROLE.roleName,
          description: TEST_ROLE.description,
          isActive: true,
          permissions: TEST_ROLE.permissions,
        },
      },
    },
    fn: testCreateRoleOk,
  });

  await runTest(results, {
    name: "Crear rol duplicado",
    before: "Ya existe el rol creado en la prueba anterior.",
    action: "POST /roles con el mismo roleKey.",
    expected: "HTTP 409, CONFLICT.",
    expectedResponse: {
      ok: false,
      error: {
        code: "CONFLICT",
        message: "El rol ya existe",
      },
    },
    fn: testCreateRoleDuplicated,
  });

  await runTest(results, {
    name: "Editar rol inválido",
    before: "Existe rol de prueba creado.",
    action: "PATCH /roles/:roleId con roleName vacío.",
    expected: "HTTP 400, VALIDATION_ERROR.",
    expectedResponse: {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de rol inválidos",
      },
    },
    fn: testUpdateRoleInvalidBody,
  });

  await runTest(results, {
    name: "Editar rol",
    before: "Existe rol de prueba creado.",
    action: "PATCH /roles/:roleId con nuevo nombre, descripción y permisos.",
    expected: "HTTP 200, ok=true.",
    expectedResponse: {
      ok: true,
      data: {
        role: {
          id: createdRoleId || "number",
          roleName: `${TEST_ROLE.roleName} Editado`,
          permissions: TEST_ROLE.updatedPermissions,
        },
      },
    },
    fn: testUpdateRoleOk,
  });

  await runTest(results, {
    name: "Desactivar rol",
    before: "Existe rol de prueba activo.",
    action: "POST /roles/:roleId/deactivate.",
    expected: "HTTP 200, ok=true, rol inactivo.",
    expectedResponse: {
      ok: true,
      data: {
        role: {
          id: createdRoleId || "number",
          isActive: false,
        },
      },
    },
    fn: testDeactivateRole,
  });

  await runTest(results, {
    name: "Activar rol",
    before: "Existe rol de prueba inactivo.",
    action: "POST /roles/:roleId/activate.",
    expected: "HTTP 200, ok=true, rol activo.",
    expectedResponse: {
      ok: true,
      data: {
        role: {
          id: createdRoleId || "number",
          isActive: true,
        },
      },
    },
    fn: testActivateRole,
  });

  await runTest(results, {
    name: "Rol creado aparece en listado",
    before: "Rol creado/editado/activado.",
    action: "GET /roles y busca el roleKey creado.",
    expected: "HTTP 200 y el listado debe contener el rol de prueba.",
    expectedResponse: {
      ok: true,
      data: {
        roles: [
          {
            id: createdRoleId || "number",
            roleKey: TEST_ROLE.roleKey,
          },
        ],
      },
    },
    fn: testListContainsCreatedRole,
  });

  printResults(results, "RESULTADOS ROLES");

  return {
    passed: !results.hasFailed(),
    failed: results.hasFailed(),
    total: results.all().length,
  };
}

async function interactiveMenu() {
  const rl = readline.createInterface({ input, output });

  while (true) {
    title("NOMINACES - TEST ROLES");
    info("Base URL:", BASE_URL);
    info("Usuario admin:", ADMIN_USER.username);
    info("Cookie en memoria:", cookieJar ? "Sí" : "No");

    console.log("");
    console.log("1) Ejecutar flujo completo Roles");
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