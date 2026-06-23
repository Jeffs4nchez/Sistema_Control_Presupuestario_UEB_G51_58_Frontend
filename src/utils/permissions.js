export const ROLES = {
  DIRECTOR:       'Director(a) financiero',
  ANALISTA:       'Analista de presupuesto 1',
  ANALISTA_3:     'Analista de presupuesto 3',
  TALENTO_HUMANO: 'Director(a) de talento humano',
  RECTOR:         'Rector',
  ADMIN:          'Administrador del sistema',
};

export const hasRole = (user, roles) => {
  if (!user?.cargo) return false;
  return Array.isArray(roles) ? roles.includes(user.cargo) : user.cargo === roles;
};

const DIRECTORES  = [ROLES.DIRECTOR, ROLES.ADMIN];
// AP3 tiene los mismos permisos de aprobación/visibilidad que Director
const APROBADORES = [ROLES.DIRECTOR, ROLES.ANALISTA_3, ROLES.ADMIN];
const OPERATIVOS  = [ROLES.DIRECTOR, ROLES.ANALISTA, ROLES.ANALISTA_3, ROLES.ADMIN];
const TODOS       = [ROLES.DIRECTOR, ROLES.ANALISTA, ROLES.ANALISTA_3, ROLES.TALENTO_HUMANO, ROLES.RECTOR, ROLES.ADMIN];

export const can = {
  // Sidebar / acceso a módulos
  verInicio:               () => true,
  verEstructura:           (u) => hasRole(u, DIRECTORES),
  verCedula:               (u) => hasRole(u, [...OPERATIVOS, ROLES.RECTOR, ROLES.TALENTO_HUMANO]),
  verCertificacion:        (u) => hasRole(u, OPERATIVOS),
  verLiquidaciones:        (u) => hasRole(u, OPERATIVOS),
  verEntidadRequiriente:   (u) => hasRole(u, OPERATIVOS),
  verPresupuesto:          (u) => hasRole(u, OPERATIVOS),
  verUsuarios:             (u) => hasRole(u, DIRECTORES),
  verReportes:             (u) => hasRole(u, TODOS),
  verAuditoria:            (u) => hasRole(u, DIRECTORES),

  // Acciones sobre certificaciones
  crearCertificacion:      (u) => hasRole(u, OPERATIVOS),
  editarCertificacion:     (u) => hasRole(u, OPERATIVOS),
  aprobarCertificacion:    (u) => hasRole(u, APROBADORES),
  rechazarCertificacion:   (u) => hasRole(u, APROBADORES),
  marcarErrado:            (u) => hasRole(u, [ROLES.DIRECTOR, ROLES.ANALISTA, ROLES.ADMIN]),
  verTodosLosCerts:        (u) => hasRole(u, APROBADORES),

  // Acciones sobre liquidaciones
  registrarLiquidacion:    (u) => hasRole(u, OPERATIVOS),
  anularLiquidacion:       (u) => hasRole(u, DIRECTORES),   // solo Director/Admin

  // Reportes con scope amplio (todos vs solo propios)
  exportarTodosReportes:   (u) => hasRole(u, [ROLES.DIRECTOR, ROLES.RECTOR, ROLES.ADMIN]),
};
