# Análisis de competencia — Syntra

Fecha de elaboración: 12/11/2026. Insumo para el roadmap P2.

**Cómo leer este documento.** Las afirmaciones sobre competidores vienen de búsquedas web (notas de prensa del propio proveedor, prensa sectorial y algunos agregadores). Todo lo que sale solo de material de marketing del proveedor o de fuentes de baja calidad está marcado como *(sin confirmar)*. No se incluyen precios: no los relevamos y no los inventamos. La verificación de producto/precio con cada empresa quedó pendiente (ver sección 7).

---

## 1. Resumen ejecutivo

- **Nadie del set relevado ofrece lo que Syntra combina:** diseño de corredores biológicos de vegetación nativa, modelado de conectividad (Circuitscape), monitoreo de polinizadores/enemigos naturales a campo y un informe de evidencia con hashes SHA-256 sellados en BFA. En las fuentes consultadas no encontramos ningún competidor que modele conectividad ni que diseñe corredores. Es ausencia de evidencia en una búsqueda acotada, no una prueba de inexistencia.
- **Cropwise (Syngenta) es el competidor más cercano por canal y por certificación:** tiene una app de sustentabilidad basada en el estándar propio SOA (Syngenta afirma equivalencia nivel Gold con FSA 3.0 de SAI Platform), con "biodiversidad y hábitat" como uno de seis resultados, más Operations/Imagery con modo offline y red comercial en Argentina. Es fuerte en distribución y herramienta; su biodiversidad parece ser un indicador/autoevaluación, no diseño territorial ni modelado.
- **El riesgo real no es que nos copien la ciencia sino la distribución:** Syngenta, Bayer y BASF ya están en el campo argentino con apps, agrónomos y relaciones con acopios/exportadoras. Un productor que ya usa Cropwise o FieldView va a preguntar "¿no lo hace mi plataforma?".
- **En EUDR y trazabilidad Argentina ya tiene un jugador "de sistema" (VISEC) y agtech locales (Ucrop.it, Agrotoken):** resuelven deforestación y trazabilidad de la mercadería, no biodiversidad funcional. Son más complementarios que competidores: EUDR trata deforestación, no polinizadores ni conectividad.
- **Recomendación estratégica:** posicionarse como la capa de "biodiversidad funcional con evidencia científica y auditable" que se enchufa a las plataformas existentes (API/exportación de datos), y copiar de ellas lo que el productor da por hecho: app offline, capacitación, acompañamiento humano en campo e importación de datos de monitores de rinde/cosechadora.

---

## 2. Tabla comparativa

Leyenda: Sí = confirmado en fuente; Parcial = existe pero limitado/indirecto; No hallado = no encontramos evidencia en la búsqueda (no implica que no exista); s/c = sin confirmar.

| Competidor | Qué hacen | Monitoreo satelital | App de campo / offline | Biodiversidad funcional / diseño de corredores | Modelado de conectividad | Evidencia para certificación / trazabilidad | Verificación humana | Foco Argentina / Mercosur | Fuente |
|---|---|---|---|---|---|---|---|---|---|
| **Cropwise (Syngenta)** — Operations, Imagery, Protector, Sustainability | Plataforma digital de gestión agrícola + app de sustentabilidad (estándar SOA, módulo Cool Farm Tool para GEI/carbono) | Sí (Imagery, Operations) | Sí; Operations documenta edición de datos en modo offline. Imagery: offline no confirmado | Parcial: "biodiversidad y hábitat" es 1 de 6 resultados del estándar SOA; método de puntuación no detallado en lo hallado. Diseño de corredores: No hallado | No hallado | Parcial: SOA con equivalencia Gold a FSA 3.0 según Syngenta (autodeclarado). Proyecto girasol con PepsiCo en Argentina con validación de tercero | Sí (representantes de la compañía; dato aportado por el equipo, no verificado en fuente pública) | Alto: lanzó Cropwise en Argentina (Imagery y Protector) | [1][2][3][4][5] |
| **Bayer Climate FieldView / ForGround / PRO Carbono** | Plataforma de datos de máquinas y campo; programas de carbono y agricultura regenerativa con pago por prácticas | Sí (según descripción de Bayer) | Sí en general (s/c el detalle de offline en Argentina) | No hallado (foco carbono/prácticas, no corredores) | No hallado | Parcial: programas de carbono con MRV; "PRO Carbono" en Latinoamérica | Parcial (agrónomos/programa; s/c) | Parcial: PRO Carbono menciona LatAm | [6][7] |
| **xarvio (BASF) — Field Manager / Scouting** | Gestión de cultivos, mapas de aplicación variable, scouting de plagas/enfermedades, modelos agronómicos | Sí | Sí: Scouting Trips permite notas offline (Field Manager for AgBusiness, lanzado en AR y BR hacia fines de 2025) | No hallado | No hallado | No hallado como producto de certificación | Parcial: apunta a asesores/agronegocios | Parcial: presente en Argentina desde 2019 | [8][9] |
| **Auravant** (Argentina) | Agricultura de precisión: monitoreo satelital, mapas, métricas agronómicas, marketplace de integraciones | Sí (imágenes Planet ~3 m, frecuencia casi diaria según nota de 2023) | Parcial/s/c | No hallado | No hallado | No hallado como función propia (ver notas; hubo vínculo con NASA Harvest para indicadores sustentables, nota de prensa, s/c alcance) | No hallado | Alto: nace en Argentina, opera en varios países | [10][11] |
| **VISEC** (Argentina) | Sistema colectivo y voluntario de trazabilidad socioambiental para soja y carne; creado en 2019 por exportadoras/aceiteras con apoyo de TNC y Tropical Forest Alliance; gestor de información, no certificadora que le cobre al productor | Parcial (verificación de deforestación vía capas, s/c detalle) | No hallado | No (es libre de deforestación, no biodiversidad funcional) | No | Sí, para EUDR/deforestación: pidió reconocimiento como sistema de mitigación de riesgo ante NVWA (Países Bajos); análisis de brechas del IICA (2024) | No hallado | Muy alto: sistema reconocido oficialmente para soja y carne según informe 2025 | [12][13][14] |
| **Ucrop.it** (Argentina) | Trazabilidad y verificación de prácticas sustentables con blockchain; partner de 2BSvs (Verificación de Paisaje Sustentable) en LATAM; piloto NASA Harvest | Parcial (s/c; piloto NASA Harvest 10.000 ha) | Sí: el productor documenta con el celular (según sus responsables); offline s/c | No hallado | No hallado | Sí: verificación de prácticas alineadas a estándares + blockchain | No hallado | Alto: Argentina, Uruguay, Paraguay, Brasil y otros (cifras de alcance inconsistentes entre fuentes) | [15][16] |
| **Agrotoken** (Argentina) | Fintech/agtech que tokeniza granos; también trazabilidad de atributos y certificaciones de sustentabilidad en blockchain | No hallado | No hallado | No | No | Parcial: registra atributos de sustentabilidad en cadenas | No | Alto | [17] |
| **Kilimo / Satellogic / Agrofy** | Kilimo: recomendaciones de riego por lote. Satellogic: datos geoespaciales por nanosatélites. Agrofy: marketplace de insumos | Satellogic/Kilimo: sí (datos satelitales) | No hallado | No | No | No | No | Alto (origen argentino) | [17] |
| **NatureMetrics** | Plataforma de "inteligencia de naturaleza": eDNA de suelo/agua, capa de riesgo de naturaleza, reportes; proyectos con FMCG/agro (ej. Unilever, Wildfarmed) | Parcial (capas de riesgo de abastecimiento) | No hallado (muestreo con kits; no es app de manejo) | Parcial: mide biodiversidad, no diseña corredores | No hallado | Parcial: reporting corporativo de naturaleza (alianza con Accounting for Nature) | Parcial (laboratorio/muestreo) | Bajo/no hallado para Argentina | [18] |
| **Agreena** | Carbono regenerativo certificado (Verra) y plataforma AgreenaGro; afirma cobeneficios de biodiversidad | Sí (MRV digital, según Agreena) | s/c | Parcial: biodiversidad como cobeneficio declarado, no diseño territorial | No hallado | Sí para carbono (Verra) | s/c | Bajo (foco Europa; no hallado Argentina) | [19] |
| **Regrow Ag** | Medición, monitoreo, reporte y verificación (MRV) de prácticas regenerativas | Sí (según perfil de terceros, calidad baja, s/c) | s/c | No hallado | No hallado | Parcial (MRV) | No hallado | No hallado | [19] |
| **EUDR: Satelligence, Global Forest Watch Pro, Meridia** | Debida diligencia de deforestación: monitoreo satelital, geolocalización, reportes. Meridia fue elegida por SGS como socio tecnológico para verificación EUDR (>50 países de origen) | Sí | Meridia: relevamiento de parcelas (s/c); GFW Pro: no es app de campo | No (deforestación, no biodiversidad funcional) | No | Sí, para EUDR | Meridia/SGS: verificación con certificadora | Bajo-medio (cobertura global) | [20][21][22] |

---

## 3. Fichas breves por competidor

### 3.1 Cropwise (Syngenta)
**Qué ofrece.** Familia de productos: *Operations* (gestión de campo, informes, telemática), *Imagery* (monitoreo satelital por lote, lanzado en Argentina junto con *Protector*) y *Sustainability* (app gratuita sobre el estándar SOA, con módulo Cool Farm Tool para huella de GEI y secuestro de carbono). Syngenta declara que SOA logró equivalencia Gold con FSA 3.0 de SAI Platform; es afirmación del proveedor, no confirmación independiente. Syngenta abrió además la plataforma a desarrolladores (nota de prensa, ver [5]): esto sugiere que existe superficie de integración, aunque no revisamos la documentación técnica.
**Fortalezas.** Distribución y marca en Argentina; app offline en Operations; capacitación y representantes que verifican en campo; cobertura de FSA como camino ya armado; proyectos con compradores (girasol con PepsiCo en Argentina).
**Debilidades frente a Syntra.** En lo hallado, biodiversidad es un indicador entre seis y no se describe método de diseño ni modelado de conectividad; no encontramos mención de corredores, polinizadores ni evidencia anclada con hash. Conflicto de interés potencial: Syngenta vende fitosanitarios, lo que condiciona un mensaje de reducción de agroquímicos vía control biológico/polinización. Esto último es inferencia nuestra, no dicho por Syngenta.
**Incertidumbres.** No confirmamos si el módulo Sustainability/Cool Farm Tool está activo en Argentina ni qué tercero verifica. Tampoco el detalle de offline en Imagery.

### 3.2 Bayer Climate FieldView (y ForGround / PRO Carbono)
**Qué ofrece.** Plataforma digital que integra máquinas, sensores y satélite; sobre ella Bayer corre programas de carbono y agricultura regenerativa (ForGround, Bayer Carbon Program, PRO Carbono en Latinoamérica, EMEA Carbon Program) con pagos por prácticas como siembra directa y cultivos de cobertura.
**Fortalezas.** Integración con monitores de rinde y maquinaria (valor clave para nosotros); marca y escala; pago por prácticas.
**Debilidades frente a Syntra.** Foco carbono y prácticas de suelo, no biodiversidad funcional ni certificaciones tipo FSA/GlobalG.A.P. *(en lo hallado)*. Programas dirigidos a clientes de Bayer.
**Incertidumbres.** Alcance real de PRO Carbono en Argentina y disponibilidad de API/exportación de datos de FieldView en el país (no verificado).

### 3.3 xarvio (BASF)
**Qué ofrece.** Field Manager y Scouting: monitoreo satelital, mapas de aplicación variable y registro de observaciones geolocalizadas; en 2025 BASF lanzó Field Manager for AgBusiness (asesores y agronegocios con múltiples campos) en Argentina y Brasil, con scouting offline.
**Fortalezas.** App de campo con navegación GPS y notas offline; orientada a asesores (el canal real de decisión en Argentina).
**Debilidades frente a Syntra.** No encontramos funciones de biodiversidad, certificación ni evidencia auditable.

### 3.4 Auravant
**Qué ofrece.** Plataforma argentina de agricultura de precisión (imágenes satelitales, mapas, métricas); según prensa monitorea millones de hectáreas con cifras variables entre fuentes (3 a 5,2 M ha según año); vínculos con INTA y con NASA Harvest para indicadores de sustentabilidad (nota de prensa; s/c alcance).
**Fortalezas.** Es local, tiene ecosistema de integraciones y base de usuarios; candidato natural a alianza en lugar de competidor.
**Debilidades frente a Syntra.** Sin biodiversidad funcional ni certificación hallada.

### 3.5 VISEC
**Qué ofrece.** Sistema colectivo y voluntario de trazabilidad socioambiental para soja y carne creado por el sector exportador. Funciona como sistema de gestión de información (no cobra certificación individual al productor), con cláusulas VISEC en contratos de soja. Solicitó reconocimiento como sistema de mitigación de riesgo EUDR ante la NVWA. Una nota de octubre de 2026 indica que los productores inscriptos ya cubren el volumen requerido por la UE.
**Fortalezas.** Respaldo de exportadoras, TNC y Tropical Forest Alliance; relevancia directa para EUDR; gratuito para acopios según Agrofy.
**Debilidades frente a Syntra.** Se limita a deforestación y legalidad: no cubre biodiversidad funcional, FSA ni conectividad. Más complemento que rival.
**Incertidumbres.** La implementación de EUDR se postergó más de una vez y eso perjudicó la tracción de VISEC según una fuente; revisar el calendario vigente de EUDR antes de basar mensajes comerciales en fechas.

### 3.6 Ucrop.it
**Qué ofrece.** Trazabilidad y verificación de prácticas a nivel de lote, registro con celular, blockchain para resguardo criptográfico, partner de 2BSvs para Verificación de Paisaje Sustentable en LATAM, piloto con NASA Harvest.
**Fortalezas.** Es el competidor local más parecido en la narrativa de "evidencia verificable + blockchain" para certificaciones; tiene relación con empresas de la cadena (ej. Betta, Grupo Sigma).
**Debilidades frente a Syntra.** Verifica prácticas declaradas; no hallamos medición de biodiversidad en campo, diseño de corredores ni conectividad. Su blockchain no es BFA (no confirmado cuál usa).
**Riesgo.** Podría sumar un módulo de biodiversidad apoyado en su red de productores.

### 3.7 Agrotoken, Kilimo, Satellogic, Agrofy
Agtech argentinas de nichos adyacentes: tokenización de granos con atributos de trazabilidad/sustentabilidad (Agrotoken), riego (Kilimo), datos satelitales (Satellogic), marketplace (Agrofy). No compiten directo; son potenciales fuentes de datos o canal. Información de 2019-2024, a revalidar.

### 3.8 NatureMetrics
**Qué ofrece.** Monitoreo de biodiversidad con eDNA (suelo/agua) y plataforma de reporte; proyectos con consumo masivo y agro (Unilever 2024, Wildfarmed).
**Fortalezas.** Metodología molecular robusta, reconocimiento corporativo, alianzas para reportar naturaleza.
**Debilidades frente a Syntra.** Mide, no diseña ni modela conectividad; sin foco hallado en Argentina ni en certificaciones de cultivos extensivos; probable costo por muestreo (no relevado). Posible proveedor/aliado (eDNA como complemento al monitoreo de campo).

### 3.9 Agreena y Regrow Ag
Agreena: carbono regenerativo (Verra), ~5 M ha y 2.500 agricultores en 20 países según la empresa, biodiversidad como cobeneficio declarado. Regrow: MRV de prácticas (información de baja calidad en lo hallado). Ambos enfocados en carbono/prácticas, no en corredores ni conectividad; poca presencia hallada en Argentina.

### 3.10 Herramientas EUDR (Satelligence, GFW Pro, Meridia)
Debida diligencia de deforestación. WRI presenta GFW Pro como base suficiente para la debida diligencia de EUDR en general, aunque exige trabajo propio; Satelligence es servicio especializado con precios no transparentes según una reseña; Meridia fue elegida por SGS para verificación EUDR. Las comparaciones disponibles son de blogs de competidores (sesgadas). No tratan biodiversidad funcional.

---

## 4. Dónde se diferencia Syntra (y dónde no)

### Diferenciales reales
1. **Diseño de corredores sobre datos de rinde e inundabilidad:** ubicar la intervención en zonas de bajo rendimiento y anegables baja el costo de oportunidad para el productor. No encontramos oferta equivalente.
2. **Modelado de conectividad (Circuitscape):** nadie hallado lo ofrece a escala de establecimiento para cumplir certificaciones.
3. **Base científica local publicada:** CONICET/IMBIV; Amarilla et al. 2025 (Field Crops Research: −30,4 % de rendimiento en girasol sin polinizadores) y Galetto et al. 2026 (Agroforestry Systems: +31 % de masa de semilla en soja con polinización, con beneficio decreciente a mayor distancia al borde de bosque). Esto convierte el argumento en económico (rinde), no solo ambiental.
4. **Monitoreo biológico a campo (polinizadores, enemigos naturales)** con protocolo propio.
5. **Evidencia auditable lista para el auditor:** informe con SHA-256 anclado en BFA (blockchain pública del Estado argentino, sin costo de gas para nosotros; a confirmar condiciones de uso). Es más fuerte para un auditor que una autodeclaración.
6. **Mapeo explícito a FSA, GlobalG.A.P., RTRS, ISCC y EUDR** en un solo entregable.

### Riesgos honestos (dónde NO somos mejores)
- **Distribución y confianza:** Cropwise/FieldView/xarvio ya están instaladas y tienen agrónomos y capacitación; nosotros somos nuevos y chicos.
- **Experiencia diaria:** no tenemos (aún) app offline robusta ni imágenes satelitales propias ni integración nativa con monitores de cosecha. Hoy dependemos de procesos manuales para mapas de rendimiento.
- **"Ya tengo biodiversidad en mi estándar":** Syngenta puede decir que su estándar SOA cubre "biodiversidad y hábitat" y que está al nivel Gold de FSA. Un productor puede conformarse con eso aunque sea más liviano. Debemos demostrar qué agrega un corredor diseñado frente a un puntaje autodeclarado.
- **Aceptación del certificador:** no hay garantía de que el auditor de FSA/GlobalG.A.P./RTRS/ISCC reconozca nuestro informe como evidencia equivalente; hay que validarlo con cada esquema. Idem la validez de BFA como "prueba" ante auditores internacionales *(sin confirmar)*.
- **Evidencia causal acotada:** los estudios son sobre girasol y soja en zonas puntuales de Argentina; no extrapolar a todos los cultivos/regiones. El rendimiento por polinización depende del cultivo, la variedad y la distancia al borde.
- **Escalabilidad:** un servicio de consultoría con presencia humana no escala como una app; los competidores grandes sí.
- **EUDR es principalmente deforestación:** nuestro valor no responde a ese requisito (lo cubren VISEC/GFW Pro). Conviene no sobreprometer; EUDR es una puerta de entrada comercial, no el núcleo del servicio.
- **Dependencia de pocas personas/ciencia de un grupo** (CONICET/IMBIV): riesgo de concentración.

---

## 5. Qué aprender / copiar

1. **App de campo offline.** Es estándar en Cropwise Operations y xarvio Scouting (notas offline con sincronización posterior). El relevamiento de polinizadores y de corredores se hace en campo sin señal: offline-first no es opcional.
2. **Capacitación.** Cropwise y xarvio acompañan con formación. Para nosotros: capacitación a productores, asesores y personal de acopio, incluyendo material para el auditor ("cómo leer el informe").
3. **Acompañamiento humano y verificación en campo.** Es una de las fortalezas citadas de Cropwise (representante que verifica). Mantener visitas técnicas y hacer de ellas un valor visible (checklist, fotos geolocalizadas, firma del técnico).
4. **Integración con monitores de cosecha y plataformas.** Importar mapas de rendimiento (formatos de monitor, shapefile/ISOXML/CSV y vía FieldView/Cropwise/Auravant si exponen API) en lugar de pedírselos al productor a mano.
5. **APIs y exportación abierta.** Syngenta abrió Cropwise a desarrolladores (nota de prensa); ofrecer nosotros también API/exportación (GeoJSON, PDF + JSON del informe) para que acopios, certificadoras y plataformas consuman nuestra evidencia.
6. **Modelo comercial "de sistema" tipo VISEC:** adhesión colectiva por acopio/exportadora (sin cobro individual al productor en VISEC). Evaluar cobrar a la cadena (exportadora/comprador) en vez de al productor.
7. **Imagen y marketing de "sello" simple:** Ucrop.it comunica de forma muy simple "mostrá con tu celular cómo producís". Traducir el informe a un resumen de una página para el productor.

---

## 6. Posibles alianzas

| Aliado | Forma | Por qué | Estado de la información |
|---|---|---|---|
| **Cropwise (Syngenta)** | Integración vía API/plataforma abierta: importar lotes y mapas de rinde; publicar nuestros corredores como capa | Evita competir por la herramienta; aprovecha su distribución y su camino FSA | Existencia de apertura a desarrolladores en nota de prensa; condiciones técnicas y comerciales sin verificar |
| **Bayer FieldView** | Importar datos de cosechadora/monitor | Acceso a mapas de rinde donde el productor ya los tiene | Disponibilidad de API en Argentina: sin verificar |
| **Auravant** | Integración (aplicaciones/capas) y/o canal local | Plataforma argentina con ecosistema de integraciones; alta afinidad cultural | Sin verificar |
| **xarvio (BASF)** | Intercambio de datos de scouting (plagas y enemigos naturales) | Dato de campo complementario | Sin verificar |
| **VISEC / exportadoras / acopios** | Sumar "biodiversidad funcional" como capa sobre trazabilidad libre de deforestación | Mismo cliente, requisitos distintos | VISEC se presenta como sistema colectivo; hay que contactarlos |
| **Ucrop.it** | Alianza de verificación (ellos prácticas, nosotros biodiversidad) o riesgo de competencia | Canal con productores y partner de 2BSvs | Evaluar con cuidado: podrían absorber el nicho |
| **Certificadoras/auditores (FSA/SAI, GlobalG.A.P., RTRS, ISCC, SGS y similares)** | Validar formato del informe con ellos; pilotos con auditores | La aceptación del auditor es la llave del producto | Sin contacto aún |
| **BFA (Blockchain Federal Argentina)** | Anclaje de hashes ya implementado | Prueba de integridad pública | Confirmar condiciones de uso y continuidad del servicio |
| **NatureMetrics u otros laboratorios de eDNA** | Complemento eDNA al monitoreo visual | Refuerza evidencia molecular | Cobertura en Argentina sin confirmar |
| **CONICET/IMBIV, INTA, universidades** | Convenios, validación científica, publicación conjunta | Base de credibilidad | Ya hay vínculo con IMBIV |

---

## 7. Implicancias para el roadmap P2 (priorizadas)

**Prioridad alta**
1. **Modo offline-first para el relevamiento de campo** (monitoreo de polinizadores/enemigos naturales, replanteo de corredores): sincronización diferida, fotos geolocalizadas, conflicto-seguro.
2. **Importación de mapas de rinde y capas de terceros:** CSV/shapefile/ISOXML de monitores de cosecha; luego conectores (Cropwise/FieldView/Auravant) según disponibilidad de API.
3. **Validación del informe con al menos un auditor/certificador real:** mapear campo por campo del informe a requisitos de FSA, GlobalG.A.P., RTRS e ISCC (matriz de cumplimiento) y recoger feedback antes de escalar.
4. **API/exportación del informe de evidencia** (PDF + JSON firmado + verificación pública de hash/BFA) para que terceros lo consuman.

**Prioridad media**
5. **Verificador público de integridad** (página donde el auditor sube el PDF o pega el hash y ve la prueba en BFA): refuerza el diferencial frente a autodeclaraciones.
6. **Material de capacitación** (guía para productor y para auditor; video corto; checklist de visita técnica) y flujo de acompañamiento humano trazable.
7. **Resumen de una página para el productor con el argumento económico** (estudios de polinización: girasol y soja), sin extrapolar más allá de lo publicado.
8. **Capa satelital básica:** consumir imágenes abiertas (Sentinel/Landsat) para verificar cobertura de vegetación nativa y cambios; no competir con Cropwise Imagery en monitoreo agronómico.
9. **Módulo EUDR liviano:** referenciar/ingestar datos de VISEC y GFW Pro en lugar de construir detección de deforestación propia.

**Prioridad baja / a explorar**
10. Integración opcional con eDNA (NatureMetrics u otro laboratorio) como complemento de pago.
11. Modelo de cobro a la cadena (exportadoras/compradores) y adhesión colectiva por acopio.
12. Benchmark de precios: relevar tarifas reales de Cropwise, xarvio, Auravant, Ucrop.it y NatureMetrics con consulta directa (no se relevaron acá).

**Verificaciones pendientes (antes de usar este análisis hacia afuera)**
- Confirmar con Syngenta Argentina si Cropwise Sustainability/SOA y Cool Farm Tool están activos en el país, qué tercero verifica y cómo puntúa biodiversidad.
- Confirmar el calendario actual de aplicación de EUDR y el estado del reconocimiento de VISEC ante NVWA.
- Verificar qué blockchain usa Ucrop.it y si ofrece o planea módulo de biodiversidad.
- Verificar condiciones de uso de BFA y su aceptación por auditores.

---

## 8. Fuentes

[1] Cropwise Sustainability (Syngenta Canadá) — https://hey.syngenta.ca/cropwise-sustainability/
[2] Syngenta: nuevo estándar de sustentabilidad benchmarkeado contra FSA de SAI Platform (BusinessWire, 28/02/2022) — https://www.businesswire.com/news/home/20220228005176/en/Syngenta-launches-new-sustainability-standard-benchmarked-against-SAI-Platform%E2%80%99s-Farm-Sustainability-Assessment
[3] Integración de Cool Farm Tool en Cropwise Sustainability — https://www.syngenta.ca/syngenta-in-the-news/syngenta-announces-cool-farm-tool-integration-in-cropwi y https://coolfarm.org/syngenta-announces-cool-farm-tool-integration-in-cropwise-sustainability-enabling-greenhouse-gas-emission-estimates-for-growers/
[4] Forbes Argentina, "La agricultura digital: producción más eficiente y sustentable" (Cropwise Imagery y Protector en Argentina) — https://www.forbesargentina.com/brandvoice/la-agricultura-digital-produccion-mas-eficiente-sustentable-n12846
[5] Cropwise Operations (App Store) — https://apps.apple.com/app/id919636306 ; Telematics Cropwise Operations — https://apps.apple.com/app/id1418008029 ; Syngenta abre su plataforma a desarrolladores — https://lanotaeconomica.com.co/movidas-empresarial/syngenta-abre-su-plataforma-digital-cropwise-a-desarrolladores-para-impulsar-la-innovacion-y-reducir-la-brecha-tecnologica-en-el-agro/ ; Syngenta, "Profit in the Pampas" (girasol/PepsiCo) — https://www.syngenta.com/agriculture/sustainable-agriculture/profit-in-the-pampas
[6] Bayer, Ecosystem Services — https://www.bayer.com/en/agriculture/bayer-ecosystem-services
[7] Bayer, Project Enhanced S3 (BusinessWire, 21/11/2024) — https://www.businesswire.com/news/home/20241121063315/en ; FieldView post-cosecha — https://businesswire.com/news/home/20230822447559/en/FieldView-Rolls-Out-New-Capabilities-For-Post-Harvest-Analysis-and-Reporting
[8] BASF, xarvio FIELD MANAGER for AgBusiness (09/2025) — https://www.basf.com/global/en/media/news-releases/2025/09/p-25-176 ; https://ag.xarvio.com/global/news/GLOBAL_2025-09_BASF-expands-global-availability-of-xarvio-FIELD-MANAGER-for-AgBusiness
[9] BASF lanza plataforma digital en Argentina (2019) — https://news.agropages.com/News/print-32026.htm
[10] Forbes Argentina sobre Auravant — https://www.forbesargentina.com/especiales/auravant-detras-escena-empresa-monitorea-52-millones-hectareas-todo-mundo-n4097
[11] Cronista, Auravant y NASA — https://www.cronista.com/negocios/una-start-up-argentina-fue-elegida-por-la-nasa-para-monitorear-cultivos-y-gestionar-los-indicadores-sustentables
[12] Agrofy, VISEC y acopios — https://news.agrofy.com.ar/noticia/216919/faltan-dos-meses-ley-europea-deforestacion-acopios-podran-sumarse-gratis-visec
[13] Bichos de Campo, VISEC y exportaciones libres de deforestación — https://bichosdecampo.com/avanza-la-adopcion-de-visec-en-argentina-y-ya-se-empiezan-a-pensar-las-exportaciones-hacia-europa-para-2025-libres-de-deforestacion
[14] Cómo Argentina, Chile, Paraguay y Uruguay construyen el cumplimiento de EUDR (08/2026) — https://www.agroberichtenbuitenland.nl/actueel/nieuws/2026/08/14/how-argentina-chile-paraguay-and-uruguay-are-building-eudr-compliance ; IUCN/IKI EUDR Argentina (2026) — https://iucn.org/sites/default/files/2026-10/ARGENTINA%20IKI%20EUDR%202026.pdf.pdf ; Estudio IICA 2024 de brechas de VISEC — https://test-assets-opsaa.iica.int/storage/resource/2024/08/21ca1643e25fde9ee0bf1327304db8c9.pdf
[15] Forbes Argentina, Ucrop.it — https://www.forbesargentina.com/money/la-startup-argentina-certifica-sustentabilidad-cultivos-tecnologia-blockchain-hoy-opera-9-paises-n46590
[16] Bichos de Campo, Ucrop.it — https://bichosdecampo.com/en-un-mundo-donde-no-todas-las-agtech-finalmente-sobreviven-ucrop-it-encontro-un-nicho-y-multiplico-rapidamente-la-demanda-de-los-productores ; Conclusión, NASA Harvest y Ucrop.it — https://www.conclusion.com.ar/info-general/nasa-establece-alianza-con-empresa-argentina-para-el-monitoreo-de-cultivos/07/2023/
[17] Agrotoken (Brazilian Report) — https://newsletters.brazilian.report/p/agrotoken-agriculture-blockchain ; The Standard CIO — https://thestandardcio.com/2024/08/05/agrotoken-avanza-en-garantizar-comercia-agricola ; Satellogic y Kilimo — https://www.contxto.com/en/argentina/argentine-startups-satellogic-and-kilimo-to-expand-into-india/
[18] NatureMetrics, agricultura y bienes de consumo — https://naturemetrics.com/sectors/consumer-goods-and-agriculture ; Unilever–NatureMetrics — https://carbon-pulse.com/268678/?site=cpp
[19] Agreena — https://agreena.com/carbon/ y https://agreena.com/supply-chains ; Regrow Ag (perfil de baja calidad, sin confirmar) — https://geo.sig.ai/brands/regrow-ag.md
[20] Global Forest Watch Pro y EUDR — https://pro-news.globalforestwatch.org/news-events/how-gfw-pro-supports-eudr-compliance
[21] SGS selecciona a Meridia para verificación EUDR (09/2026) — https://www.sgs.com/en-ch/news/2026/09/sgs-selects-meridia-as-technology-partner-for-eudr-verification
[22] Comparativas de herramientas EUDR (blogs de proveedores; sesgadas) — https://www.live-eo.com/article/global-forest-watch-pro-vs-satelligence-for-eudr-compliance-which-one-should-you-choose ; https://www.coolset.com/academy/top-5-liveeo-tradeaware-alternatives-for-eudr-compliance

Fuentes propias (aportadas por el equipo, no verificadas en este relevamiento): Amarilla et al. 2025, *Field Crops Research*; Galetto et al. 2026, *Agroforestry Systems*; descripción de Cropwise por el equipo (app offline en tablets, capacitación, representante que verifica en campo).
