// ======================================================
// PATH: src/shared/ui/Page/Page.tsx
// Contenedor reutilizable para páginas internas
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar la estructura base de páginas internas.
 * - Aplicar clases globales definidas en src/styles/pages/pages.css.
 * - Estandarizar el fondo, espaciado y ancho de las pantallas.
 * - Permitir encabezado, alertas y contenido principal.
 * - Reutilizar la misma estructura visual en módulos administrativos.
 *
 * No debe:
 * - Definir estilos inline.
 * - Importar CSS específico de módulos.
 * - Conocer reglas de usuarios, roles, permisos o catálogos.
 * - Renderizar KPIs por sí mismo.
 * - Renderizar tablas por sí mismo.
 * - Contener lógica de negocio.
 */

import type { ReactNode } from "react";

export type PageVariant = "default" | "compact" | "wide" | "flush";

export type PageContentVariant = "default" | "table" | "plain" | "tight";

export type PageProps = {
  children: ReactNode;
  header?: ReactNode;
  alert?: ReactNode;
  variant?: PageVariant;
  contentVariant?: PageContentVariant;
  className?: string;
  bodyClassName?: string;
  contentClassName?: string;
};

/**
 * Construye la clase raíz de la página según la variante solicitada.
 */
function getPageClassName(
  variant: PageVariant,
  className?: string
): string {
  const classes = ["page"];

  if (variant !== "default") {
    classes.push(`page--${variant}`);
  }

  if (className) {
    classes.push(className);
  }

  return classes.join(" ");
}

/**
 * Construye la clase del cuerpo de la página.
 */
function getPageBodyClassName(className?: string): string {
  const classes = ["page-body"];

  if (className) {
    classes.push(className);
  }

  return classes.join(" ");
}

/**
 * Construye la clase del contenido principal según la variante solicitada.
 */
function getPageContentClassName(
  variant: PageContentVariant,
  className?: string
): string {
  const classes = ["page-content"];

  if (variant !== "default") {
    classes.push(`page-content--${variant}`);
  }

  if (className) {
    classes.push(className);
  }

  return classes.join(" ");
}

/**
 * Contenedor base para pantallas internas del sistema.
 */
export function Page({
  children,
  header,
  alert,
  variant = "default",
  contentVariant = "default",
  className,
  bodyClassName,
  contentClassName
}: PageProps) {
  return (
    <main className={getPageClassName(variant, className)}>
      {header}

      <section className={getPageBodyClassName(bodyClassName)}>
        {alert}

        <div
          className={getPageContentClassName(
            contentVariant,
            contentClassName
          )}
        >
          {children}
        </div>
      </section>
    </main>
  );
}