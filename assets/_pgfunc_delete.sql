CREATE OR REPLACE FUNCTION {{namespace}}_{{resource}}_delete(p_jsonb jsonb)
  RETURNS jsonb AS
$BODY$

DECLARE
  v_{{primary_key}} {{pkey_type}};

BEGIN

  SELECT (jsonb_to_int_array(p_jsonb->'id_array')::int[])[1] INTO v_{{primary_key}};

  IF NULLIF(v_{{primary_key}}, 0) IS null THEN
    RETURN json_build_object('error', 'invalid-params')::jsonb;
  END IF;

  DELETE FROM {{resource}} WHERE {{primary_key}} = v_{{primary_key}};

  RETURN to_json('successful'::text)::jsonb;

END;

$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
