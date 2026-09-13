BEGIN;

DO $$
DECLARE expected_users integer;
BEGIN
  SELECT count(*) INTO expected_users FROM platform.users
  WHERE lower(email) IN ('fhevia@asesoriasnow.cl','procurador@asesoriasnow.cl','rluna@asesoriasnow.cl');
  IF expected_users <> 3 THEN
    RAISE EXCEPTION 'Expected the three existing NOW accounts; found %', expected_users;
  END IF;
END $$;

UPDATE platform.users
SET role='admin',is_active=true,
    product_access='{"legal-summary":true,"causes":true,"pjud-upload":true}'::jsonb,
    full_name=CASE lower(email)
      WHEN 'fhevia@asesoriasnow.cl' THEN 'Fhevia'
      WHEN 'procurador@asesoriasnow.cl' THEN 'Procurador'
      WHEN 'rluna@asesoriasnow.cl' THEN 'Luna'
      ELSE full_name END,
    updated_at=now()
WHERE lower(email) IN ('fhevia@asesoriasnow.cl','procurador@asesoriasnow.cl','rluna@asesoriasnow.cl');

INSERT INTO legal.client_administrators(client_id,user_id)
SELECT c.id,u.id FROM legal.legal_clients c CROSS JOIN platform.users u
WHERE c.code='inversiones_asesorias_now'
  AND lower(u.email) IN ('fhevia@asesoriasnow.cl','procurador@asesoriasnow.cl','rluna@asesoriasnow.cl')
ON CONFLICT DO NOTHING;

CREATE TEMP TABLE _now_lawyer_merge ON COMMIT DROP AS
SELECT pc.id AS portfolio_case_id,pc.lawyer_id AS old_lawyer_id,l.email AS old_email,
       l.name AS old_name,p.client_id
FROM legal.legal_portfolio_cases pc
JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
JOIN legal.legal_clients c ON c.id=p.client_id
JOIN legal.client_lawyers l ON l.id=pc.lawyer_id
WHERE c.code='inversiones_asesorias_now' AND lower(l.name)<>'fhevia' AND lower(l.name)<>'luna';

INSERT INTO legal.admin_edit_audit(client_id,user_id,resource_id,action,before_data,after_data)
SELECT m.client_id,u.id,m.portfolio_case_id,'case.lawyer_consolidate',
       jsonb_build_object('lawyer_id',m.old_lawyer_id,'lawyer_name',m.old_name,'lawyer_email',m.old_email),
       jsonb_build_object('lawyer_id',target.id,'lawyer_name','Luna','lawyer_email',target.email)
FROM _now_lawyer_merge m
JOIN legal.client_lawyers target ON target.client_id=m.client_id AND lower(target.name)='luna'
JOIN platform.users u ON lower(u.email)='fhevia@asesoriasnow.cl';

INSERT INTO legal.legal_portfolio_case_recipients
  (id,portfolio_case_id,email,name,recipient_type,is_active,created_at,updated_at)
SELECT gen_random_uuid(),m.portfolio_case_id,target.email,'Luna',r.recipient_type,true,now(),now()
FROM _now_lawyer_merge m
JOIN legal.client_lawyers target ON target.client_id=m.client_id AND lower(target.name)='luna'
JOIN legal.legal_portfolio_case_recipients r ON r.portfolio_case_id=m.portfolio_case_id
  AND r.is_active AND lower(trim(r.email))=lower(trim(m.old_email)) AND r.recipient_type='to'
ON CONFLICT(portfolio_case_id,email,recipient_type)
DO UPDATE SET name='Luna',is_active=true,updated_at=now();

UPDATE legal.legal_portfolio_case_recipients r SET is_active=false,updated_at=now()
FROM _now_lawyer_merge m
WHERE r.portfolio_case_id=m.portfolio_case_id AND r.is_active
  AND lower(trim(r.email))=lower(trim(m.old_email))
  AND lower(trim(r.email))<>'rluna@asesoriasnow.cl' AND r.recipient_type='to';

UPDATE legal.legal_portfolio_cases pc
SET lawyer_id=target.id,responsible_name='Luna',
    settings=COALESCE(pc.settings,'{}'::jsonb)||jsonb_build_object(
      'admin_lawyer_edited',true,'assigned_lawyer_email',target.email),
    updated_at=now()
FROM _now_lawyer_merge m
JOIN legal.client_lawyers target ON target.client_id=m.client_id AND lower(target.name)='luna'
WHERE pc.id=m.portfolio_case_id;

UPDATE legal.client_lawyers l SET name='Luna',email='rluna@asesoriasnow.cl',version=version+1
FROM legal.legal_clients c
WHERE l.client_id=c.id AND c.code='inversiones_asesorias_now' AND lower(l.name)='luna';

DELETE FROM legal.client_lawyers l USING legal.legal_clients c
WHERE l.client_id=c.id AND c.code='inversiones_asesorias_now'
  AND lower(l.name) NOT IN ('fhevia','luna');

COMMIT;
