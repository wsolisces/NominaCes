// ======================================================
// PATH: src/components/icons/Icons.tsx
// Iconos SVG reutilizables del sistema
// Estilo corporativo blanco/negro
// ======================================================

import { memo } from "react";
import type { SVGProps } from "react";

/**
 * Props base para todos los iconos SVG internos.
 *
 * Permite usar:
 * - className
 * - aria-label
 * - onClick
 * - style
 * - width / height
 * - title
 */
export type SystemIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/**
 * Props alias para compatibilidad con archivos anteriores.
 */
export type IconProps = SystemIconProps;

/**
 * BaseIcon
 *
 * Wrapper estándar para iconos del sistema.
 *
 * Ventajas:
 * - Stroke consistente.
 * - Accesibilidad controlada.
 * - Tamaño default uniforme.
 * - Evita repetir configuración SVG.
 */
export function BaseIcon({
  children,
  className = "h-5 w-5",
  title,
  ...props
}: SystemIconProps) {
  const ariaLabel = props["aria-label"];

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      role={ariaLabel ? "img" : "presentation"}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ======================================================
   ICONOS GENERALES
====================================================== */

/**
 * Menú hamburguesa.
 */
export const IconMenu = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M3 6h18" />
    <path d="M3 12h18" />
    <path d="M3 18h18" />
  </BaseIcon>
));

/**
 * Buscar.
 */
export const IconSearch = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </BaseIcon>
));

/**
 * Notificaciones.
 */
export const IconBell = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </BaseIcon>
));

/**
 * Mensajes.
 */
export const IconMessage = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </BaseIcon>
));

/**
 * Ayuda.
 */
export const IconHelp = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
    <path d="M12 17h.01" />
  </BaseIcon>
));

/**
 * Flecha derecha.
 */
export const IconChevronRight = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M9 18l6-6-6-6" />
  </BaseIcon>
));

/**
 * Flecha izquierda.
 */
export const IconChevronLeft = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M15 18l-6-6 6-6" />
  </BaseIcon>
));

/**
 * Flecha abajo.
 */
export const IconChevronDown = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M6 9l6 6 6-6" />
  </BaseIcon>
));

/**
 * Flecha arriba.
 */
export const IconChevronUp = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M18 15l-6-6-6 6" />
  </BaseIcon>
));

/**
 * Cerrar / X.
 */
export const IconX = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </BaseIcon>
));

/**
 * Check / correcto.
 */
export const IconCheck = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </BaseIcon>
));

/**
 * Agregar.
 */
export const IconPlus = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </BaseIcon>
));

/**
 * Quitar.
 */
export const IconMinus = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M5 12h14" />
  </BaseIcon>
));

/**
 * Editar.
 */
export const IconEdit = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </BaseIcon>
));

/**
 * Eliminar.
 */
export const IconTrash = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 15H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </BaseIcon>
));

/**
 * Descargar / exportar.
 */
export const IconDownload = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </BaseIcon>
));

/**
 * Subir / importar.
 */
export const IconUpload = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 21V9" />
    <path d="M7 14l5-5 5 5" />
    <path d="M5 3h14" />
  </BaseIcon>
));

/**
 * Guardar.
 */
export const IconSave = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M5 3h12l2 2v16H5V3Z" />
    <path d="M8 3v6h8V3" />
    <path d="M8 21v-7h8v7" />
  </BaseIcon>
));

/**
 * Filtro.
 */
export const IconFilter = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M3 5h18" />
    <path d="M6 12h12" />
    <path d="M10 19h4" />
  </BaseIcon>
));

/**
 * Configuración.
 */
export const IconSettings = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="3.25" />
    <path d="M19.4 15a2 2 0 0 0 .4 2.2l.05.05a1.75 1.75 0 1 1-2.47 2.47l-.05-.05A2 2 0 0 0 15 19.4a2 2 0 0 0-1.5 1.9V22a2 2 0 1 1-3 0v-.7A2 2 0 0 0 9 19.4a2 2 0 0 0-2.33-.28l-.05.05A1.75 1.75 0 1 1 4.15 16.7l.05-.05A2 2 0 0 0 4.6 15a2 2 0 0 0-1.9-1.5H2a2 2 0 1 1 0-3h.7A2 2 0 0 0 4.6 9a2 2 0 0 0-.28-2.33l-.05-.05A1.75 1.75 0 1 1 6.74 4.15l.05.05A2 2 0 0 0 9 4.6a2 2 0 0 0 1.5-1.9V2a2 2 0 1 1 3 0v.7A2 2 0 0 0 15 4.6a2 2 0 0 0 2.33-.28l.05-.05a1.75 1.75 0 1 1 2.47 2.47l-.05.05A2 2 0 0 0 19.4 9c0 .7.3 1.35.7 1.9h.9a2 2 0 1 1 0 3h-.9a2.9 2.9 0 0 1-.7 1.1Z" />
  </BaseIcon>
));

/**
 * Ojo visible.
 *
 * Se usa para mostrar contraseña.
 */
export const IconEye = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3.2" />
  </BaseIcon>
));

/**
 * Ojo oculto.
 *
 * Se usa para ocultar contraseña.
 */
export const IconEyeOff = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.75 5.72A10.2 10.2 0 0 1 12 5.6c6 0 9.5 6.4 9.5 6.4a15.3 15.3 0 0 1-3.08 4.08" />
    <path d="M6.45 6.58C3.88 8.42 2.5 12 2.5 12s3.5 6.4 9.5 6.4a9.8 9.8 0 0 0 4.1-.9" />
    <path d="M9.95 9.95a3.2 3.2 0 0 0 4.1 4.1" />
  </BaseIcon>
));

/**
 * Spinner circular.
 *
 * La animación se controla desde className:
 *
 * className="h-4 w-4 animate-spin"
 */
export const IconSpinner = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="9" opacity="0.22" />
    <path d="M12 3a9 9 0 0 1 9 9" />
  </BaseIcon>
));

/**
 * Salir / cerrar sesión.
 */
export const IconLogout = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M10 6H6.8A1.8 1.8 0 0 0 5 7.8v8.4A1.8 1.8 0 0 0 6.8 18H10" />
    <path d="M14 8l4 4-4 4" />
    <path d="M18 12H9" />
  </BaseIcon>
));

/* ======================================================
   ICONOS DE NAVEGACIÓN / SIDEBAR
====================================================== */

/**
 * Panel principal.
 */
export const IconPanel = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 18v3" />
    <path d="M7 9h4" />
    <path d="M7 13h7" />
    <path d="M16.5 9h.01" />
  </BaseIcon>
));

/**
 * Nómina.
 */
export const IconNomina = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3 10h18" />
    <path d="M8 15h3" />
    <path d="M14 15h2" />
    <path d="M8 18h6" />
  </BaseIcon>
));

/**
 * Cálculos.
 */
export const IconCalculos = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8" />
    <path d="M8 11h2" />
    <path d="M12 11h2" />
    <path d="M16 11h.01" />
    <path d="M8 15h2" />
    <path d="M12 15h2" />
    <path d="M16 15h.01" />
  </BaseIcon>
));

/**
 * Catálogos.
 */
export const IconCatalogos = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
    <path d="M8 7h8" />
    <path d="M8 11h7" />
    <path d="M6.5 19H20" />
  </BaseIcon>
));

/**
 * Empleados.
 */
export const IconEmpleados = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="9" cy="7" r="4" />
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <path d="M16 3.2a4 4 0 0 1 0 7.6" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
  </BaseIcon>
));

/**
 * Costos.
 */
export const IconCostos = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 3v18" />
    <path d="M17 7.5c0-1.4-1.8-2.5-4.2-2.5H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H9.5C7.6 17 6 16 6 14.5" />
  </BaseIcon>
));

/**
 * Headcount / Plantilla.
 */
export const IconHeadcount = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 19V5" />
    <path d="M4 19h17" />
    <rect x="7" y="11" width="3" height="5" rx="1" />
    <rect x="12" y="7" width="3" height="9" rx="1" />
    <rect x="17" y="9" width="3" height="7" rx="1" />
  </BaseIcon>
));

/**
 * Inicio.
 */
export const IconHome = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9v12h14V9" />
    <path d="M9 21v-6h6v6" />
  </BaseIcon>
));

/**
 * Gráfica.
 */
export const IconChart = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M3 3v18h18" />
    <rect x="7" y="11" width="3" height="7" rx="1" />
    <rect x="12" y="7" width="3" height="11" rx="1" />
    <rect x="17" y="9" width="3" height="9" rx="1" />
  </BaseIcon>
));

/**
 * Dinero / importes.
 */
export const IconMoney = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 12h.01" />
    <path d="M18 12h.01" />
  </BaseIcon>
));

/**
 * Usuarios.
 */
export const IconUsers = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="9" cy="7" r="4" />
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <path d="M16 3.2a4 4 0 0 1 0 7.6" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
  </BaseIcon>
));

/**
 * Usuario individual.
 */
export const IconUser = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="7" r="4" />
    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
  </BaseIcon>
));

/**
 * Alias español para módulos existentes.
 */
export const IconUsuarios = IconUsers;

/**
 * Base de datos.
 */
export const IconDatabase = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
    <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </BaseIcon>
));

/**
 * Documento SAT / fiscal.
 */
export const IconSAT = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <circle cx="9" cy="9" r="1.8" />
    <circle cx="15" cy="9" r="1.8" />
    <circle cx="12" cy="14" r="1.8" />
  </BaseIcon>
));

/**
 * Libro / manual / catálogo.
 */
export const IconBook = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M3 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H3V4Z" />
    <path d="M21 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7V4Z" />
  </BaseIcon>
));

/**
 * Construcción / módulo pendiente.
 */
export const IconConstruccion = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M14.7 6.3a4.2 4.2 0 0 0 5 5L12.4 18.6a2.4 2.4 0 1 1-3.4-3.4l7.3-7.3a4.2 4.2 0 0 1-1.6-1.6Z" />
    <path d="M5 5l4 4" />
    <path d="M4 3 3 4l3 5h2l3 3" />
  </BaseIcon>
));

/**
 * Calculadora.
 *
 * Alias visual para módulos que importaban IconCalculator.
 */
export const IconCalculator = IconCalculos;

/**
 * Recargar.
 */
export const IconRefresh = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M20 6v5h-5" />
    <path d="M4 18v-5h5" />
    <path d="M18.6 9A7 7 0 0 0 6.1 6.8L4 9" />
    <path d="M5.4 15A7 7 0 0 0 17.9 17.2L20 15" />
  </BaseIcon>
));

/**
 * Calendario.
 */
export const IconCalendar = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M3 10h18" />
  </BaseIcon>
));

/**
 * Candado cerrado.
 */
export const IconLock = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </BaseIcon>
));

/**
 * Candado abierto.
 */
export const IconUnlock = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 7.5-2" />
  </BaseIcon>
));

/**
 * Advertencia.
 */
export const IconWarning = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 3 22 20H2L12 3Z" />
    <path d="M12 9v5" />
    <path d="M12 17h.01" />
  </BaseIcon>
));

/**
 * Información.
 */
export const IconInfo = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 11v6" />
    <path d="M12 7h.01" />
  </BaseIcon>
));

/**
 * Error / círculo con X.
 */
export const IconError = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6" />
    <path d="M9 9l6 6" />
  </BaseIcon>
));

/**
 * Éxito / círculo con check.
 */
export const IconSuccess = memo((props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-6" />
  </BaseIcon>
));