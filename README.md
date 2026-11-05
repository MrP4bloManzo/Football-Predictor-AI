# Football Predictor AI

Dashboard web en español para consultar eventos de fútbol y explorar pronósticos estadísticos.

## Fuentes de datos

- **TheSportsDB (gratis):** utiliza automáticamente la clave pública `123`. No requiere registro. Permite consultar eventos por fecha, con límites de resultados por endpoint.
- **API-Football:** proveedor alternativo que requiere una clave personal válida enviada en el encabezado `x-apisports-key`. La clave pública de TheSportsDB no funciona en API-Football.

Selecciona el proveedor en el panel de conexión del dashboard.

## Funcionalidades

- Consulta de eventos por fechas y filtro local por competición/equipo.
- Búsqueda de últimos resultados cuando el proveedor los ofrece.
- Modelo Poisson exploratorio para 1X2, over 2.5 y ambos equipos anotan, únicamente cuando hay muestra suficiente.
- Dashboard responsive.

## Uso

1. Abre la página de GitHub Pages o sirve `index.html` desde un servidor local.
2. Selecciona **TheSportsDB · Gratis, sin registro**.
3. Pulsa **Probar conexión**.
4. Selecciona un rango de fechas y pulsa **Cargar partidos**.

Para usar API-Football, selecciona ese proveedor e introduce una clave válida obtenida en [API-Football](https://www.api-football.com/).

## Limitaciones importantes

El plan gratuito de TheSportsDB limita la cantidad de resultados por endpoint y no ofrece el mismo nivel de cobertura que un proveedor de pago. No debe suponerse que se mostrarán todos los partidos de todas las ligas. La versión gratuita tampoco proporciona cuotas de apuestas ni un feed completo de lesiones.

El motor Poisson requiere al menos tres resultados recientes por equipo. Si la fuente no proporciona suficientes partidos, el dashboard muestra que no hay muestra suficiente en vez de inventar probabilidades. Los goles esperados derivados de marcadores no son xG oficiales.

Las probabilidades son estimaciones exploratorias, no garantías de resultados ni recomendaciones de apuesta.

## Seguridad

TheSportsDB V1 utiliza la clave pública `123` en la URL. Para API-Football, esta versión estática usa la clave desde el navegador; no publiques una clave personal ni uses esta configuración para una aplicación pública. Para producción, mueve las peticiones a un backend y almacena secretos en variables de entorno.

## GitHub Pages

El sitio puede publicarse desde **Settings → Pages → Deploy from a branch → `main` → `/(root)`**.
