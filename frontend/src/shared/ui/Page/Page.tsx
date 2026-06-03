// ======================================================
// PATH: src/shared/ui/Page/Page.tsx
// Layout base reutilizable para pantallas del sistema
// ======================================================

import type { ReactNode } from "react";
import "./page.css";

/**
 * Propiedades del layout Page.
 *
 * Responsabilidades:
 * - Estandarizar encabezado, título, descripción y acciones.
 * - Evitar que cada pantalla repita estructura visual.
 *
 * No debe:
 * - Contener lógica de negocio.
 * - Hacer llamadas HTTP.
 * - Conocer módulos específicos como Usuarios, Roles o Login.
 */
export type PageProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Layout principal para páginas internas.
 *
 * Uso recomendado:
 * <Page title="Usuarios" actions={<Button>Nuevo</Button>}>
 *   contenido
 * </Page>
 */
export function Page({
  eyebrow,
  title,
  description,
  actions,
  children
}: PageProps) {
  return (
    <section className="app-page">
      <header className="app-page__header">
        <div className="app-page__heading">
          {eyebrow && <p className="app-page__eyebrow">{eyebrow}</p>}

          <h1 className="app-page__title">{title}</h1>

          {description && (
            <p className="app-page__description">{description}</p>
          )}
        </div>

        {actions && <div className="app-page__actions">{actions}</div>}
      </header>

      <div className="app-page__content">{children}</div>
    </section>
  );
}