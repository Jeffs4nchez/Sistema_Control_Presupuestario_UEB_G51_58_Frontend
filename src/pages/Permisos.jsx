import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ShieldCheck, Save, RefreshCw, CheckSquare, Square } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const CARGOS = [
  'Director(a) financiero',
  'Analista de presupuesto 1',
  'Analista de presupuesto 3',
  'Director(a) de talento humano',
  'Rector',
  'Administrador del sistema',
];

const CARGO_LABELS = {
  'Director(a) financiero':          'Dir. Financiero',
  'Analista de presupuesto 1':       'Analista 1',
  'Analista de presupuesto 3':       'Analista 3',
  'Director(a) de talento humano':   'Dir. T. Humano',
  'Rector':                          'Rector',
  'Administrador del sistema':       'Administrador',
};

const ACCION_LABELS = {
  ver:      'Ver',
  crear:    'Crear',
  aprobar:  'Aprobar',
  rechazar: 'Rechazar',
  reenviar: 'Reenviar',
  errar:    'Errar',
  anular:   'Anular',
  eliminar: 'Eliminar',
};

const COLORS = {
  bg:     '#f8fafd',
  card:   '#ffffff',
  border: 'rgba(46,108,164,0.14)',
  accent: '#2e6ca4',
  text:   '#1a3a5c',
  muted:  '#5a7a9f',
  green:  '#2ea466',
  red:    '#a42e2e',
};

const headers = () => ({ Authorization: `Bearer ${Cookies.get('auth_token')}` });

export default function Permisos() {
  const [matriz, setMatriz]   = useState({});
  const [modulos, setModulos] = useState({});
  const [dirty, setDirty]     = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const cargarPermisos = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await axios.get(`${API_BASE}/permisos`, { headers: headers() });
      if (res.data.success) {
        const modsData = res.data.modulos || {};
        setModulos(modsData);
        const data = res.data.data || {};
        const full = {};
        for (const cargo of CARGOS) {
          full[cargo] = {};
          for (const modulo of Object.keys(modsData)) {
            full[cargo][modulo] = (data[cargo]?.[modulo] || []).slice();
          }
        }
        setMatriz(full);
        setDirty({});
      }
    } catch {
      setMsg({ tipo: 'error', texto: 'Error al cargar los permisos' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarPermisos(); }, [cargarPermisos]);

  const toggle = (cargo, modulo, accion) => {
    setMatriz(prev => {
      const actual = prev[cargo]?.[modulo] || [];
      const siguiente = actual.includes(accion)
        ? actual.filter(a => a !== accion)
        : [...actual, accion];
      return { ...prev, [cargo]: { ...prev[cargo], [modulo]: siguiente } };
    });
    setDirty(prev => ({ ...prev, [`${cargo}|${modulo}`]: true }));
  };

  const guardar = async () => {
    const cambios = Object.keys(dirty).filter(k => dirty[k]);
    if (!cambios.length) return;
    setSaving(true);
    setMsg(null);
    try {
      for (const clave of cambios) {
        const [cargo, modulo] = clave.split('|');
        await axios.put(`${API_BASE}/permisos`, {
          cargo,
          modulo,
          acciones: matriz[cargo]?.[modulo] || [],
        }, { headers: headers() });
      }
      setDirty({});
      setMsg({ tipo: 'ok', texto: 'Permisos guardados correctamente' });
    } catch {
      setMsg({ tipo: 'error', texto: 'Error al guardar los permisos' });
    } finally {
      setSaving(false);
    }
  };

  const hayDirty = Object.values(dirty).some(Boolean);

  return (
    <div style={{ padding: '24px', background: COLORS.bg, minHeight: '100%' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color={COLORS.accent} />
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: COLORS.text }}>Gestión de Permisos</h1>
            <p style={{ margin: 0, fontSize: '13px', color: COLORS.muted }}>Configure el acceso por cargo a cada módulo del sistema</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={cargarPermisos}
            disabled={loading || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: `1px solid ${COLORS.border}`,
              background: COLORS.card, color: COLORS.muted, cursor: 'pointer',
              fontSize: '13px', fontWeight: 500,
            }}
          >
            <RefreshCw size={14} />
            Recargar
          </button>
          <button
            onClick={guardar}
            disabled={!hayDirty || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: hayDirty && !saving ? COLORS.accent : '#b0c4de',
              color: '#fff', cursor: hayDirty && !saving ? 'pointer' : 'not-allowed',
              fontSize: '13px', fontWeight: 600,
            }}
          >
            <Save size={14} />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Mensaje de estado */}
      {msg && (
        <div style={{
          marginBottom: '16px', padding: '10px 16px', borderRadius: '8px',
          background: msg.tipo === 'ok' ? '#d1fae5' : '#fee2e2',
          color: msg.tipo === 'ok' ? '#065f46' : '#991b1b',
          fontSize: '13px', fontWeight: 500,
        }}>
          {msg.texto}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: COLORS.muted }}>Cargando permisos…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            background: COLORS.card, borderRadius: '12px',
            boxShadow: '0 1px 6px rgba(46,108,164,0.08)',
            fontSize: '13px',
          }}>
            <thead>
              {/* Fila de módulos */}
              <tr>
                <th style={{ ...thBase, width: '160px', borderBottom: `2px solid ${COLORS.border}` }} rowSpan={2}>
                  Cargo
                </th>
                {Object.entries(modulos).map(([modulo, acciones]) => (
                  <th
                    key={modulo}
                    colSpan={acciones.length}
                    style={{
                      ...thBase,
                      textAlign: 'center',
                      background: modulo === 'certificaciones' ? '#eff6ff' : '#f0fdf4',
                      color: modulo === 'certificaciones' ? '#1e40af' : '#166534',
                      borderBottom: `2px solid ${modulo === 'certificaciones' ? '#bfdbfe' : '#bbf7d0'}`,
                      textTransform: 'capitalize',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {modulo}
                  </th>
                ))}
              </tr>
              {/* Fila de acciones */}
              <tr>
                {Object.entries(modulos).flatMap(([modulo, acciones]) =>
                  acciones.map(accion => (
                    <th key={`${modulo}-${accion}`} style={{
                      ...thBase,
                      textAlign: 'center',
                      fontWeight: 500,
                      color: COLORS.muted,
                      borderBottom: `2px solid ${COLORS.border}`,
                      whiteSpace: 'nowrap',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}>
                      {ACCION_LABELS[accion] || accion}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {CARGOS.map((cargo, idx) => {
                const rowDirty = Object.entries(dirty).some(([k, v]) => v && k.startsWith(`${cargo}|`));
                return (
                  <tr
                    key={cargo}
                    style={{
                      background: rowDirty
                        ? '#fffbeb'
                        : idx % 2 === 0 ? COLORS.card : '#f8fafd',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{
                      ...tdBase,
                      fontWeight: 600,
                      color: COLORS.text,
                      borderRight: `1px solid ${COLORS.border}`,
                    }}>
                      {CARGO_LABELS[cargo] || cargo}
                      {rowDirty && (
                        <span style={{ marginLeft: '6px', fontSize: '10px', color: '#d97706', fontWeight: 700 }}>●</span>
                      )}
                    </td>
                    {Object.entries(modulos).flatMap(([modulo, acciones]) =>
                      acciones.map(accion => {
                        const checked = (matriz[cargo]?.[modulo] || []).includes(accion);
                        return (
                          <td key={`${cargo}-${modulo}-${accion}`} style={{ ...tdBase, textAlign: 'center' }}>
                            <button
                              onClick={() => toggle(cargo, modulo, accion)}
                              title={checked ? 'Quitar permiso' : 'Dar permiso'}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '4px',
                                color: checked ? COLORS.green : '#cbd5e1',
                                transition: 'color 0.15s, transform 0.1s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              {checked
                                ? <CheckSquare size={18} strokeWidth={2.2} />
                                : <Square size={18} strokeWidth={1.5} />
                              }
                            </button>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '16px', fontSize: '12px', color: COLORS.muted }}>
        Los cambios aplican inmediatamente para los usuarios activos en su próxima acción.
        Las filas con <span style={{ color: '#d97706', fontWeight: 700 }}>●</span> tienen cambios pendientes de guardar.
      </p>
    </div>
  );
}

const thBase = {
  padding: '10px 14px',
  textAlign: 'left',
  fontWeight: 700,
  color: '#374151',
  background: '#f1f5f9',
  fontSize: '12px',
};

const tdBase = {
  padding: '10px 14px',
  borderBottom: '1px solid rgba(46,108,164,0.08)',
};
