-- Additive migration; no changes to existing users or access permissions.
BEGIN;

CREATE TABLE IF NOT EXISTS identity_flows (
	key VARCHAR(64) NOT NULL,
	browser VARCHAR(64) NOT NULL,
	expires BIGINT NOT NULL,
	data VARCHAR NOT NULL,
	PRIMARY KEY (key)
)

;

CREATE TABLE IF NOT EXISTS identity_google_links (
	subject VARCHAR(255) NOT NULL,
	user_id VARCHAR(36) NOT NULL,
	PRIMARY KEY (subject),
	UNIQUE (user_id)
)

;

CREATE TABLE IF NOT EXISTS identity_profiles (
	user_id VARCHAR(36) NOT NULL,
	code VARCHAR(12) NOT NULL,
	referred_by VARCHAR(36),
	completed BOOLEAN NOT NULL,
	full_name VARCHAR(200),
	terms_version VARCHAR(40),
	completed_at BIGINT,
	PRIMARY KEY (user_id),
	UNIQUE (code)
)

;

CREATE TABLE IF NOT EXISTS identity_tickets (
	key VARCHAR(64) NOT NULL,
	browser VARCHAR(64) NOT NULL,
	expires BIGINT NOT NULL,
	data VARCHAR NOT NULL,
	PRIMARY KEY (key)
)

;
CREATE INDEX IF NOT EXISTS identity_flows_expiry ON identity_flows(expires);
CREATE INDEX IF NOT EXISTS identity_tickets_expiry ON identity_tickets(expires);
COMMIT;
