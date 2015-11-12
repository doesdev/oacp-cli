CREATE OR REPLACE FUNCTION {{namespace}}_{{resource}}_create(p_jsonb jsonb)
  RETURNS jsonb AS
$BODY$

DECLARE
  v_{{primary_key}} {{pkey_type}};

BEGIN

  INSERT INTO {{resource}} (
    {{column_list}}
  ) (
    SELECT
      {{column_list_b}}
  ) RETURNING {{primary_key}} INTO v_{{primary_key}};

  RETURN {{namespace}}_{{resource}}_read(
    json_build_object(
      'id_array', ARRAY[v_{{primary_key}}]::{{pkey_type}}[]
    )::jsonb
  );

END;

$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
