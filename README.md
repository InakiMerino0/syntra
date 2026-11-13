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

## Qué es Syntra

Syntra acerca a los productores agropecuarios a la certificación que necesitan para exportar: les muestra qué les falta, les indica cómo cerrarlo con biodiversidad y les deja la evidencia lista para el certificador.

### Problema

Muchos productores no logran demostrar que cumplen los requisitos ambientales de los mercados de exportación, en especial los de biodiversidad. Esos requisitos además cambian según la certificadora. Resultado: pierden mercados y el proceso es tan complejo que el 90% necesita tercerizarlo.

### Solución

Una plataforma donde el productor:

1. Dibuja sus lotes en un mapa.
2. Obtiene un diagnóstico satelital de su campo (línea de base: NDVI, cambio de cobertura, focos de calor).
3. Elige la certificación que busca y ve qué cumple y qué le falta (parámetros variables según el estándar).
4. Recibe recomendaciones concretas para implementar esas mejoras, por ejemplo dónde y cuánta vegetación nativa sumar mediante corredores biológicos autosustentables.
5. Registra cada dato e intervención firmado (hash anclado en blockchain) → evidencia verificable para el certificador o el comprador.

Marcos que se pueden evaluar: regulación provincial (ordenamiento de bosque nativo de Córdoba), nacional (Ley 26.331 de Bosques), internacional (EUDR — geolocalización + no deforestación post 31/12/2020) y certificaciones nacionales e internacionales.

### Diferencial

Otras herramientas miden o reportan; Syntra además te dice qué hacer en tu campo para certificar, con respaldo científico propio: la investigación del equipo en corredores biológicos funcionales y un caso real que lleva 10 años funcionando y accedió al mercado europeo. Y mejora el rinde: según estudios del equipo, soja +14%, maní +20%, girasol +30%; en ganadería la vegetación actúa como isla de enfriamiento ante el estrés calórico.

### Visión

Ser el puente entre el productor y la certificación para exportar: traducir lo que exige cada estándar en acciones concretas en el campo, acompañar el proceso y llevar al productor hasta la certificación.

> Pendiente antes del pitch: los datos de rinde ya citan Galetto et al. 2026 y Amarilla et al. 2025 (falta citar fuente de mercado); verificar fechas vigentes de aplicación de EUDR y número de ley provincial de bosques; confirmar ecorregión (Chaco Seco) y especies nativas recomendadas para Río Seco; rango de cobertura forestal mínima de la Ley Agroforestal (2–5%).

**Frase guía:** *Ayudamos a productores y agroexportadores a acceder a mercados internacionales mediante una plataforma que adapta sus parámetros a cada certificación y les indica cómo incorporar biodiversidad para cumplirla.*

## Prototipo (frontend)

React + Vite, sin backend. Todo con datos mock salvo el mapa y los polígonos. El hash SHA-256 se puede calcular de verdad con Web Crypto; la transacción on-chain es simulada.

### Pantallas

1. **Landing / login** — propuesta de valor + botón "Entrar como productor demo" (sin auth real).
2. **Dashboard del establecimiento** — campo, hectáreas, nº de lotes; 4 tarjetas de cumplimiento por eje (semáforo + %); índice de biodiversidad global; timeline de últimos eventos firmados.
3. **Mapa y lotes** — mapa satelital full screen con dibujo/edición de polígonos; panel lateral con lotes (nombre, cultivo, ha, estado); capas toggle: NDVI, parches de bosque, focos de calor; CTA "Analizar y certificar lote".
4. **Procesamiento** — stepper animado: imágenes Sentinel-2 → índices → biodiversidad → hash → anclaje blockchain → listo.
5. **Detalle del lote** — tabs:
   - *Satélite*: antes/después (2020 vs hoy) + serie temporal NDVI.
   - *Biodiversidad*: score 0–100 desglosado (cobertura nativa, bordes/corredores, heterogeneidad) + corredores sugeridos dibujados sobre el mapa + recomendaciones accionables.
   - *Cumplimiento*: selector de certificación objetivo + checklist (cumple / no cumple / falta dato) con la evidencia y las mejoras necesarias para cumplir cada requisito.
   - *Trazabilidad*: registros firmados del lote.
6. **Explorador de trazabilidad / verificación** — timeline histórico (lote creado, satélite, análisis, siembra, insumos, cosecha) con hash, fecha, bloque y fuente; botón "Verificar"; vista pública por QR/link para compradores y certificadores.
7. **Reporte / certificado exportable** — "Informe de Evidencia Ambiental" en PDF descargable con estado de cumplimiento, sello de integridad (BFA, simulado), inventario de archivos con hashes y QR de verificación.
8. **Registrar acción productiva** *(opcional)* — formulario simple (siembra, fertilización, riego) que se firma y aparece en el timeline.

**Mínimo para la demo:** 3 → 4 → 5 → 6, con 2 como home. 7 y 8 si sobra tiempo.

**Guion de demo:** dibujo un lote → elijo la certificación → veo qué me falta y los corredores recomendados → muestro el QR que vería el comprador europeo.

### Cómo correrlo

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # typecheck + build de producción
```

Monorepo (pnpm workspaces):

- `apps/web` — app React + Vite + TS. Una pantalla por archivo en `src/screens/`, rutas en `src/App.tsx`.
- `packages/ui` — tokens CSS, sidebar/layout y primitivas compartidas (`Badge`, `ProgressBar`, `sha256`).
- `packages/data` — datos mock (lotes, certificaciones, corredores, eventos). Única fuente de datos hasta que haya backend.
- `design/` — mockups de referencia de cada pantalla.
