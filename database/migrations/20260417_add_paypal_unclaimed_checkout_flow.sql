DO $$
DECLARE
    existing_constraint_name text;
BEGIN
    SELECT con.conname
    INTO existing_constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = con.connamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'products'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%checkout_flow%';

    IF existing_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', existing_constraint_name);
    END IF;

    ALTER TABLE public.products
    ADD CONSTRAINT products_checkout_flow_check
    CHECK (
        checkout_flow IN (
            'buymeacoffee',
            'kofi',
            'external',
            'stripe',
            'paypal-invoice',
            'paypal-unclaimed'
        )
    );
END $$;
