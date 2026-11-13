# Servicio mínimo de conectividad (Circuitscape.jl, modo pairwise) para Syntra.
# NO EJECUTADO en este entorno (sin Julia): verificar antes de usar.
#
#   julia --project=. -e 'using Pkg; Pkg.instantiate()'
#   julia --project=. server.jl        # escucha en 0.0.0.0:$PORT (default 8080)
#
# Contrato: ver README.md. Semántica de grilla idéntica a apps/web/src/lib/conectividad.ts:
# row-major desde la esquina noroeste, bounds {norte,sur,oeste,este}, conectividad de 4 vecinos con
# resistencia promedio (conductancia = 2/(ri+rj)), una corriente de 1 A por par de nodos focales.

using HTTP, JSON3, Circuitscape

const NODATA = -9999

struct ErrorEntrada <: Exception
    msg::String
end

# --- Entrada ---------------------------------------------------------------

"Devuelve (rows, cols, vals::Matrix{Float64}) a partir de `resistencia` (matriz anidada, o plana + rows/cols)."
function leer_resistencia(req)
    haskey(req, :resistencia) || throw(ErrorEntrada("falta `resistencia`"))
    r = req[:resistencia]
    if !isempty(r) && r[1] isa AbstractVector
        rows = length(r); cols = length(r[1])
        all(length(f) == cols for f in r) || throw(ErrorEntrada("filas de distinto largo"))
        vals = Float64[r[i][j] for i in 1:rows, j in 1:cols]
    else
        (haskey(req, :rows) && haskey(req, :cols)) || throw(ErrorEntrada("resistencia plana requiere `rows` y `cols`"))
        rows = Int(req[:rows]); cols = Int(req[:cols])
        length(r) == rows * cols || throw(ErrorEntrada("resistencia.length != rows*cols"))
        vals = permutedims(reshape(Float64.(collect(r)), cols, rows))  # row-major -> Matrix rows×cols
    end
    any(v -> !(v > 0) || !isfinite(v), vals) && throw(ErrorEntrada("la resistencia debe ser > 0 y finita"))
    return rows, cols, vals
end

"Escribe una grilla ASCII (.asc). Origen = esquina SO (xllcorner = oeste, yllcorner = sur)."
function escribir_asc(path, M::AbstractMatrix, xll, yll, cellsize)
    rows, cols = size(M)
    open(path, "w") do io
        println(io, "ncols ", cols)
        println(io, "nrows ", rows)
        println(io, "xllcorner ", xll)
        println(io, "yllcorner ", yll)
        println(io, "cellsize ", cellsize)
        println(io, "NODATA_value ", NODATA)
        for i in 1:rows
            println(io, join(M[i, :], " "))
        end
    end
end

"Lee una grilla ASCII de salida de Circuitscape. NODATA -> 0."
function leer_asc(path)
    lines = readlines(path)
    hdr = Dict(lowercase(split(l)[1]) => parse(Float64, split(l)[2]) for l in lines[1:6])
    nd = get(hdr, "nodata_value", NODATA)
    rows = Int(hdr["nrows"]); cols = Int(hdr["ncols"])
    M = zeros(Float64, rows, cols)
    for i in 1:rows
        v = parse.(Float64, split(lines[6 + i]))
        for j in 1:cols
            M[i, j] = v[j] == nd ? 0.0 : v[j]
        end
    end
    return M
end

# --- Núcleo ----------------------------------------------------------------

function conectividad(req)
    rows, cols, res = leer_resistencia(req)
    haskey(req, :bounds) || throw(ErrorEntrada("falta `bounds` {norte,sur,oeste,este}"))
    b = req[:bounds]
    norte, sur, oeste, este = Float64(b[:norte]), Float64(b[:sur]), Float64(b[:oeste]), Float64(b[:este])
    # cellsize en grados; si falta se deduce de los bounds (igual que dLng en conectividad.ts).
    cellsize = haskey(req, :cellsize) ? Float64(req[:cellsize]) : (este - oeste) / cols

    haskey(req, :nodos) || throw(ErrorEntrada("falta `nodos` (lista de nodos focales; cada uno, lista de índices de celda 0-based row-major)"))
    nodos = [Int.(collect(n)) for n in req[:nodos]]
    length(nodos) >= 2 || throw(ErrorEntrada("se necesitan al menos 2 nodos focales"))

    focal = fill(NODATA, rows, cols)
    for (k, celdas) in enumerate(nodos)
        for idx in celdas
            0 <= idx < rows * cols || throw(ErrorEntrada("índice de celda fuera de rango: $idx"))
            focal[idx ÷ cols + 1, idx % cols + 1] = k
        end
    end

    mktempdir() do dir
        habitat = joinpath(dir, "res.asc"); puntos = joinpath(dir, "focal.asc")
        salida = joinpath(dir, "out", "out"); mkpath(dirname(salida))
        escribir_asc(habitat, res, oeste, sur, cellsize)
        escribir_asc(puntos, focal, oeste, sur, cellsize)
        ini = joinpath(dir, "run.ini")
        write(ini, """
        [Circuitscape mode]
        data_type = raster
        scenario = pairwise

        [Version]
        version = unknown

        [Habitat raster or graph]
        habitat_file = $(habitat)
        habitat_map_is_resistances = True

        [Connection scheme for raster habitat data]
        connect_four_neighbors_only = True
        connect_using_avg_resistances = True

        [Short circuit regions (aka polygons)]
        use_polygons = False

        [Options for pairwise and one-to-all and all-to-one modes]
        point_file = $(puntos)
        use_included_pairs = False

        [Output options]
        output_file = $(salida).out
        write_cum_cur_map_only = True
        write_cur_maps = True
        write_volt_maps = False
        """)

        t0 = time()
        compute(ini)
        ms = round(Int, (time() - t0) * 1000)

        # Con write_cum_cur_map_only Circuitscape escribe <salida>_cum_curmap.asc
        cum = joinpath(dir, "out", "out_cum_curmap.asc")
        isfile(cum) || throw(ErrorEntrada("Circuitscape no produjo out_cum_curmap.asc (revisar nombres de salida de la versión instalada)"))
        I = leer_asc(cum)

        # Normalización 0..1 con tope en el percentil 99 (igual que conectividad.ts).
        v = sort(vec(I))
        tope = v[clamp(floor(Int, length(v) * 0.99) + 1, 1, length(v))]
        tope = tope > 0 ? tope : (maximum(v) > 0 ? maximum(v) : 1.0)
        norm = [min(1.0, I[i, j] / tope) for i in 1:rows, j in 1:cols]

        return Dict(
            :grid => Dict(:rows => rows, :cols => cols, :bounds => Dict(:norte => norte, :sur => sur, :oeste => oeste, :este => este)),
            # row-major desde la esquina noroeste, 0..1 (campo `corriente` de ResultadoConectividad)
            :corriente => vec(permutedims(norm)),
            :corrienteCruda => vec(permutedims(I)),
            :metricas => Dict(:celdas => rows * cols, :pares => length(nodos) * (length(nodos) - 1) ÷ 2, :ms => ms, :motor => "Circuitscape.jl"),
        )
    end
end

# --- HTTP ------------------------------------------------------------------

const HDR = ["Content-Type" => "application/json", "Access-Control-Allow-Origin" => get(ENV, "CORS_ORIGIN", "*")]

function manejar(req::HTTP.Request)
    if req.method == "OPTIONS"
        return HTTP.Response(204, [HDR..., "Access-Control-Allow-Methods" => "POST, GET, OPTIONS", "Access-Control-Allow-Headers" => "Content-Type"])
    elseif req.method == "GET" && req.target == "/salud"
        return HTTP.Response(200, HDR, JSON3.write(Dict(:ok => true)))
    elseif req.method == "POST" && req.target == "/conectividad"
        try
            cuerpo = JSON3.read(String(req.body))
            return HTTP.Response(200, HDR, JSON3.write(conectividad(cuerpo)))
        catch e
            if e isa ErrorEntrada
                return HTTP.Response(400, HDR, JSON3.write(Dict(:error => e.msg)))
            end
            @error "fallo en /conectividad" exception = (e, catch_backtrace())
            return HTTP.Response(500, HDR, JSON3.write(Dict(:error => "error interno: " * sprint(showerror, e))))
        end
    end
    return HTTP.Response(404, HDR, JSON3.write(Dict(:error => "no encontrado")))
end

port = parse(Int, get(ENV, "PORT", "8080"))
@info "Syntra Circuitscape escuchando en :$port"
HTTP.serve(manejar, "0.0.0.0", port)
