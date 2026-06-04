// ======================================================
// PATH: src/shared/ui/Page/Page.tsx
// Estructura visual base para páginas internas
// ======================================================

/**
 * Responsabilidades:
 * - Unificar encabezado, ruta, título, descripción y acciones de páginas.
 * - Dar una estructura consistente a módulos como usuarios, roles y permisos.
 * - Evitar duplicar diseño base en cada pantalla.
 * - Permitir breadcrumbs visuales con última sección destacada.
 *
 * No debe:
 * - Contener lógica de negocio.
 * - Consultar APIs.
 * - Definir contenido específico de módulos.
 */

import type { ReactNode } from "react";

import "./page.css";

/**
 * Props del componente Page.
 */
export type PageProps = {
  /**
   * Ruta visual superior.
   *
   * Ejemplos:
   * Administración / Permisos
   * Administración › Permisos
   */
  breadcrumb?: string;

  /**
   * Compatibilidad con páginas que ya usaban eyebrow.
   */
  eyebrow?: string;

  /**
   * Título principal de la página.
   */
  title: string;

  /**
   * Descripción breve de la pantalla.
   */
  description?: string;

  /**
   * Acciones principales de la pantalla.
   *
   * Ejemplo:
   * Botón actualizar, crear, exportar.
   */
  actions?: ReactNode;

  /**
   * Contenido propio de cada página.
   */
  children: ReactNode;

  /**
   * Clase opcional para ajustes puntuales sin modificar el componente base.
   */
  className?: string;
};

/**
 * Divide una ruta visual en partes limpias.
 *
 * Acepta separadores comunes para que las páginas puedan enviar:
 * - "Administración / Permisos"
 * - "Administración › Permisos"
 * - "Administración > Permisos"
 */
function getBreadcrumbParts(value: string): string[] {
  return value
    .split(/\/|›|>/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Renderiza el breadcrumb con separadores visuales.
 *
 * La última parte se marca como actual para poder destacarla
 * visualmente desde CSS.
 */
function renderBreadcrumb(value: string) {
  const parts = getBreadcrumbParts(value);

  if (parts.length === 0) {
    return null;
  }

  return parts.map((part, index) => {
    const isLast = index === parts.length - 1;

    return (
      <span
        key={`${part}-${index}`}
        className={
          isLast
            ? "app-page__breadcrumb-item app-page__breadcrumb-item--current"
            : "app-page__breadcrumb-item"
        }
      >
        {index > 0 ? (
          <span className="app-page__breadcrumb-separator" aria-hidden="true">
            ›
          </span>
        ) : null}

        <span>{part}</span>
      </span>
    );
  });
}

/**
 * Contenedor estándar para páginas autenticadas.
 */
export function Page({
  breadcrumb,
  eyebrow,
  title,
  description,
  actions,
  children,
  className
}: PageProps) {
  const visibleBreadcrumb = breadcrumb ?? eyebrow;

  return (
    <main className={["app-page", className].filter(Boolean).join(" ")}>
      <section className="app-page__header">
        <div className="app-page__heading">
          

          <h1 className="app-page__title">{title}</h1>

          {visibleBreadcrumb ? (
            <nav className="app-page__breadcrumb" aria-label="Ruta de página">
              {renderBreadcrumb(visibleBreadcrumb)}
            </nav>
          ) : null}

          {description ? (
            <p className="app-page__description">{description}</p>
          ) : null}
        </div>

      </section>

      <section className="app-page__content">{children}</section>
    </main>
  );
}