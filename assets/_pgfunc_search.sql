CREATE OR REPLACE FUNCTION {{namespace}}_{{resource}}_search(p_jsonb jsonb)
  RETURNS jsonb AS
$BODY$

DECLARE
  v_{{primary_key}}s_in {{pkey_type}}[];
  v_{{primary_key}}s_out {{pkey_type}}[];
  v_{{primary_key}} {{pkey_type}};
  {{column_list}};
  v_out jsonb;

BEGIN

  SELECT
    jsonb_to_int_array((p_jsonb->'{{primary_key}}s')::jsonb)::{{pkey_type}}[],
    (p_jsonb->>'{{primary_key}}')::{{pkey_type}},
    {{column_list_b}}
  INTO
    v_{{primary_key}}s_in,
    v_{{primary_key}},
    {{column_list_c}};

  IF v_{{primary_key}} IS NOT null THEN
    RETURN {{namespace}}_{{resource}}_read(
      json_build_object(
        'id_array', ARRAY[v_{{primary_key}}]::{{pkey_type}}[]
      )::jsonb
    );
  END IF;

  IF array_length(v_{{primary_key}}s_in, 1) < 1 THEN
    RETURN {{namespace}}_{{resource}}_read(
      json_build_object('id_array', v_{{primary_key}}s_in)::jsonb);
  END IF;

  SELECT array_agg({{primary_key}})
  INTO v_{{primary_key}}s_out
  FROM {{resource}}
  WHERE
    {{column_list_d}};

  IF v_{{primary_key}}s_out IS NOT null THEN
    RETURN {{namespace}}_{{resource}}_read(
      json_build_object('id_array', v_{{primary_key}}s_out)::jsonb
    );
  ELSE RETURN '[]'::jsonb;
  END IF;

END;

$BODY$
LANGUAGE plpgsql VOLATILE
COST 100;
