# Plan de implementación — Syntra

> Basado en la reunión del 12/11/2026 (transcripción + resumen en `data-IA/`), los papers de `papers/`, Circuitscape y la competencia (Cropwise).
> Prioridad absoluta: **llegar al pitch de mañana (~10:00–10:30) con el video tecnológico de 40–50 s, su guion y la diapositiva de blockchain.**

---

## 1. Qué se decidió (y qué implica para nosotros)

| Decisión / pedido | Quién | Implicancia técnica |
|---|---|---|
| Pitch de 3 min **solo granos**, problema + solución con datos duros; **sin modelo de negocio ni pedido de fondos** | Grupo | El video no menciona precios, B2B ni suscripción |
| **Impacto social y ambiental** es el criterio de mayor peso (25%) | Leo (storytelling) | El video cierra conectando con comunidad/resiliencia en 1 frase; el resto lo cuenta Leo |
| Video tecnológico **~50 s (planificado a 40 s)**, ~8 s por tecnología | Nehuen | Ver §3. Es la entrega P0 |
| Diapositiva previa **"blockchain y trazabilidad"** antes del video | Bruno/Nehuen | Ver §3.4 |
| Panel: **FSA** en vez de RTRS; **"producción agrícola sustentable"** en vez de "soja responsable" | Nehuen | P0 (aparece en el video) |
| **"Bosque nativo" → "parches de bosque"** (parches chicos que se conectan, no bosques extensos) | Nehuen | P0 (aparece en el mapa del video) |
| Agregar **mapa de rendimiento** y **zonas inundables** como capas | Nehuen | P0 visual (mock) / P2 real |
| Nombrar e integrar **Circuitscape** (modelado de conectividad) | Nehuen | P0 visual (mapa de calor + corredor) / P2 motor real |
| Visualizar solo la **"sexta capa"**: mapa de calor que sintetiza las 5 capas | Juan Cruz/Leo | El mapa de conectividad es la vista principal; las 5 capas quedan como detalle |
| Recomendación = **mapa interactivo de corredores + informe con especies, densidad, riego y épocas** | Leo/Bruno | P1: sección "Especies y manejo" en el informe |
| **PDF por certificación** (no mezclar incumplimientos de otra) | Nehuen | P1 |
| La firma de un perito/auditor la consigue el productor cuando la necesita (puede ser de la propia certificadora) | Grupo | P1: espacio "Revisión del auditor" en el informe, sin firma propia de Syntra |
| Seguimiento **plurianual (hasta 5 años)**: permanencia de plantas, +superficie intervenida, +polinizadores | Leo | P1: plan de monitoreo por campaña en "Seguimiento" |
| **Garantía de reposición** ante pérdidas (ola de calor) | Leo | P2: evento "Pérdida / reposición" en trazabilidad |
| Planes por **presupuesto: básico / medio / premium** | Gabi/Dahyana | P2 |
| Plazos realistas: **implementación ~1 año** + monitoreo de adicionalidad | Leo | P1: corregir plazos del plan de acción |
| Registrar acción tiene **demasiada información** → sintetizar | Leo | P1 |
| Trazabilidad: **link al archivo original** y **hash completo** (no abreviado) | Nehuen | P1 |
| Estética del **Instagram de Syntra** (azul marino + blanco + hoja verde) | Bruno | P1 (el video ya puede usarla) |
| Cargar los **papers como contexto** para no cometer errores biológicos | Lautaro/Leo | Hecho parcialmente (`papers/`); ver §2 |

## 2. Lo que dicen los papers (y qué cambia)

| Paper | Hallazgo clave | Uso en Syntra |
|---|---|---|
| **Amarilla et al. 2025**, *Field Crops Research* 109736 — girasol (6 sitios, Argentina) | Excluir polinizadores: **−30,4% rendimiento**, −20% cuaje, −12,3% peso de semilla, −5,9% aceite, −6% oleico | Respalda el **girasol +30%** del deck. Cita: doi 10.1016/j.fcr.2025.109736 |
| **Galetto, Palombo, Amarilla & Maestri 2026**, *Agroforestry Systems* 100:51 — soja (10 lotes) | Plantas expuestas a polinizadores: **+31% masa de semilla seca**, +93% polen, +6% aceite, +6,8% oleico. **Más bosque alrededor → más beneficio**; la masa de semilla **cae con la distancia al borde del bosque** | Justifica **por qué corredores y parches distribuidos** (el beneficio decae con la distancia). Cita: doi 10.1007/s10457-026-01430-w |

| **An et al. 2020**, *Landscape Ecology* — red ecológica con MSPA + teoría de circuitos | Áreas fuente elegidas con **MSPA + índice PC**; corredores con **teoría de circuitos (Circuitscape)**; agregar **"stepping stones"** (islas pequeñas) en los cortes de corredor duplicó la densidad de corriente media y multiplicó ~8× el área de corredor potencial | Respalda el método del motor de conectividad (P2-1): MSPA para detectar parches, Circuitscape para corredores e **islas de vegetación como stepping stones** (p. ej. el corredor C) |

⚠️ **El "+14% en soja" de la app y el "+12 a 14%" del deck no aparecen en estos dos papers.** Galetto 2026 mide +31% de *masa de semilla* (no rendimiento por hectárea). Pedirle a Leo la fuente exacta de soja 12–14% y maní +20%. Mientras tanto, en el video **no** mostramos el número de soja; usamos frases verificables ("los polinizadores aumentan el peso de la semilla y el aceite").

## 3. P0 — Para el pitch de mañana (esta noche)

### 3.1 Cambios rápidos en la app (aparecen en el video) — ~45 min
- [ ] RTRS → **FSA (Farm Sustainability Assessment, SAI Platform)** como certificación objetivo en Panel, Plan, Lote e Informe; "soja responsable" → **"producción agrícola sustentable"**. *(El resumen de Gemini dice "FCA"; la sigla correcta es FSA.)*
- [ ] "Bosque nativo (protegido)" → **"Parches de bosque"** en mapa, capas, leyendas, PDF. Mock: **2+ parches** dentro/al borde de los lotes para que el corredor los conecte.
- [ ] Capas nuevas en el mapa (mock): **Mapa de rendimiento** (zonas de bajo rinde histórico) y **Zonas inundables**.
- [ ] Vista **"Conectividad (Circuitscape)"**: mapa de calor de corriente entre parches + corredor sugerido sobre las zonas de bajo rinde. Rotulado: *"Modelado de conectividad · Circuitscape (teoría de circuitos)"*.
- [ ] Citas en la app: reemplazar "[FUENTE A CITAR]" por Amarilla 2025 y Galetto 2026.

### 3.2 Video tecnológico (40 s planificados, máx. 50 s)
- Ruta **`/demo`** en la app que se recorre sola con tiempos exactos y tarjetas superpuestas; se graba con **Playwright** y se exporta a **MP4 1920×1080 con ffmpeg** (sin audio: Nehuen narra en vivo).
- Estilo a elegir: **A · celular en escena** (recomendado) / **B · pantalla completa** / **C · explicativo híbrido**. Paleta: azul marino + verde del Instagram de Syntra.

| Seg. | En pantalla | Tarjeta de tecnología | Guion (Nehuen, en vivo) |
|---|---|---|---|
| 0–8 | Mapa: lote + capas rendimiento, inundables, parches | *Sentinel-2 · Mapa de rendimiento · Zonas inundables* | "Cruzamos imágenes satelitales con el mapa de rendimiento de la cosechadora y las zonas inundables: así elegimos dónde va la infraestructura verde **sin perder superficie productiva**." |
| 8–16 | Mapa de calor + corredor que une dos parches | *Circuitscape · teoría de circuitos · código abierto* | "Con Circuitscape, software científico de código abierto, modelamos por dónde se mueven polinizadores y enemigos naturales entre los parches de bosque, y trazamos el corredor mínimo que los conecta." |
| 16–24 | FSA: requisitos + plan de acción con especies | *Motor de requisitos por certificación (FSA)* | "Cada certificación se traduce en requisitos: Syntra muestra qué cumple el campo y arma el plan de acción, con especies nativas y plazos." |
| 24–32 | Sellar evidencia → "Simular alteración" → **Alterado ✗** | *SHA-256 · Merkle · Blockchain Federal Argentina* | "Cada dato y cada monitoreo se sella en la Blockchain Federal Argentina: es un escribano digital. Si alguien cambia un dato, se detecta." |
| 32–40 | Informe PDF por certificación | *Informe de evidencia · listo para el auditor de la certificadora* | "Al final, un informe de evidencia ambiental por certificación, listo para el auditor de la certificadora. Biodiversidad que el productor puede demostrar." |
| (40–50) | Margen / respiración | — | — |

### 3.3 Entregables del P0
- [ ] `syntra-demo-tecnologia.mp4` (1920×1080, ~42 s, mudo) + versión vertical opcional.
- [ ] Guion con marcas de tiempo (tabla de arriba) en un archivo aparte para ensayar.
- [ ] Captura limpia de cada escena (por si falla el video en Canva).
- [ ] Deploy actualizado en syntra-agro.vercel.app.

### 3.4 Diapositiva "blockchain y trazabilidad" (antes del video)
Título: **"Trazabilidad verificable"** · 3 íconos/columnas:
1. **Dato de campo** (satélite, monitoreo, foto georreferenciada)
2. **Huella digital** (SHA-256: cualquier cambio la altera)
3. **Sello de tiempo en la Blockchain Federal Argentina** ("escribano digital": prueba qué existía y cuándo)
Pie: *"La blockchain prueba cuándo y que no cambió; el auditor de la certificadora verifica que el dato es real."*

### 3.5 Ensayo
- [ ] Cronometrar: Leo ≈ 2:10 · Nehuen ≈ 0:50 (diapo blockchain 5–8 s + video 40–42 s). Margen total ≤ 3:00.

## 4. P1 — Después del pitch (para la segunda ronda, si pasamos)

| # | Tarea | Detalle | Est. |
|---|---|---|---|
| 1 | **PDF por certificación** | Selector de certificación en Informe; el PDF solo incluye esa certificación | 1 h |
| 2 | **Revisión externa** | Estado *Listo para auditor*; campo opcional para cargar el dictamen/firma del auditor de la certificadora y sellarlo | 1,5 h |
| 3 | **Informe de especies y manejo** | Por corredor: especies de la ecorregión, densidad, época de plantación/trasplante, riego, cuidados (validado por Leo) | 2 h |
| 4 | **Plan plurianual realista** | Año 0 implementación (~1 año) → monitoreos por campaña hasta 5 años; metas (supervivencia, +% superficie intervenida, +polinizadores) | 2 h |
| 5 | **Trazabilidad mejorada** | Hash completo visible, link "ver archivo original" (JSON/foto), filtro por fuente | 1,5 h |
| 6 | **Registrar acción simplificado** | 3 campos + respaldo; resto opcional plegado | 1 h |
| 7 | **Cumplimiento expandible** | Tocar cada eje del Panel y ver qué cumple / qué falta | 1 h |
| 8 | **Rebranding** | Paleta y tipografía del Instagram (azul marino + hoja verde) | 2 h |
| 9 | **Impacto social en la app** | Indicadores: empleo local en implantación/monitoreo, servicios ecosistémicos para la comunidad (agua, sombra, polinización), resiliencia | 1,5 h |

## 5. P2 — Hacerlo real (post-hackatón / segunda ronda larga)

| # | Tarea | Cómo |
|---|---|---|
| 1 | **Motor de conectividad real** | Capas → *superficie de resistencia* (rendimiento, suelo, inundables, NDVI, biodiversidad funcional) → **Circuitscape.jl** (servicio Julia en backend) con parches como nodos focales → mapa de corriente (la "sexta capa") → extracción del corredor. Para la demo puede usarse una versión propia en el navegador del mismo método (resolver la red de resistencias en una grilla) |
| 2 | **Datos satelitales reales** | Sentinel-2 (NDVI, cambio de cobertura) vía Copernicus/Sentinel Hub o Google Earth Engine; focos de calor de NASA FIRMS |
| 3 | **Mapa de rendimiento real** | Importar shapefile/CSV de monitores de cosechadora (John Deere Ops Center, etc.) |
| 4 | **Sellado real en BFA** | Nodo/servicio de sellado de la Blockchain Federal Argentina (Merkle diario, como en Mando NEC); almacenamiento WORM de evidencias |
| 5 | **Backend y cuentas** | Usuarios (productor, perito, certificadora), persistencia, permisos de solo lectura para certificadoras |
| 6 | **App de campo offline** | PWA con cola offline para monitoreos sin señal (lo que hace Cropwise con tablets) |
| 7 | **Planes por presupuesto** | Básico / medio / premium según ha implantadas y especies |
| 8 | **Garantía de reposición** | Evento "pérdida" → reposición → nuevo sellado |
| 9 | **Requisitos FSA/GlobalG.A.P. validados** | Mapear indicadores oficiales FSA y GlobalG.A.P. a requisitos verificables (con Leo) |

## 6. Competencia: Cropwise (Syngenta)

- Plataforma digital consolidada: gestión de operaciones, imágenes satelitales, monitoreo en campo con apps que funcionan **sin señal**, y un representante que verifica en campo (según Leo).
- **No tiene el núcleo científico**: no diseña biodiversidad funcional ni modela conectividad.
- **Diferencial de Syntra:** ciencia propia (papers CONICET/IMBIV) + Circuitscape + evidencia sellada lista para el auditor. Ellos *miden*; Syntra *diseña, implementa y demuestra*.
- Aprender de ellos: funcionamiento offline, capacitación y acompañamiento humano (el productor no es especialista en tecnología).

## 7. Pendientes de otros (para no bloquearnos)
- Leo: fuente de **soja 12–14%** y **maní +20%**; validar especies/densidades; confirmar requisitos FSA clave.
- Bruno + Leo: cierre de la presentación.
- Dahyana: invitar a Mica al ensayo.
- Grupo: fuentes al pie de cada diapositiva.
