CREATE OR REPLACE FUNCTION {{namespace}}_{{resource}}_read(p_jsonb jsonb)
  RETURNS jsonb AS
$BODY$

DECLARE
  v_{{primary_key}}s {{pkey_type}}[];
  v_out jsonb;

BEGIN

  SELECT jsonb_to_int_array(p_jsonb->'id_array') INTO v_{{primary_key}}s;

  SELECT to_json(array_agg(row_to_json(r)))::jsonb
  INTO v_out
  FROM (
    SELECT
      {{column_list}}
    FROM {{resource}}
    WHERE {{primary_key}} = ANY(v_{{primary_key}}s)
    ORDER BY {{primary_key}} ASC
  ) AS r;

  RETURN v_out;

END;

$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
