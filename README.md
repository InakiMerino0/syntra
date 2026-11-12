# synta
Trazabilidad agropecuaria para el productor

## Contexto

**Hack to the Future** — hackatón de ideas, side event de la Córdoba Tech Week 2026 (12 y 13/11). Organizan ITC y Córdoba Cluster (proyecto Social Accelerator, financiamiento UE – Global Gateway).

**Vertical 02 — Transición verde y sostenible en el agro.** Desafío: *"imaginar soluciones que ayuden a avanzar hacia una producción agropecuaria más sostenible, combinando tecnología, innovación y cuidado ambiental"* (uso eficiente de agua, suelo y energía, menos emisiones).

### Criterios de evaluación

Jurado de 12 personas (3 por vertical), cada criterio de 1 a 5:

| Peso | Criterio |
|---|---|
| 25% | Impacto social y ambiental |
| 20% | Innovación y originalidad |
| 20% | Factibilidad técnica y económica |
| 15% | Escalabilidad y sostenibilidad |
| 10% | Vínculo con el ecosistema |
| 10% | Pitch y equipo |

Día 2: pitch por vertical → 8 finalistas → 4 ganadores (incubación UE 2027).

## Qué es Synta

Plataforma de trazabilidad que ayuda al productor agropecuario a validar su cumplimiento del marco regulatorio en 4 ejes:

1. Regulación provincial / zonal (ej. ordenamiento de bosque nativo de Córdoba)
2. Regulación nacional (ej. Ley 26.331 de Bosques)
3. Regulación internacional (ej. EUDR — reglamento UE de deforestación: geolocalización + no deforestación post 31/12/2020)
4. Certificaciones nacionales e internacionales

Flujo:

1. El productor dibuja polígonos de sus lotes en un mapa.
2. Se obtienen datos satelitales públicos de esos lotes (rasters vía API: NDVI, cambio de cobertura, focos de calor).
3. Se corre un análisis algorítmico de biodiversidad.
4. Datos, análisis e hitos productivos se firman (hash anclado en blockchain) → historial inmutable y verificable.
5. Se evalúa el cumplimiento contra los 4 ejes.

> Pendiente: verificar fechas vigentes de aplicación de EUDR y número de ley provincial de bosques antes del pitch.

**Frase guía:** *Ayudamos a productores de Córdoba a demostrar que producen sin deforestar mediante datos satelitales firmados, para que accedan a mercados exigentes como la UE.*

## Prototipo (frontend)

React + Vite, sin backend. Todo con datos mock salvo el mapa y los polígonos. El hash SHA-256 se puede calcular de verdad con Web Crypto; la transacción on-chain es simulada.

### Pantallas

1. **Landing / login** — propuesta de valor + botón "Entrar como productor demo" (sin auth real).
2. **Dashboard del establecimiento** — campo, hectáreas, nº de lotes; 4 tarjetas de cumplimiento por eje (semáforo + %); índice de biodiversidad global; timeline de últimos eventos firmados.
3. **Mapa y lotes** — mapa satelital full screen con dibujo/edición de polígonos; panel lateral con lotes (nombre, cultivo, ha, estado); capas toggle: NDVI, bosque nativo protegido, focos de calor; CTA "Analizar y certificar lote".
4. **Procesamiento** — stepper animado: imágenes Sentinel-2 → índices → biodiversidad → hash → anclaje blockchain → listo.
5. **Detalle del lote** — tabs:
   - *Satélite*: antes/después (2020 vs hoy) + serie temporal NDVI.
   - *Biodiversidad*: score 0–100 desglosado (cobertura nativa, bordes/corredores, heterogeneidad) + recomendaciones accionables.
   - *Cumplimiento*: checklist por eje/norma (cumple / no cumple / falta dato) con la evidencia.
   - *Trazabilidad*: registros firmados del lote.
6. **Explorador de trazabilidad / verificación** — timeline histórico (lote creado, satélite, análisis, siembra, insumos, cosecha) con hash, fecha, bloque y fuente; botón "Verificar"; vista pública por QR/link para compradores y certificadores.
7. **Reporte / certificado exportable** — "Pasaporte de cumplimiento" imprimible/PDF con mapa, estado por eje, hashes y QR.
8. **Registrar acción productiva** *(opcional)* — formulario simple (siembra, fertilización, riego) que se firma y aparece en el timeline.

**Mínimo para la demo:** 3 → 4 → 5 → 6, con 2 como home. 7 y 8 si sobra tiempo.

**Guion de demo:** dibujo un lote → certifico → veo biodiversidad y cumplimiento → muestro el QR que vería el comprador europeo.
