-- ============================================================
-- SCRIPT DE FUNCIONES / STORED PROCEDURES
-- Prueba técnica Viamatica - Sistema de Gestión de Caja
--
-- NOTA: Esta función se crea AUTOMÁTICAMENTE al arrancar el backend
-- (ver Backend/src/infrastructure/seed.js). Este script se adjunta
-- como entregable según lo solicitado en la prueba.
-- ============================================================

-- fn_cambiar_servicio: implementa la regla de negocio del CRUD de contratos:
--   "Si un cliente pide el cambio de servicio, el contrato cambia de estado
--    (VIG -> SUS, contrato sustituido), se crea un nuevo registro con un
--    estado de renovación (REN) y la fecha final del contrato SE MANTIENE."
--
-- Parámetros:
--   p_contractid     id del contrato vigente a sustituir
--   p_new_serviceid  id del nuevo servicio contratado
-- Retorna: id del nuevo contrato creado (estado REN)
--
-- Uso:  SELECT fn_cambiar_servicio(1, 2);

CREATE OR REPLACE FUNCTION fn_cambiar_servicio(p_contractid INTEGER, p_new_serviceid INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_old contract%ROWTYPE;
  v_new_id INTEGER;
BEGIN
  SELECT * INTO v_old FROM contract WHERE contractid = p_contractid AND deleted = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato % no existe o fue eliminado', p_contractid;
  END IF;
  IF v_old.statuscontract_statusid <> 'VIG' THEN
    RAISE EXCEPTION 'Solo se puede cambiar el servicio de un contrato VIGENTE';
  END IF;

  -- 1) El contrato actual pasa a SUSTITUIDO
  UPDATE contract SET statuscontract_statusid = 'SUS' WHERE contractid = p_contractid;

  -- 2) Se crea un nuevo registro en estado RENOVACIÓN manteniendo la fecha fin
  INSERT INTO contract (startdate, enddate, service_serviceid, statuscontract_statusid,
                        client_clientid, methodpayment_methodpaymentid, deleted)
  VALUES (NOW(), v_old.enddate, p_new_serviceid, 'REN',
          v_old.client_clientid, v_old.methodpayment_methodpaymentid, false)
  RETURNING contractid INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;
