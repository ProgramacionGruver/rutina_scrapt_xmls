export const obtenerProductosQuery = `
SELECT
pts_idparte AS codigo_parte,
pts_desparte AS descripcion,
pts_grupo AS id_grupo,
pts_cunrepo AS costo_planta,
alm_ctoprom AS costo_promedio,
(alm_existen - alm_apartada - alm_proceso) AS stck1,
par_almacen.ALM_MAX AS 'max',
par_almacen.ALM_MIN AS 'min',
(alm_existen - alm_apartada - alm_proceso) * alm_ctoprom AS stock_cost,
/*pts_cunulco <--- Revisar si este costo es promedio o no*/
par_almacen.alm_backorder AS reorden

FROM
gomsa356_gmve.dbo.Par_Partes
INNER JOIN gomsa356_gmve.dbo.par_almacen ON pts_idparte = alm_idparte
WHERE
par_almacen.alm_idalma IN ('GEN')
AND (alm_existen - alm_apartada - alm_proceso) > 0

`