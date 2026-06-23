# 🎨 Sistema de Temas - Guía de Estilos Visual UEB

## 📊 Descripción

El sistema de temas centraliza toda la configuración de diseño del proyecto UEB Sistema de Control Presupuestario. Incluye la paleta de colores completa UEB, tipografía Argentum Sans, y facilita mantener consistencia visual en toda la aplicación.

## 📁 Ubicación

```
frontend/src/config/theme.js
```

---

## 🎯 Paleta de Colores UEB

### 🔵 Colores Primarios

```javascript
theme.colors.primary        // #003358 - Azul institucional UEB
theme.colors.secondary      // #ffffff - Blanco
```

### 🌈 Colores Secundarios (Publicidad)

```javascript
theme.colors.accent.red     // #C41E3A - Rojo UEB
theme.colors.accent.blue    // #4A90E2 - Azul claro
theme.colors.accent.purple  // #7B2CBF - Púrpura
theme.colors.accent.yellow  // #FFD700 - Amarillo/Gold
theme.colors.accent.brown   // #6B4423 - Marrón
theme.colors.accent.green   // #7CB342 - Verde
```

**Uso recomendado:**
- Botones variados
- Tarjetas destacadas
- Gráficos y charts
- Indicadores de estado
- Elementos decorativos

### ✅ Colores de Estado

```javascript
theme.colors.state.success  // #7CB342 - Verde (éxito)
theme.colors.state.error    // #C41E3A - Rojo (error)
theme.colors.state.warning  // #FFD700 - Amarillo (advertencia)
theme.colors.state.info     // #4A90E2 - Azul (información)
```

### 🎨 Escala de Grises

```javascript
theme.colors.gray['100']    // #F5F5F5 - Casi blanco
theme.colors.gray['200']    // #E8E8E8 - Muy claro
theme.colors.gray['300']    // #D1D5DB - Claro
theme.colors.gray['400']    // #9CA3AF - Medio
theme.colors.gray['500']    // #6B7280 - Mediano
theme.colors.gray['600']    // #4B5563 - Oscuro
theme.colors.gray['700']    // #374151 - Más oscuro
theme.colors.gray['800']    // #1F2937 - Muy oscuro
theme.colors.gray['900']    // #111827 - Casi negro
```

---

## 🔤 Tipografía Argentum Sans

### Familia de Fuentes

```javascript
theme.typography.fontFamily  // Argentum Sans (primaria)
theme.typography.fontFamilyAlt // Sistema (fallback)
```

### Tamaños de Fuente

```javascript
theme.typography.fontSize.xs    // 12px
theme.typography.fontSize.sm    // 13px
theme.typography.fontSize.md    // 14px
theme.typography.fontSize.base  // 15px
theme.typography.fontSize.lg    // 16px
theme.typography.fontSize.xl    // 18px
theme.typography.fontSize['2xl']    // 20px
theme.typography.fontSize['3xl']    // 22px
theme.typography.fontSize['4xl']    // 24px
theme.typography.fontSize['5xl']    // 28px (títulos)
theme.typography.fontSize['6xl']    // 32px
theme.typography.fontSize['7xl']    // 36px
```

### Pesos de Fuente

```javascript
theme.typography.fontWeight.light      // 300
theme.typography.fontWeight.normal     // 400
theme.typography.fontWeight.medium     // 500
theme.typography.fontWeight.semibold   // 600
theme.typography.fontWeight.bold       // 700
theme.typography.fontWeight.extrabold  // 800
```

### Altura de Línea

```javascript
theme.typography.lineHeight.tight    // 1.2 (títulos)
theme.typography.lineHeight.normal   // 1.5 (body)
theme.typography.lineHeight.relaxed  // 1.75
theme.typography.lineHeight.loose    // 2
```

---

## 📏 Espaciados

Sistema de escala 0.25rem (4px):

```javascript
theme.spacing.xs        // 0.25rem (4px)
theme.spacing.sm        // 0.5rem  (8px)
theme.spacing.md        // 1rem    (16px)
theme.spacing.lg        // 1.5rem  (24px)
theme.spacing.xl        // 2rem    (32px)
theme.spacing['2xl']    // 2.5rem  (40px)
theme.spacing['3xl']    // 3rem    (48px)
theme.spacing['4xl']    // 4rem    (64px)
theme.spacing['5xl']    // 5rem    (80px)
theme.spacing['6xl']    // 6rem    (96px)
```

---

## 🧩 Componentes

### Botones

```javascript
theme.components.button.height.sm  // 32px
theme.components.button.height.md  // 40px
theme.components.button.height.lg  // 48px

theme.components.button.padding.sm // 0.5rem 1rem
theme.components.button.padding.md // 0.75rem 1.5rem
theme.components.button.padding.lg // 1rem 2rem
```

### Tarjetas

```javascript
theme.components.card.padding.sm   // 1rem
theme.components.card.padding.md   // 1.5rem
theme.components.card.padding.lg   // 2rem
```

### Sidebar

```javascript
theme.components.sidebar.width.collapsed  // 80px
theme.components.sidebar.width.expanded   // 280px
```

---

## 🎨 Ejemplos de Uso

### Botón Primario

```jsx
import { theme } from '../config/theme';

<button style={{
  background: theme.colors.primary,
  color: theme.colors.secondary,
  padding: theme.components.button.padding.md,
  borderRadius: theme.border.radiusSmall,
  fontSize: theme.typography.fontSize.base,
  fontWeight: theme.typography.fontWeight.medium,
  border: 'none',
  cursor: 'pointer',
  fontFamily: theme.typography.fontFamily,
  transition: theme.transition.normal,
  boxShadow: theme.shadow.md
}}>
  Click me
</button>
```

### Botón Secundario (con color accent)

```jsx
<button style={{
  background: theme.colors.accent.blue,
  color: theme.colors.secondary,
  padding: theme.components.button.padding.md,
  borderRadius: theme.border.radiusSmall,
  fontFamily: theme.typography.fontFamily,
  // ...resto de estilos
}}>
  Acción Secundaria
</button>
```

### Tarjeta con Éxito

```jsx
<div style={{
  background: theme.colors.success.light,
  border: `2px solid ${theme.colors.success.background}`,
  borderRadius: theme.border.radiusMd,
  padding: theme.components.card.padding.md,
  fontFamily: theme.typography.fontFamily
}}>
  <h3 style={{ color: theme.colors.success.text }}>✓ Operación Exitosa</h3>
  <p style={{ color: theme.colors.text.primary }}>El cambio se guardó correctamente</p>
</div>
```

### Alerta de Error

```jsx
<div style={{
  background: theme.colors.error.background,
  border: `2px solid ${theme.colors.error.border}`,
  borderRadius: theme.border.radiusSmall,
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing.md
}}>
  <span style={{ fontSize: '20px' }}>⚠️</span>
  <div>
    <p style={{
      color: theme.colors.error.text,
      fontWeight: theme.typography.fontWeight.bold,
      margin: `0 0 ${theme.spacing.sm} 0`
    }}>Error al procesar</p>
    <p style={{
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.fontSize.sm,
      margin: 0
    }}>Verifica los datos e intenta de nuevo</p>
  </div>
</div>
```

### Input con Focus

```jsx
<input 
  type="text"
  placeholder="Ingresa tu nombre"
  style={{
    background: theme.colors.input.background,
    border: `2px solid ${theme.colors.input.border}`,
    borderRadius: theme.border.radiusSmall,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    outline: 'none',
    transition: theme.transition.fast
  }}
  onFocus={(e) => {
    e.target.style.borderColor = theme.colors.input.focus;
    e.target.style.boxShadow = `0 0 0 3px ${theme.colors.input.focus}30`;
  }}
  onBlur={(e) => {
    e.target.style.borderColor = theme.colors.input.border;
    e.target.style.boxShadow = 'none';
  }}
/>
```

### Texto con Diferentes Niveles

```jsx
<h1 style={{
  fontSize: theme.typography.fontSize['5xl'],
  fontWeight: theme.typography.fontWeight.bold,
  color: theme.colors.text.primary,
  fontFamily: theme.typography.fontFamily,
  lineHeight: theme.typography.lineHeight.tight
}}>Título Principal</h1>

<p style={{
  fontSize: theme.typography.fontSize.base,
  color: theme.colors.text.primary,
  fontFamily: theme.typography.fontFamily,
  lineHeight: theme.typography.lineHeight.normal
}}>Párrafo principal</p>

<p style={{
  fontSize: theme.typography.fontSize.sm,
  color: theme.colors.text.secondary,
  fontFamily: theme.typography.fontFamily
}}>Texto secundario</p>

<span style={{
  fontSize: theme.typography.fontSize.xs,
  color: theme.colors.text.light,
  fontFamily: theme.typography.fontFamily
}}>Texto muy pequeño</span>
```

---

## 📱 Responsive

```jsx
import { getResponsive } from '../config/theme';

const padding = getResponsive(
  theme.spacing.lg,      // Desktop
  theme.spacing.md,      // Mobile
  isMobile
);

<div style={{ padding }}>Contenido responsive</div>
```

---

## 🎪 Gradientes

```jsx
import { createGradient } from '../config/theme';

const gradient = createGradient({
  start: theme.colors.primary,
  startPercent: 50,
  end: theme.colors.secondary,
  endPercent: 50
}, 110, isMobile);

<div style={{ background: gradient }}>Gradiente</div>
```

---

## Z-Index Escala

```javascript
theme.zIndex.hide        // -1
theme.zIndex.base        // 0
theme.zIndex.dropdown    // 100
theme.zIndex.sticky      // 500
theme.zIndex.fixed       // 800
theme.zIndex.modal       // 900
theme.zIndex.popover     // 950
theme.zIndex.tooltip     // 1000
theme.zIndex.loading     // 9999
```

---

## 🎨 Breakpoints Responsive

```javascript
theme.breakpoints.mobile     // 640px
theme.breakpoints.tablet     // 768px
theme.breakpoints.desktop    // 1024px
theme.breakpoints.wide       // 1200px
theme.breakpoints.ultrawide  // 1400px
```

---

## 🚀 Próximos Pasos

- [ ] Aplicar tema a navbar/sidebar
- [ ] Aplicar tema a formularios
- [ ] Aplicar tema a tablas
- [ ] Crear componentes reutilizables con tema
- [ ] Implementar dark mode
- [ ] Crear paleta de gráficos

---

**Última actualización**: Mayo 7, 2026  
**Responsable**: Sistema de Control Presupuestario G51/58  
**Diseño Base**: UEB - Universidad Especializada en Beneficio
