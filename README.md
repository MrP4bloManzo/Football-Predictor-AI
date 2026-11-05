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
## Integración global con Sportmonks (proxy seguro)

El dashboard incluye un adaptador para **Sportmonks Football API v3**. La web estática de GitHub Pages no almacena ni envía el token del proveedor: las llamadas pasan por un Cloudflare Worker y el token vive como secreto del Worker.

### Alcance global

Sportmonks devuelve los partidos de las ligas habilitadas para la suscripción de tu token. El endpoint de rango de fechas admite hasta 100 días y pagina hasta 50 resultados por página. Para ver cobertura mundial, la suscripción debe incluir las ligas que quieres consultar; el acceso a todas las ligas se contrata con el plan global/Enterprise de Sportmonks. La capa gratuita es de prueba y no habilita todas las competiciones.

- [Sportmonks: crear cuenta y token](https://my.sportmonks.com/api/tokens)
- [Documentación de fixtures por rango](https://docs.sportmonks.com/v3/endpoints-and-entities/endpoints/fixtures/get-fixtures-by-date-range)
- [Autenticación oficial](https://docs.sportmonks.com/v3/welcome/authentication)
- [Planes y cobertura](https://www.sportmonks.com/football-api/plans-pricing/)

### Desplegar el proxy en Cloudflare

Requisitos: Node.js instalado y una cuenta de Cloudflare.

1. Abre una terminal en el repositorio y entra a la carpeta worker.
2. Inicia sesión: **npx wrangler login**.
3. Registra el token como secreto (no lo pegues en el HTML ni en GitHub):

       npx wrangler secret put SPORTMONKS_TOKEN

   Pega el token de MySportmonks cuando Wrangler lo solicite.
4. Despliega:

       npx wrangler deploy

5. Copia la URL HTTPS workers.dev que muestre Wrangler.
6. Abre [Football Predictor AI](https://mrp4blomanzo.github.io/Football-Predictor-AI/), selecciona **Sportmonks · Global**, pega esa URL en **URL del proxy** y pulsa **Probar conexión**.
7. Para el alcance mundial, confirma en MySportmonks que tu plan incluya todas las ligas que deseas consultar.

El Worker acepta peticiones del origen **https://mrp4blomanzo.github.io**, solo expone las rutas necesarias (**/health**, **/fixtures**, **/team-recent**) y utiliza el encabezado **Authorization** al hablar con Sportmonks. La ruta **/health** prueba el token contra el endpoint de ligas; no se limita a verificar que el secreto exista. El token no se envía al navegador, no se añade a la URL y no forma parte de los archivos del repositorio.

El Worker incluye un límite de 60 solicitudes por minuto mediante el binding de Cloudflare. Cloudflare documenta que este mecanismo es aproximado y se aplica por centro de datos, por lo que ayuda a reducir abuso, pero no es un límite global estricto. El valor `namespace_id = "4044042026"` debe ser único dentro de tu cuenta de Cloudflare; cámbialo por otro entero si ya lo utilizas. Esta configuración requiere Wrangler CLI 4.36.0 o posterior.

### Endurecimiento recomendado

El control CORS restringe el uso desde navegadores de otros sitios, pero CORS no impide por sí solo llamadas directas con herramientas externas. Revisa las métricas de rate limiting de Cloudflare periódicamente y ajusta el umbral si el uso de la aplicación lo exige. No compartas el token; puedes revocarlo y generar otro desde MySportmonks si crees que quedó expuesto.

### Funcionamiento en el dashboard

- Consulta fixtures de todas las ligas incluidas en la cobertura contratada, con paginación.
- Rango máximo de 100 días por consulta.
- Incluye equipos, competición, estado, marcador y estadio cuando Sportmonks los devuelve.
- El análisis utiliza los últimos resultados finalizados recuperados por equipo y reutiliza el motor probabilístico existente.
- Lesiones, alineaciones, xG, estadísticas avanzadas y cuotas pueden depender de otros feeds o complementos del plan; el dashboard no inventa esos datos.

La URL pública de GitHub Pages se conserva: https://mrp4blomanzo.github.io/Football-Predictor-AI/
