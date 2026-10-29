-- Supabase can grant API roles access through default privileges on public tables.
-- This application authenticates through Nitro, never through the database REST API.
DO $$
DECLARE
  table_name text;
  api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','sessions','auth_limits','products','inventory','orders','order_items',
    'order_history','sales','sale_items','payments','stock_movements','audit_logs',
    'idempotency_keys','sale_balances','schema_migrations'
  ] LOOP
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC',table_name);
    FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=api_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I',table_name,api_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
