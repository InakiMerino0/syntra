# NO ejecutado en este entorno (sin Julia/Docker): verificar el build antes de usar.
FROM julia:1.10.5
WORKDIR /app
COPY Project.toml ./
# Instala y precompila dependencias (capa cacheable). Si existe Manifest.toml, copiarlo para builds reproducibles.
RUN julia --project=. -e "using Pkg; Pkg.instantiate(); Pkg.precompile()"
COPY server.jl ./
ENV PORT=8080
EXPOSE 8080
CMD ["julia", "--project=.", "server.jl"]
