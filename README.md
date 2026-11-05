# Football Predictor AI 3.0

Dashboard web estático en español para consultar partidos y generar estimaciones estadísticas exploratorias.

## Funciones principales

- Consulta de eventos por fecha desde TheSportsDB.
- Proveedor alternativo API-Football (requiere clave válida).
- Análisis de últimos resultados con ponderación temporal exponencial.
- Ajuste conservador de marcadores bajos inspirado en Dixon–Coles.
- Distribución de marcadores mediante Poisson y mercados derivados:
  - 1X2 y doble oportunidad.
  - Over/Under 1.5, 2.5, 3.5 y 4.5 goles.
  - Ambos equipos anotan sí/no.
  - Goles de cada equipo.
- Evaluador manual de cuotas: probabilidad implícita, cuota justa, diferencia de probabilidad y valor esperado.
- Referencia de Kelly fraccional limitada a un máximo de 1% de banca cuando el usuario introduce una banca.
- Bitácora local de pronósticos con resultado marcado manualmente, ROI simulado a unidad plana y Brier binario; exportación CSV.

## Fuentes de datos

- **TheSportsDB V1:** usa la clave pública `123`. No requiere registro; la cobertura y el límite de eventos varían por competición y endpoint.
- **API-Football:** requiere una API Key propia en el encabezado `x-apisports-key`. La clave `123` de TheSportsDB no es válida para API-Football.

TheSportsDB gratuito no ofrece una fuente completa de cuotas, lesiones, alineaciones ni métricas xG. Por eso, el evaluador de valor espera que el usuario introduzca una cuota decimal real que esté viendo en su casa de apuestas.

## Uso

1. Abre [GitHub Pages](https://mrp4blomanzo.github.io/Football-Predictor-AI/).
2. Selecciona TheSportsDB o API-Football.
3. Prueba la conexión y carga un rango corto de fechas.
4. Analiza un partido con suficientes resultados recientes.
5. En el evaluador, elige un mercado e introduce la cuota decimal.
6. Guarda la selección en la bitácora y actualiza el resultado una vez finalizado el encuentro.

## Modelo y limitaciones

- Las probabilidades provienen de un modelo Poisson exploratorio con tasas suavizadas hacia priors genéricos y ponderación temporal.
- Se aplica una corrección de baja anotación inspirada en Dixon–Coles; no es un modelo Dixon–Coles entrenado sobre una liga.
- El índice de calidad de muestra mide cobertura, cantidad y recencia de datos; **no es precisión predictiva ni confianza estadística calibrada**.
- No hay modelo de Machine Learning entrenado ni calibración histórica porque el repositorio no contiene un dataset curado y etiquetado para hacerlo responsablemente.
- Los promedios de goles recientes no son xG oficiales.
- Las cuotas ingresadas deben estar vigentes y corresponder exactamente al mismo mercado y reglas de liquidación.
- El EV depende de que la probabilidad estimada sea correcta. Un EV aparente positivo no garantiza rentabilidad.
- El Kelly indicado es una referencia matemática con techo conservador; no constituye recomendación financiera ni instrucción para apostar.
- La bitácora se guarda solo en el navegador del usuario. El ROI usa una unidad plana por selección ganada/perdida; las anuladas se excluyen del denominador. Los resultados los marca manualmente el usuario.

## Seguridad

TheSportsDB V1 usa una clave pública en la URL. La versión estática para API-Football usa la clave personal en el navegador; no publiques una clave propia. Para producción, mueve las peticiones a un backend y guarda secretos en variables de entorno.

## GitHub Pages

Se publica desde **Settings → Pages → Deploy from a branch → `main` → `/(root)`**.