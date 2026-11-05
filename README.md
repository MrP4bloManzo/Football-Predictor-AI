# Football Predictor AI

Dashboard web para explorar partidos de fútbol y generar pronósticos estadísticos.

## Características

- Integración con API-Football mediante una API Key proporcionada por el usuario.
- Consulta de fixtures, últimos partidos, estadísticas de equipos y datos disponibles según la cobertura del plan.
- Análisis exploratorio de resultados 1X2, goles y ambos equipos anotan mediante un modelo Poisson.
- Interfaz responsive en español.

## Uso

1. Abre `index.html` en un servidor local (por ejemplo, Live Server o `python -m http.server 8000`).
2. Obtén una API Key en [API-Football](https://www.api-football.com/).
3. Introduce tu clave en el panel y prueba la conexión.

> **Seguridad:** la versión estática utiliza la clave desde el navegador. No publiques una clave real ni despliegues esta configuración para usuarios públicos. Para producción, mueve las peticiones a un backend y guarda la clave en variables de entorno.

## Limitaciones del modelo

Las probabilidades mostradas son estimaciones exploratorias, no garantías de resultados ni recomendaciones de apuesta. La disponibilidad de xG, lesiones, alineaciones, cuotas y estadísticas depende de la liga, temporada y plan contratado. Los goles esperados aproximados calculados con resultados recientes no deben confundirse con xG oficiales.

## Publicación con GitHub Pages

En GitHub, entra a **Settings → Pages**, selecciona **Deploy from a branch**, elige `main` y la carpeta `/ (root)`, y guarda los cambios. Cuando termine el despliegue, GitHub mostrará la URL pública del sitio.
