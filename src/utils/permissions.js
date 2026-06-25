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
const APROBADORES = [ROLES.DIRECTOR, ROLES.ANALISTA_3, ROLES.ADMIN];
const OPERATIVOS  = [ROLES.DIRECTOR, ROLES.ANALISTA, ROLES.ANALISTA_3, ROLES.ADMIN];
const TODOS       = [ROLES.DIRECTOR, ROLES.ANALISTA, ROLES.ANALISTA_3, ROLES.TALENTO_HUMANO, ROLES.RECTOR, ROLES.ADMIN];

// Si el usuario tiene permisos RBAC cargados, los usa; si no, aplica la regla de rol como fallback.
const permiso = (u, modulo, accion, fallback) => {
  if (u?.permisos) return (u.permisos[modulo] || []).includes(accion);
  return fallback(u);
};

export const can = {
  // Sidebar / acceso a módulos — basados en rol, no sujetos a RBAC dinámico
  verInicio:               () => true,
  verEstructura:           (u) => hasRole(u, DIRECTORES),
  verCedula:               (u) => hasRole(u, [...OPERATIVOS, ROLES.RECTOR, ROLES.TALENTO_HUMANO]),
  verUsuarios:             (u) => hasRole(u, DIRECTORES),
  verReportes:             (u) => hasRole(u, TODOS),
  verAuditoria:            (u) => hasRole(u, DIRECTORES),
  verPermisos:             (u) => hasRole(u, DIRECTORES),
  verEntidadRequiriente:   (u) => hasRole(u, OPERATIVOS),
  verPresupuesto:          (u) => hasRole(u, OPERATIVOS),
  exportarTodosReportes:   (u) => hasRole(u, [ROLES.DIRECTOR, ROLES.RECTOR, ROLES.ADMIN]),

  // Certificaciones — controladas por RBAC dinámico
  verCertificacion:        (u) => permiso(u, 'certificaciones', 'ver',      () => hasRole(u, OPERATIVOS)),
  crearCertificacion:      (u) => permiso(u, 'certificaciones', 'crear',    () => hasRole(u, OPERATIVOS)),
  editarCertificacion:     (u) => permiso(u, 'certificaciones', 'crear',    () => hasRole(u, OPERATIVOS)),
  aprobarCertificacion:    (u) => permiso(u, 'certificaciones', 'aprobar',  () => hasRole(u, APROBADORES)),
  rechazarCertificacion:   (u) => permiso(u, 'certificaciones', 'rechazar', () => hasRole(u, APROBADORES)),
  marcarErrado:            (u) => permiso(u, 'certificaciones', 'errar',    () => hasRole(u, [ROLES.DIRECTOR, ROLES.ANALISTA, ROLES.ADMIN])),
  reenviarCertificacion:   (u) => permiso(u, 'certificaciones', 'reenviar', () => hasRole(u, OPERATIVOS)),
  verTodosLosCerts:        (u) => permiso(u, 'certificaciones', 'aprobar',  () => hasRole(u, APROBADORES)),

  // Liquidaciones — controladas por RBAC dinámico
  verLiquidaciones:        (u) => permiso(u, 'liquidaciones', 'ver',      () => hasRole(u, OPERATIVOS)),
  registrarLiquidacion:    (u) => permiso(u, 'liquidaciones', 'crear',    () => hasRole(u, OPERATIVOS)),
  anularLiquidacion:       (u) => permiso(u, 'liquidaciones', 'anular',   () => hasRole(u, DIRECTORES)),
  eliminarLiquidacion:     (u) => permiso(u, 'liquidaciones', 'eliminar', () => hasRole(u, DIRECTORES)),
};
