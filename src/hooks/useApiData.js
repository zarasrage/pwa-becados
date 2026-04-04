import { useCallback, useEffect, useRef, useState } from "react";
import { apiSWR, apiGet } from "../utils/api.js";
import { cacheSet, cacheGet } from "../utils/cache.js";

/**
 * Hook de caché unificado para todas las tabs.
 *
 * Comportamiento:
 * - Muestra datos cacheados inmediatamente (sin skeleton)
 * - Si el caché es viejo (>24h) o la versión del backend cambió,
 *   revalida en background mostrando `updating=true` ("Actualizando…")
 * - Los datos viejos permanecen en pantalla hasta que lleguen los nuevos
 * - Si no hay caché, muestra skeleton (data=null) mientras carga
 * - refresh() fuerza fetch fresco sin borrar lo que se está mostrando
 */
export function useApiData(params) {
  const paramsKey = params ? JSON.stringify(params) : null;
  const [data, setData]       = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError]     = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const prevParamsKeyRef = useRef(paramsKey);

  // Recargar cuando el backend detecta cambio de versión en el Sheet
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener("dataVersionChanged", handler);
    return () => window.removeEventListener("dataVersionChanged", handler);
  }, []);

  useEffect(() => {
    if (!paramsKey) return;
    setError("");

    const paramsChanged = paramsKey !== prevParamsKeyRef.current;
    prevParamsKeyRef.current = paramsKey;

    // Si navegamos a parámetros nuevos sin caché → limpiar data para mostrar skeleton
    // Si fue un refreshKey (version change) → mantener data vieja + mostrar "actualizando"
    if (paramsChanged && !cacheGet(params)) setData(null);

    const bail = setTimeout(() => {
      setUpdating(false);
      setError("No se pudo conectar. Comprueba tu conexión.");
    }, 12000);

    apiSWR(
      params,
      (staleData) => {
        // Tenemos caché: mostrar inmediatamente + empezar revalidación background
        clearTimeout(bail);
        setData(staleData);
        setUpdating(true);
      },
      (freshData) => {
        // Datos frescos llegaron (o no era necesario revalidar)
        clearTimeout(bail);
        setData(freshData);
        setUpdating(false);
      }
    ).catch(e => {
      clearTimeout(bail);
      setUpdating(false);
      setError(String(e.message || e));
    });

    return () => clearTimeout(bail);
  }, [paramsKey, refreshKey]);

  // Refresh manual (pull-to-refresh, botón ↻)
  // Muestra "actualizando" mientras fetch — NO borra datos actuales
  const refresh = useCallback(() => {
    if (!params) return;
    setUpdating(true);
    setError("");
    apiGet(params)
      .then(fresh => { cacheSet(params, fresh); setData(fresh); setUpdating(false); })
      .catch(() => setUpdating(false));
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, updating, error, refresh };
}
