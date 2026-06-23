<div align="center">

<h1>Sistema de Control Presupuestario UEB</h1>
<h3>Interfaz Web &mdash; Frontend React 19</h3>

<br/>

<img src="https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white"/>

<br/><br/>

<p><em>Proyecto de Titulación G51-58 &bull; Universidad Estatal de Bolívar</em></p>

</div>

---

## Descripción

Interfaz web para el sistema de control presupuestario institucional de la UEB. Permite gestionar certificaciones, liquidaciones, cédulas presupuestarias y consultar el saldo disponible por partida. Desarrollada con React 19, Vite 8 y TailwindCSS, con animaciones mediante Framer Motion y gráficos con Recharts.

---

## Stack tecnológico

<table>
  <tr>
    <td align="center" width="120">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" width="48" height="48"/>
      <br/><strong>React 19</strong>
      <br/><sub>UI Library</sub>
    </td>
    <td align="center" width="120">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg" width="48" height="48"/>
      <br/><strong>Vite 8</strong>
      <br/><sub>Build tool + HMR</sub>
    </td>
    <td align="center" width="120">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" width="48" height="48"/>
      <br/><strong>TailwindCSS</strong>
      <br/><sub>Estilos utilitarios</sub>
    </td>
    <td align="center" width="120">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" width="48" height="48"/>
      <br/><strong>Node.js 22</strong>
      <br/><sub>Entorno de ejecución</sub>
    </td>
  </tr>
</table>

**Librerías adicionales:**

| Librería | Versión | Uso |
|:---|:---:|:---|
| React Router | 7.x | Navegación y rutas protegidas |
| Axios | 1.x | Peticiones HTTP al backend |
| Framer Motion | 12.x | Animaciones y transiciones |
| Recharts | 3.x | Gráficos del dashboard |
| Lucide React | 1.x | Iconografía del sistema |

---

## Páginas del sistema

| Página | Descripción |
|:---|:---|
| Login | Autenticación con token personalizado |
| Dashboard / Inicio | Resumen y gráficos del presupuesto por año fiscal |
| Estructura Presupuestaria | Carga y visualización desde CSV |
| Cédula Presupuestaria | Gestión de cédulas por partida y fuente |
| Certificaciones | Creación, seguimiento y cambio de estado |
| Liquidaciones | Registro de pagos vinculados a certificaciones |
| Presupuesto Disponible | Consulta de saldos calculados en tiempo real |
| Entidad Requirente | Gestión de entidades solicitantes |
| Reportes | Generación e impresión de reportes |
| Usuarios | Administración de usuarios del sistema |
| Auditoría | Historial de acciones registradas |
| Recuperar / Restablecer Contraseña | Flujo completo por enlace de correo |

---

## Instalación local

<details>
<summary><strong>Ver instrucciones</strong></summary>
<br/>

**Requisitos:** Node.js 22+, npm 10+

```bash
# 1. Clonar el repositorio
git clone https://github.com/Jeffs4nchez/Sistema_Control_Presupuestario_UEB_G51_58_Frontend.git
cd Sistema_Control_Presupuestario_UEB_G51_58_Frontend

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# Editar .env con la URL del backend

# 4. Iniciar servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:5173`.

</details>

---

## Variables de entorno

```env
VITE_API_URL=http://localhost:8000
```

En producción, `VITE_API_URL` apunta a la URL del backend desplegado en Railway.

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo con recarga en caliente (HMR)
npm run build     # Build de producción (genera /dist)
npm run preview   # Vista previa del build generado
npm run lint      # Revisión de código con ESLint
```

---

## Autenticación

El sistema usa un token personalizado gestionado desde `AuthContext`:

- Al iniciar sesión se recibe un `api_token` almacenado en cookie segura
- Todas las peticiones incluyen el header `Authorization: Bearer {api_token}`
- Las rutas protegidas están cubiertas por el componente `ProtectedRoute`
- El contexto `FiscalYearContext` mantiene el año fiscal activo en toda la app

---

## Roles de usuario

| Rol | Acceso |
|:---|:---|
| Administrador del sistema | Todas las secciones y gestión de usuarios |
| Director(a) Financiero/a | Certificaciones, liquidaciones, cédulas, reportes |
| Analista de Presupuesto | Crear y gestionar sus propias certificaciones |
| Director(a) Talento Humano | Solo lectura: Inicio y Reportes |
| Rector | Solo lectura: Inicio y Reportes |

---

## Despliegue en Railway

El proyecto incluye `railway.toml` y `nixpacks.toml` preconfigurados con Node.js 22.

Variable requerida en Railway (build time):

```
VITE_API_URL=https://tu-backend.up.railway.app
```

---

## Estructura del proyecto

```
frontend/src/
├── components/     # Componentes reutilizables (modales, efectos visuales)
├── config/         # Paleta de colores y estilos por página
├── contexts/       # AuthContext, FiscalYearContext, ProtectedRoute
├── pages/          # Una página por módulo del sistema (25 páginas)
├── utils/          # permissions.js, apiCache.js, fechaUtils.js, cn.js
└── main.jsx        # Punto de entrada, rutas y providers
```

---

## Equipo

<div align="center">
<br/>

| Integrante | Rol |
|:---|:---|
| Jefferson Sanchez | Ingeniero de Software |

<br/>

**Universidad Estatal de Bolívar**  
Facultad de Ciencias Administrativas, Gestión Empresarial e Informática  
Proyecto de Titulación · Grupo G51-58 · 2026

<br/>
</div>
