BEGIN;

DO $$
DECLARE
  v_client uuid;
  v_org uuid;
  v_portfolio uuid;
  v_lawyer uuid;
  v_user uuid;
  v_email text;
  v_cause uuid;
  v_link uuid;
  item record;
BEGIN
  SELECT c.id,c.organization_id INTO STRICT v_client,v_org
  FROM legal.legal_clients c WHERE c.code='inversiones_asesorias_now';
  SELECT p.id INTO STRICT v_portfolio FROM legal.legal_portfolios p
  WHERE p.client_id=v_client AND p.status='active' ORDER BY p.display_order,p.created_at LIMIT 1;
  SELECT l.id,l.email INTO STRICT v_lawyer,v_email FROM legal.client_lawyers l
  WHERE l.client_id=v_client AND lower(l.name)='fhevia';
  SELECT u.id INTO STRICT v_user FROM platform.users u WHERE lower(u.email)='fhevia@asesoriasnow.cl';

  -- Remove every NOW association requested by the client. Global causes and movements remain intact.
  FOR item IN
    SELECT pc.id,pc.case_id,pc.portfolio_id,c.rol,c.year,c.court
    FROM legal.legal_portfolio_cases pc
    JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
    JOIN legal.causes c ON c.id=pc.case_id
    WHERE p.client_id=v_client
      AND (regexp_replace(upper(trim(c.rol)),'^C-','','i'),c.year) IN
        (('164',2026),('30990',2017),('5589',2022),('878',2016),('9457',2026),
         ('9692',2026),('12420',2014),('22364',2016),('2604',2022))
    FOR UPDATE OF pc
  LOOP
    INSERT INTO legal.admin_edit_audit(client_id,user_id,resource_id,action,before_data,after_data)
    VALUES(v_client,v_user,item.id,'case.unassign',to_jsonb(item),NULL);
    DELETE FROM legal.legal_portfolio_cases WHERE id=item.id;
  END LOOP;

  -- The existing 2036/2019 cause remains in its current portfolios, fully assigned to Fhevia.
  SELECT c.id INTO STRICT v_cause FROM legal.causes c
  WHERE c.organization_id=v_org AND regexp_replace(upper(trim(c.rol)),'^C-','','i')='2036' AND c.year=2019
  ORDER BY c.created_at LIMIT 1;
  UPDATE legal.legal_portfolio_cases pc
  SET lawyer_id=v_lawyer,responsible_name='Fhevia',
      settings=COALESCE(pc.settings,'{}'::jsonb)||jsonb_build_object('admin_lawyer_edited',true,'assigned_lawyer_email',v_email),
      updated_at=now()
  FROM legal.legal_portfolios p WHERE pc.portfolio_id=p.id AND p.client_id=v_client AND pc.case_id=v_cause;
  INSERT INTO legal.legal_portfolio_case_recipients(id,portfolio_case_id,email,name,recipient_type,is_active,created_at,updated_at)
  SELECT gen_random_uuid(),pc.id,lower(v_email),'Fhevia','to',true,now(),now()
  FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
  WHERE p.client_id=v_client AND pc.case_id=v_cause AND nullif(trim(v_email),'') IS NOT NULL
  ON CONFLICT(portfolio_case_id,email,recipient_type) DO UPDATE SET name='Fhevia',is_active=true,updated_at=now();

  -- New causes use only the number, year and courts supplied by the client and start unpublished.
  FOR item IN SELECT * FROM (VALUES
    ('9989',2026,'14º Juzgado Civil de Santiago','C.A. de Santiago'),
    ('268',2022,'Juzgado Civil de Pichilemu','C.A. de Rancagua')
  ) AS requested(rol,year,court,corte)
  LOOP
    SELECT c.id INTO v_cause FROM legal.causes c
    WHERE c.organization_id=v_org AND regexp_replace(upper(trim(c.rol)),'^C-','','i')=item.rol
      AND c.year=item.year AND lower(trim(c.court))=lower(trim(item.court))
    ORDER BY c.created_at LIMIT 1;
    IF v_cause IS NULL THEN
      INSERT INTO legal.causes(id,organization_id,court,rol,year,status,created_at,updated_at,public_visibility_status,publicada)
      VALUES(gen_random_uuid(),v_org,item.court,item.rol,item.year,'active',now(),now(),'hidden',false)
      RETURNING id INTO v_cause;
    END IF;
    INSERT INTO legal.legal_portfolio_cases
      (portfolio_id,case_id,corte,responsible_name,include_in_batch_email,status,settings,lawyer_id,created_at,updated_at)
    VALUES(v_portfolio,v_cause,item.corte,'Fhevia',true,'active',
      jsonb_build_object('admin_assigned',true,'assigned_lawyer_email',v_email),v_lawyer,now(),now())
    ON CONFLICT(portfolio_id,case_id) DO UPDATE SET lawyer_id=v_lawyer,responsible_name='Fhevia',
      corte=EXCLUDED.corte,settings=COALESCE(legal_portfolio_cases.settings,'{}'::jsonb)||EXCLUDED.settings,updated_at=now()
    RETURNING id INTO v_link;
    INSERT INTO legal.client_cause_settings(client_id,cause_id,version) VALUES(v_client,v_cause,0) ON CONFLICT DO NOTHING;
    INSERT INTO legal.legal_portfolio_case_recipients(id,portfolio_case_id,email,name,recipient_type,is_active,created_at,updated_at)
    VALUES(gen_random_uuid(),v_link,lower(v_email),'Fhevia','to',true,now(),now())
    ON CONFLICT(portfolio_case_id,email,recipient_type) DO UPDATE SET name='Fhevia',is_active=true,updated_at=now();
    INSERT INTO legal.admin_edit_audit(client_id,user_id,resource_id,action,before_data,after_data)
    VALUES(v_client,v_user,v_link,'case.assign',NULL,jsonb_build_object(
      'case_id',v_cause,'code',item.rol,'year',item.year,'court',item.court,'corte',item.corte,
      'portfolio_id',v_portfolio,'lawyer_id',v_lawyer,'publicada',false));
    v_cause := NULL;
  END LOOP;
END $$;

COMMIT;
