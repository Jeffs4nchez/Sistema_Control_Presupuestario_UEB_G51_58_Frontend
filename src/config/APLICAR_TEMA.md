# 📝 Guía de Aplicación del Tema - Componentes

Esta guía explica cómo aplicar el nuevo sistema de temas a cada componente de la aplicación SIN afectar la funcionalidad.

## 🎯 Principios

1. **Solo Estilos** - Cambiar colores/tipografía, NO cambiar HTML ni funcionalidad
2. **Consistencia** - Usar siempre `theme.colors`, `theme.typography`, etc.
3. **Responsive** - Usar `getResponsive()` para valores que cambian en mobile
4. **Gradual** - Aplicar de arriba hacia abajo (componentes más grandes primero)

---

## 🔄 Plan de Aplicación

### Fase 1: Componentes Principales (Prioridad Alta)
- [ ] Login (YA COMPLETADO ✅)
- [ ] LoadingScreen (YA COMPLETADO ✅)
- [ ] Navbar/Header
- [ ] Sidebar
- [ ] Footer

### Fase 2: Componentes de Formulario
- [ ] Botones
- [ ] Inputs
- [ ] Selects
- [ ] Checkboxes
- [ ] Switches

### Fase 3: Componentes de Contenido
- [ ] Cards
- [ ] Tablas
- [ ] Modales
- [ ] Alertas
- [ ] Notificaciones

### Fase 4: Extras
- [ ] Gráficos/Charts
- [ ] Badge/Tags
- [ ] Tooltips
- [ ] Dropdowns

---

## 📐 Patrón de Aplicación

### Paso 1: Importar el tema

```jsx
import { theme } from '../config/theme';
```

### Paso 2: Identificar colores actuales

Lee el componente actual e identifica:
- Colores de fondo
- Colores de texto
- Colores de bordes
- Colores en estados (hover, active, disabled)

### Paso 3: Mapear a los nuevos colores

Relaciona colores actuales con colores UEB:

```
Color Actual    →  Color UEB Nuevo
#1a73e8         →  theme.colors.primary (o accent.blue)
#ffffff         →  theme.colors.secondary
#dc2626         →  theme.colors.state.error
#7cb342         →  theme.colors.state.success
etc...
```

### Paso 4: Aplicar el tema

Reemplaza valores hardcodeados con referencias del tema.

---

## 🎨 Paleta Recomendada por Componente

### Navegación (Navbar/Sidebar)

```javascript
// Fondo
background: theme.colors.primary      // Azul UEB

// Texto
color: theme.colors.secondary         // Blanco
hoverText: theme.colors.accent.yellow // Amarillo hover

// Items activos
activeBg: theme.colors.accent.blue    // Azul claro
activeText: theme.colors.secondary    // Blanco
```

### Botones

```javascript
// Primario
primary: {
  background: theme.colors.primary,
  color: theme.colors.secondary,
  hover: theme.colors.accent.blue
}

// Secundario
secondary: {
  background: theme.colors.accent.blue,
  color: theme.colors.secondary,
  hover: theme.colors.primary
}

// Éxito
success: {
  background: theme.colors.state.success,
  color: theme.colors.secondary
}

// Error/Danger
danger: {
  background: theme.colors.state.error,
  color: theme.colors.secondary
}
```

### Tarjetas (Cards)

```javascript
// Contenedor
background: theme.colors.secondary    // Blanco
border: theme.colors.gray['300']      // Gris claro
borderRadius: theme.border.radiusMd   // 8px
boxShadow: theme.shadow.md            // Sombra suave

// Título
titleColor: theme.colors.text.primary
fontSize: theme.typography.fontSize['2xl']
fontWeight: theme.typography.fontWeight.bold

// Contenido
textColor: theme.colors.text.primary
fontSize: theme.typography.fontSize.base
```

### Tablas

```javascript
// Header
headerBg: theme.colors.primary
headerText: theme.colors.secondary
headerFont: theme.typography.fontWeight.bold

// Rows
rowBg: theme.colors.secondary
rowText: theme.colors.text.primary
rowBorder: theme.colors.gray['200']
hoverBg: theme.colors.gray['100']

// Alternancia
alternateRowBg: theme.colors.gray['50']
```

### Modales

```javascript
// Overlay
overlay: 'rgba(0, 0, 0, 0.5)'
zIndex: theme.zIndex.modal             // 900

// Contenedor
background: theme.colors.secondary     // Blanco
borderRadius: theme.border.radiusLg    // 16px
boxShadow: theme.shadow.xl

// Header
headerBg: theme.colors.primary
headerText: theme.colors.secondary
```

### Alertas y Notificaciones

```javascript
// Éxito
success: {
  bg: theme.colors.success.light,
  border: theme.colors.state.success,
  text: theme.colors.success.text,
  icon: '✓'
}

// Error
error: {
  bg: theme.colors.error.light,
  border: theme.colors.state.error,
  text: theme.colors.error.text,
  icon: '✕'
}

// Warning
warning: {
  bg: theme.colors.warning.light,
  border: theme.colors.state.warning,
  text: theme.colors.warning.text,
  icon: '⚠️'
}

// Info
info: {
  bg: theme.colors.info.light,
  border: theme.colors.state.info,
  text: theme.colors.info.text,
  icon: 'ℹ️'
}
```

---

## 🖼️ Ejemplo Práctico: Botón

### Antes (Hardcoded)

```jsx
<button style={{
  background: '#1a73e8',
  color: 'white',
  padding: '0.75rem 1.5rem',
  borderRadius: '4px',
  border: 'none',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease'
}}>
  Click me
</button>
```

### Después (Con Tema)

```jsx
import { theme } from '../config/theme';

<button style={{
  background: theme.colors.primary,
  color: theme.colors.secondary,
  padding: theme.components.button.padding.md,
  borderRadius: theme.border.radiusSmall,
  border: 'none',
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeight.medium,
  cursor: 'pointer',
  boxShadow: theme.shadow.sm,
  transition: theme.transition.normal,
  fontFamily: theme.typography.fontFamily
}}>
  Click me
</button>
```

---

## ✅ Checklist de Aplicación

Para cada componente aplicar:

- [ ] Importar `theme`
- [ ] Cambiar background colors
- [ ] Cambiar text colors
- [ ] Cambiar border colors
- [ ] Cambiar shadow
- [ ] Cambiar border-radius
- [ ] Cambiar font-family
- [ ] Cambiar font-size
- [ ] Cambiar font-weight
- [ ] Cambiar padding/margin (si aplica)
- [ ] Testear en desktop
- [ ] Testear en mobile
- [ ] Verificar que la funcionalidad sigue igual

---

## 🚀 Orden Recomendado de Aplicación

1. **Login** ✅ (ya hecho)
2. **LoadingScreen** ✅ (ya hecho)
3. **Dashboard/Layout Principal** (estructura base)
4. **Header/Navbar** (navegación principal)
5. **Sidebar** (navegación lateral)
6. **Formularios** (inputs, buttons)
7. **Tablas** (listados)
8. **Modales** (popups)
9. **Cards** (componentes genéricos)
10. **Alertas** (notificaciones)

---

## 🔗 Referencias Rápidas

### Colores Más Usados

```javascript
// Primario (Login, principal)
theme.colors.primary           // #003358

// Secundarios (botones, acentos)
theme.colors.accent.red        // Rojo
theme.colors.accent.green      // Verde
theme.colors.accent.blue       // Azul claro
theme.colors.accent.purple     // Púrpura

// Estados
theme.colors.state.success     // Verde
theme.colors.state.error       // Rojo
theme.colors.state.warning     // Amarillo
theme.colors.state.info        // Azul

// Grises
theme.colors.gray['100']       // Casi blanco
theme.colors.gray['300']       // Gris claro
theme.colors.gray['500']       // Gris medio
theme.colors.gray['800']       // Gris oscuro

// Texto
theme.colors.text.primary      // Principal
theme.colors.text.secondary    // Secundario
theme.colors.text.light        // Claro
```

### Tamaños Comunes

```javascript
theme.typography.fontSize.sm   // Labels, small text
theme.typography.fontSize.base // Body text
theme.typography.fontSize.lg   // Subtitle
theme.typography.fontSize['2xl'] // Card title
theme.typography.fontSize['5xl'] // Page title

theme.spacing.md               // Padding pequeño
theme.spacing.lg               // Padding normal
theme.spacing.xl               // Padding grande

theme.border.radiusSmall       // Inputs
theme.border.radiusMd          // Cards
theme.border.radiusLg          // Modales

theme.shadow.sm                // Hover
theme.shadow.md                // Cards
theme.shadow.lg                // Modales
```

---

## 🆘 Troubleshooting

**P: Los colores se ven diferentes**  
R: Verifica que estés usando `theme.colors` correctamente y no valores hardcodeados

**P: La tipografía no cambia**  
R: Asegúrate de aplicar `fontFamily: theme.typography.fontFamily`

**P: Se rompió la funcionalidad**  
R: Solo cambiamos CSS, revisa que no hayas modificado HTML o lógica

**P: ¿Puedo mezclar colores viejos y nuevos?**  
R: No recomendado. Intenta aplicar el tema completo a cada componente.

---

## 📚 Documentación Relacionada

- [theme.js](./theme.js) - Configuración completa
- [README.md](./README.md) - Guía de uso del tema

---

**Última actualización**: Mayo 7, 2026  
**Estado**: En progreso  
**Responsable**: Sistema de Control Presupuestario G51/58
