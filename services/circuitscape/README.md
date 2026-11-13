# Servicio de conectividad (Circuitscape.jl)

> **No ejecutado en este entorno (sin Julia); verificar.** El código se escribió siguiendo la documentación de Circuitscape.jl, HTTP.jl y JSON3.jl, pero nunca se corrió. Antes de depender de él: levantarlo, comparar su salida con la implementación en el navegador (`apps/web/src/lib/conectividad.ts`) sobre la misma grilla y revisar el UUID de `Circuitscape` en `Project.toml` (`julia -e 'using Pkg; Pkg.add("Circuitscape")'` lo regenera).

Servicio HTTP mínimo que recibe una superficie de resistencia y nodos focales (parches de bosque), corre Circuitscape en modo **pairwise** y devuelve el **mapa de corriente acumulada** (la "sexta capa"). Reemplaza a futuro el solver en el navegador, con el mismo contrato de entradas y salidas.

## Cómo correrlo

Con Julia >= 1.9:

```bash
cd services/circuitscape
julia --project=. -e 'using Pkg; Pkg.instantiate()'
julia --project=. server.jl          # http://localhost:8080  (PORT para cambiarlo)
```

Con Docker (imagen `julia:1.10.5`):

```bash
docker build -t syntra-circuitscape services/circuitscape
docker run --rm -p 8080:8080 syntra-circuitscape
```

Variables: `PORT` (8080), `CORS_ORIGIN` (`*`; en producción poner el origen de la app). El servicio no tiene autenticación: ponerlo detrás del API backend, no expuesto a internet.

## Contrato

`GET /salud` -> `{"ok": true}`

`POST /conectividad` (JSON):

```jsonc
{
  "resistencia": [[8, 8, 10], [8, 1, 4]],   // matriz rows x cols (anidada) o plana row-major + "rows"/"cols"
  "bounds": { "norte": -30.106, "sur": -30.1305, "oeste": -63.4995, "este": -63.47 },
  "cellsize": 0.000327,                      // opcional, en grados; si falta = (este - oeste) / cols
  "nodos": [[1, 4], [93, 94]]                // nodos focales: lista de celdas (índice 0-based row-major) por parche
}
```

Respuesta 200:

```jsonc
{
  "grid": { "rows": 75, "cols": 90, "bounds": { "norte": ..., "sur": ..., "oeste": ..., "este": ... } },
  "corriente": [0.0, 0.1, ...],       // rows*cols, row-major desde la esquina NO, normalizada 0..1 (tope p99)
  "corrienteCruda": [...],            // misma forma, amperios acumulados sobre todos los pares
  "metricas": { "celdas": 6750, "pares": 3, "ms": 1234, "motor": "Circuitscape.jl" }
}
```

Errores: 400 `{"error": "..."}` por entrada inválida, 500 por fallo de Circuitscape.

### Equivalencia con `conectividad.ts`

| Concepto | Navegador | Este servicio |
|---|---|---|
| Grilla | `ROWS x COLS` (75 x 90), row-major desde la esquina noroeste | idem (`resistencia`) |
| Extensión | `extensionModelo` `{norte, sur, oeste, este}` | `bounds`; en el `.asc`: `xllcorner = oeste`, `yllcorner = sur` (esquina SO), `cellsize` en grados |
| Resistencia | `construirResistencia` (parche 1, inundable 3, bajo rinde 4 / medio 6, lote 10, otro 8) | la manda el cliente tal cual |
| Nodos focales | `parches[k]`: lista de índices de celda | `nodos[k]`, mismos índices |
| Conexión | 4 vecinos, conductancia `2 / (ri + rj)` | `connect_four_neighbors_only = True`, `connect_using_avg_resistances = True` |
| Pares | todos los pares de parches (P1-P2, P1-P3, P2-P3), 1 A cada uno | `scenario = pairwise` con `use_included_pairs = False` |
| Salida | `corriente` Float32 normalizado 0..1 (p99) | `corriente` igual, más `corrienteCruda` |
| Corredores | Dijkstra de costo `resistencia / (0.2 + corriente)` en el cliente | **no incluido**: seguir calculándolos en el cliente (o portar `caminoMinimo`) con `corriente` y la resistencia |

Diferencias esperables: Circuitscape calcula la corriente por celda con su propio criterio (suma de corrientes por arista) y resuelve con solvers distintos (CHOLMOD / CG-AMG), así que los valores crudos pueden diferir levemente; la normalización 0..1 debería dar un mapa cualitativamente igual. Verificarlo es parte de la tarea pendiente.

### Para cambiar el frontend más adelante

`modelarConectividad()` es síncrona y memoizada; una versión remota sería `async`: construir `res` y `parches` (ya existen en `construirResistencia`), `POST` a este servicio, convertir `corriente` a `Float32Array` y calcular los corredores localmente. No se tocó `conectividad.ts` en esta entrega.
