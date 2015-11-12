CREATE OR REPLACE FUNCTION {{namespace}}_{{resource}}_update(p_jsonb jsonb)
  RETURNS jsonb AS
$BODY$

DECLARE
  v_{{primary_key}} {{pkey_type}};
  v_out jsonb;

BEGIN

  SELECT (p_jsonb->>'{{primary_key}}')::{{pkey_type}} INTO v_{{primary_key}};

  UPDATE {{resource}} SET
    {{column_list}}
  WHERE {{primary_key}} = v_{{primary_key}};

  RETURN {{namespace}}_{{resource}}_read(
    json_build_object(
      'id_array', ARRAY[v_{{primary_key}}]::{{pkey_type}}[]
    )::jsonb
  );

END;

$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
