# AI-GO Global Database Design

## 🗄️ Database Architecture Overview

### Multi-Region Strategy
```
┌─────────────────────────────────────────────────────────┐
│                  US-EAST (Primary)                       │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │  PostgreSQL  │    │  TimescaleDB │                  │
│  │   (Main DB)  │    │ (Time-series)│                  │
│  └──────────────┘    └──────────────┘                  │
│          │                    │                          │
│          └────────┬───────────┘                         │
│                   │                                      │
│            ┌──────▼──────┐                              │
│            │    Redis    │                              │
│            │   Cluster   │                              │
│            └─────────────┘                              │
└─────────────────────────────────────────────────────────┘
                    │
      ┌─────────────┼─────────────┬──────────────┐
      │             │             │              │
      ▼             ▼             ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ EU-WEST  │  │ASIA-EAST │  │ ASIA-SE  │  │ US-WEST  │
│  Read    │  │  Read    │  │  Read    │  │  Read    │
│ Replica  │  │ Replica  │  │ Replica  │  │ Replica  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## 📊 PostgreSQL Schema Design

### Core Tables

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For geographical data
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    status_page_url VARCHAR(500),
    documentation_url VARCHAR(500),
    regions JSONB DEFAULT '[]'::jsonb,  -- ['us-east', 'eu-west', ...]
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_providers_slug ON providers(slug);
CREATE INDEX idx_providers_regions ON providers USING gin(regions);

-- Models table with localization support
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name JSONB NOT NULL,  -- {"en-US": "GPT-4", "zh-CN": "GPT-4", ...}
    description JSONB,    -- Localized descriptions
    foundation_model VARCHAR(100),
    released_at DATE,
    deprecated_at DATE,
    sunset_at DATE,
    modalities TEXT[] DEFAULT '{}',  -- ['text', 'image', 'audio', 'video']
    capabilities TEXT[] DEFAULT '{}', -- ['function_calling', 'streaming', ...]
    context_window INTEGER,
    max_output_tokens INTEGER,
    training_cutoff DATE,
    api_version VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_models_provider ON models(provider_id);
CREATE INDEX idx_models_slug ON models(slug);
CREATE INDEX idx_models_foundation ON models(foundation_model);
CREATE INDEX idx_models_active ON models(is_active);
CREATE INDEX idx_models_modalities ON models USING gin(modalities);
CREATE INDEX idx_models_capabilities ON models USING gin(capabilities);

-- Model endpoints by region
CREATE TABLE model_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    region VARCHAR(20) NOT NULL,
    endpoint_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,  -- For failover ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, region)
);

CREATE INDEX idx_endpoints_model_region ON model_endpoints(model_id, region);

-- Pricing table with regional variations
CREATE TABLE pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL,  -- 'standard', 'enterprise', 'academic'
    region VARCHAR(20),         -- NULL for global pricing
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    input_per_million DECIMAL(10, 4),
    output_per_million DECIMAL(10, 4),
    image_per_unit DECIMAL(10, 4),
    audio_per_minute DECIMAL(10, 4),
    video_per_minute DECIMAL(10, 4),
    fine_tuning_per_million DECIMAL(10, 4),
    volume_discounts JSONB DEFAULT '[]'::jsonb,
    effective_from DATE NOT NULL,
    effective_to DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_model ON pricing(model_id);
CREATE INDEX idx_pricing_region ON pricing(region);
CREATE INDEX idx_pricing_effective ON pricing(effective_from, effective_to);

-- Benchmarks definition
CREATE TABLE benchmark_suites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description JSONB,  -- Localized
    category VARCHAR(50),  -- 'reasoning', 'code', 'language', 'multimodal'
    version VARCHAR(20),
    evaluation_type VARCHAR(50),  -- 'accuracy', 'performance', 'safety'
    max_score DECIMAL(10, 4),
    scoring_method VARCHAR(50),  -- 'percentage', 'raw_score', 'percentile'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_benchmarks_slug ON benchmark_suites(slug);
CREATE INDEX idx_benchmarks_category ON benchmark_suites(category);

-- Benchmark scores
CREATE TABLE benchmark_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    suite_id UUID NOT NULL REFERENCES benchmark_suites(id) ON DELETE CASCADE,
    score_raw DECIMAL(10, 4) NOT NULL,
    score_normalized DECIMAL(5, 2),  -- 0-100 scale
    percentile INTEGER,              -- Model's percentile ranking
    evaluation_date DATE NOT NULL,
    evaluation_commit VARCHAR(100),  -- Git commit of evaluation code
    configuration JSONB DEFAULT '{}'::jsonb,  -- Test parameters
    notes TEXT,
    is_official BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, suite_id, evaluation_date)
);

CREATE INDEX idx_scores_model ON benchmark_scores(model_id);
CREATE INDEX idx_scores_suite ON benchmark_scores(suite_id);
CREATE INDEX idx_scores_date ON benchmark_scores(evaluation_date DESC);

-- Documentation references
CREATE TABLE documentation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL,  -- 'api', 'quickstart', 'cookbook', 'changelog'
    title JSONB NOT NULL,           -- Localized
    url VARCHAR(500) NOT NULL,
    locale VARCHAR(10),
    version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_docs_model ON documentation(model_id);
CREATE INDEX idx_docs_type ON documentation(doc_type);
CREATE INDEX idx_docs_locale ON documentation(locale);

-- News articles
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title JSONB NOT NULL,          -- Localized
    summary JSONB,                 -- Localized
    content JSONB,                 -- Localized markdown
    author_id UUID,
    category VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    source_url VARCHAR(500),
    image_url VARCHAR(500),
    published_at TIMESTAMP WITH TIME ZONE,
    locale_primary VARCHAR(10) DEFAULT 'en-US',
    available_locales TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_tags ON news_articles USING gin(tags);
CREATE INDEX idx_news_locale ON news_articles(locale_primary);

-- Model-News relationship
CREATE TABLE news_model_mentions (
    news_id UUID REFERENCES news_articles(id) ON DELETE CASCADE,
    model_id UUID REFERENCES models(id) ON DELETE CASCADE,
    mention_type VARCHAR(50),  -- 'primary', 'comparison', 'brief'
    PRIMARY KEY (news_id, model_id)
);

-- User preferences (for personalization)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_identifier VARCHAR(100) UNIQUE NOT NULL,  -- Anonymous ID
    preferred_locale VARCHAR(10) DEFAULT 'en-US',
    preferred_region VARCHAR(20),
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    favorite_models UUID[] DEFAULT '{}',
    display_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_prefs_identifier ON user_preferences(user_identifier);
```

## ⏱️ TimescaleDB Schema (Time-Series Data)

```sql
-- Create TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Status probes table
CREATE TABLE status_probes (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    model_id UUID NOT NULL,
    region VARCHAR(20) NOT NULL,
    probe_location VARCHAR(50),     -- Specific probe location
    availability DECIMAL(5, 2),     -- Percentage
    latency_p50 INTEGER,            -- Milliseconds
    latency_p95 INTEGER,
    latency_p99 INTEGER,
    error_rate DECIMAL(5, 2),       -- Percentage
    error_types JSONB DEFAULT '{}'::jsonb,
    requests_per_minute INTEGER,
    tokens_per_minute BIGINT,
    status_code_distribution JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Convert to hypertable
SELECT create_hypertable('status_probes', 'time', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes
CREATE INDEX idx_probes_model_time ON status_probes(model_id, time DESC);
CREATE INDEX idx_probes_region_time ON status_probes(region, time DESC);

-- Compression policy (compress chunks older than 3 days)
ALTER TABLE status_probes SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'model_id,region'
);

SELECT add_compression_policy('status_probes', INTERVAL '3 days');

-- Retention policy (keep raw data for 90 days)
SELECT add_retention_policy('status_probes', INTERVAL '90 days');

-- Continuous aggregates for 5-minute averages
CREATE MATERIALIZED VIEW status_5min
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('5 minutes', time) AS bucket,
    model_id,
    region,
    AVG(availability) AS avg_availability,
    AVG(latency_p50) AS avg_latency_p50,
    AVG(latency_p95) AS avg_latency_p95,
    AVG(latency_p99) AS avg_latency_p99,
    AVG(error_rate) AS avg_error_rate,
    SUM(requests_per_minute) AS total_requests,
    SUM(tokens_per_minute) AS total_tokens,
    COUNT(*) AS probe_count
FROM status_probes
GROUP BY bucket, model_id, region;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('status_5min',
    start_offset => INTERVAL '10 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '5 minutes'
);

-- Hourly aggregates
CREATE MATERIALIZED VIEW status_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    model_id,
    region,
    AVG(availability) AS avg_availability,
    MIN(availability) AS min_availability,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_p95) AS median_latency_p95,
    MAX(latency_p95) AS max_latency_p95,
    AVG(error_rate) AS avg_error_rate,
    SUM(requests_per_minute) AS total_requests,
    SUM(tokens_per_minute) AS total_tokens
FROM status_probes
GROUP BY bucket, model_id, region;

-- Incident tracking
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID,
    provider_id UUID,
    regions TEXT[] DEFAULT '{}',
    severity VARCHAR(20) NOT NULL,  -- 'minor', 'major', 'critical'
    status VARCHAR(20) NOT NULL,    -- 'investigating', 'identified', 'monitoring', 'resolved'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    impact_description TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    identified_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    postmortem_url VARCHAR(500),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_model ON incidents(model_id);
CREATE INDEX idx_incidents_provider ON incidents(provider_id);
CREATE INDEX idx_incidents_time ON incidents(started_at DESC);
CREATE INDEX idx_incidents_status ON incidents(status) WHERE status != 'resolved';
```

## 🗃️ Redis Data Structures

```redis
# Real-time status cache (TTL: 30 seconds)
HSET status:gpt-4:us-east 
    availability 99.92 
    latency_p95 980 
    error_rate 0.08 
    rpm 3400 
    last_updated "2024-01-15T10:30:00Z"
EXPIRE status:gpt-4:us-east 30

# Sorted sets for rankings
ZADD models:by:availability 99.92 "gpt-4"
ZADD models:by:latency 980 "gpt-4"
ZADD models:by:usage 3400 "gpt-4"

# Rate limiting (sliding window)
INCR api:rate:user:12345:1642520000
EXPIRE api:rate:user:12345:1642520000 3600

# Session storage
HSET session:abc123 
    user_id "12345" 
    locale "zh-CN" 
    region "asia-east" 
    currency "CNY"
EXPIRE session:abc123 86400

# Feature flags by region
HSET features:us-east 
    news_section "true" 
    ai_chat "true" 
    dark_mode "true"

# Cache invalidation patterns
PUBLISH cache:invalidate:models "gpt-4"
PUBLISH cache:invalidate:benchmarks "MMLU"

# Geolocation cache
GEOADD probes:locations 
    -77.0369 38.9072 "us-east-1"
    -122.4194 37.7749 "us-west-1"
    8.6821 50.1109 "eu-west-1"

# Trending models (time-decaying)
ZINCRBY trending:models:2024-01-15 1 "gpt-4"
EXPIRE trending:models:2024-01-15 604800  # 7 days

# Real-time WebSocket subscriptions
SADD ws:subscriptions:gpt-4 "connection:12345"
SADD ws:subscriptions:claude-3 "connection:12345"
```

## 🔄 Data Replication Strategy

### PostgreSQL Logical Replication
```sql
-- On primary (US-EAST)
CREATE PUBLICATION ai_go_global FOR ALL TABLES;

-- On replicas
CREATE SUBSCRIPTION eu_west_replica
CONNECTION 'host=primary.ai-go.com port=5432 dbname=aigo user=replicator'
PUBLICATION ai_go_global
WITH (copy_data = false, synchronous_commit = 'remote_apply');

-- Monitor replication lag
SELECT 
    slot_name,
    active,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag_size
FROM pg_replication_slots;
```

### Redis Replication
```yaml
# Redis Cluster configuration
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000

# Replication settings
repl-diskless-sync yes
repl-diskless-sync-delay 5
repl-ping-replica-period 10
repl-timeout 60
```

## 🗂️ Partitioning Strategy

### Time-based Partitioning for Logs
```sql
-- Audit logs with monthly partitions
CREATE TABLE audit_logs (
    id BIGSERIAL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID,
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_status INTEGER,
    duration_ms INTEGER
) PARTITION BY RANGE (timestamp);

-- Create partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automated partition creation
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    start_date := date_trunc('month', CURRENT_DATE + interval '1 month');
    end_date := start_date + interval '1 month';
    partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly
SELECT cron.schedule('create-partitions', '0 0 28 * *', 'SELECT create_monthly_partition()');
```

## 🔍 Search & Indexing

### Full-Text Search Configuration
```sql
-- Create search configuration for multiple languages
CREATE TEXT SEARCH CONFIGURATION english_zh (COPY = english);
CREATE TEXT SEARCH CONFIGURATION japanese (COPY = simple);

-- Search indexes on models
ALTER TABLE models ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name->>'en-US', '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description->>'en-US', '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.name->>'zh-CN', '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description->>'zh-CN', '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector_trigger
BEFORE INSERT OR UPDATE ON models
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE INDEX idx_models_search ON models USING gin(search_vector);

-- Search function
CREATE OR REPLACE FUNCTION search_models(
    query_text TEXT,
    locale VARCHAR DEFAULT 'en-US',
    limit_count INTEGER DEFAULT 20
) RETURNS TABLE (
    id UUID,
    name JSONB,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        ts_rank(m.search_vector, plainto_tsquery('english', query_text)) AS rank
    FROM models m
    WHERE m.search_vector @@ plainto_tsquery('english', query_text)
        AND m.is_active = true
    ORDER BY rank DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Analytics Tables

```sql
-- Page views tracking
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    event_type VARCHAR(50),       -- 'page_view', 'model_view', 'benchmark_compare'
    event_properties JSONB,
    user_properties JSONB,
    device_properties JSONB,
    geo_properties JSONB,
    referrer_properties JSONB
) PARTITION BY RANGE (timestamp);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('analytics_events', 'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Pre-aggregated daily stats
CREATE MATERIALIZED VIEW daily_stats AS
SELECT 
    date_trunc('day', timestamp) AS day,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT session_id) AS unique_sessions,
    jsonb_object_agg(
        COALESCE(event_properties->>'model_id', 'unknown'),
        COUNT(*)
    ) FILTER (WHERE event_type = 'model_view') AS model_views
FROM analytics_events
GROUP BY day, event_type;

CREATE INDEX idx_daily_stats ON daily_stats(day, event_type);
```

## 🚀 Performance Optimization

### Query Optimization Views
```sql
-- Materialized view for model listings
CREATE MATERIALIZED VIEW model_listings AS
SELECT 
    m.id,
    m.slug,
    m.name,
    m.provider_id,
    p.name AS provider_name,
    p.logo_url AS provider_logo,
    m.foundation_model,
    m.modalities,
    m.capabilities,
    m.context_window,
    m.is_active,
    COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
            'suite', bs.slug,
            'score', b.score_normalized,
            'date', b.evaluation_date
        ))
        FROM benchmark_scores b
        JOIN benchmark_suites bs ON b.suite_id = bs.id
        WHERE b.model_id = m.id
            AND b.evaluation_date >= CURRENT_DATE - INTERVAL '30 days'
        ),
        '[]'::jsonb
    ) AS recent_benchmarks
FROM models m
JOIN providers p ON m.provider_id = p.id
WHERE m.is_active = true;

CREATE UNIQUE INDEX idx_model_listings_id ON model_listings(id);
CREATE INDEX idx_model_listings_provider ON model_listings(provider_id);

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY model_listings;
```

### Connection Pooling Configuration
```yaml
# PgBouncer configuration
[databases]
aigo = host=localhost port=5432 dbname=aigo

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 200
```

## 🔐 Security & Compliance

### Row-Level Security
```sql
-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for user preferences
CREATE POLICY user_prefs_policy ON user_preferences
    FOR ALL
    USING (user_identifier = current_setting('app.current_user')::text);

-- Audit trail
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100),
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Generic audit trigger
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_trail(action, table_name, record_id, old_values)
        VALUES (TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_trail(action, table_name, record_id, old_values, new_values)
        VALUES (TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_trail(action, table_name, record_id, new_values)
        VALUES (TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### Data Encryption
```sql
-- Encrypt sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash VARCHAR(60) NOT NULL,  -- bcrypt hash
    user_identifier VARCHAR(100),
    name VARCHAR(100),
    scopes TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Function to verify API key
CREATE OR REPLACE FUNCTION verify_api_key(
    provided_key TEXT
) RETURNS TABLE (
    id UUID,
    user_identifier VARCHAR,
    scopes TEXT[],
    rate_limit INTEGER
) AS $$
DECLARE
    key_record RECORD;
BEGIN
    SELECT * INTO key_record
    FROM api_keys
    WHERE key_hash = crypt(provided_key, key_hash)
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
    
    IF FOUND THEN
        -- Update last used
        UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = key_record.id;
        
        RETURN QUERY SELECT 
            key_record.id,
            key_record.user_identifier,
            key_record.scopes,
            key_record.rate_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## 📈 Monitoring & Maintenance

### Database Health Checks
```sql
-- Connection monitoring
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
    datname,
    count(*) AS connections,
    count(*) FILTER (WHERE state = 'active') AS active,
    count(*) FILTER (WHERE state = 'idle') AS idle,
    count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction,
    max(EXTRACT(epoch FROM (now() - query_start))) AS longest_query_seconds
FROM pg_stat_activity
GROUP BY datname;

-- Table bloat monitoring
CREATE OR REPLACE VIEW table_bloat AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size,
    ROUND(100 * pg_total_relation_size(schemaname||'.'||tablename) / NULLIF(SUM(pg_total_relation_size(schemaname||'.'||tablename)) OVER (), 0), 2) AS percent_of_total
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow query log
CREATE TABLE slow_query_log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    query TEXT,
    query_plan JSONB,
    user_name VARCHAR(100),
    database_name VARCHAR(100),
    application_name VARCHAR(100)
);

-- Automated VACUUM schedule
ALTER TABLE models SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE status_probes SET (autovacuum_vacuum_scale_factor = 0.01);
```

## 🔄 Migration Strategy

### Zero-Downtime Migration Process
```sql
-- 1. Create new version of table
CREATE TABLE models_v2 (LIKE models INCLUDING ALL);

-- 2. Add trigger to sync changes
CREATE OR REPLACE FUNCTION sync_models() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO models_v2 VALUES (NEW.*);
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE models_v2 SET (column1, column2, ...) = (NEW.column1, NEW.column2, ...)
        WHERE id = NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM models_v2 WHERE id = OLD.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_models_trigger
AFTER INSERT OR UPDATE OR DELETE ON models
FOR EACH ROW EXECUTE FUNCTION sync_models();

-- 3. Batch copy existing data
INSERT INTO models_v2 SELECT * FROM models
ON CONFLICT (id) DO NOTHING;

-- 4. Swap tables
BEGIN;
ALTER TABLE models RENAME TO models_old;
ALTER TABLE models_v2 RENAME TO models;
COMMIT;

-- 5. Clean up
DROP TRIGGER sync_models_trigger ON models_old;
DROP FUNCTION sync_models();
DROP TABLE models_old;
```