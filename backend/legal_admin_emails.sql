-- Import only unambiguous addresses already used by this lawyer's assignments.
-- Never infer an address from a name or overwrite an existing catalog address.
WITH sources AS (
 SELECT l.id,min(lower(trim(pc.settings->>'assigned_lawyer_email'))) AS email
 FROM legal.client_lawyers l
 JOIN legal.legal_portfolio_cases pc ON pc.lawyer_id=l.id
 JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id AND p.client_id=l.client_id
 WHERE nullif(trim(pc.settings->>'assigned_lawyer_email'),'') IS NOT NULL
   AND EXISTS(SELECT 1 FROM legal.client_administrators a WHERE a.client_id=l.client_id)
 GROUP BY l.id HAVING count(DISTINCT lower(trim(pc.settings->>'assigned_lawyer_email')))=1
)
UPDATE legal.client_lawyers l SET email=s.email,version=version+1
FROM sources s WHERE l.id=s.id AND l.email IS NULL;
