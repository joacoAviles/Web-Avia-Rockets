INSERT INTO products (code, name, description) VALUES
('RISK', 'AVIA RISK', 'Evaluación de riesgo y recomendación'),
('FLEET', 'AVIA FLEET', 'Control documental y vencimientos de activos'),
('SYSTEMS', 'AVIA SYSTEMS', 'Automatización de procesos e integraciones')
ON CONFLICT (code) DO NOTHING;
