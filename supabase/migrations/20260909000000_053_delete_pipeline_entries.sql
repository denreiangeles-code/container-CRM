-- 053_delete_pipeline_entries.sql
--
-- Hard delete for pipeline records. Every downstream foreign key in this schema is
-- ON DELETE RESTRICT, so the database already refuses to orphan a record -- the
-- controllers pre-check those links so the user gets a sentence instead of a
-- Postgres constraint name.
--
-- Contracts are the exception that needs a function. Deleting one cascades its
-- rows in contract_inventory_allocations, but inventory.quantity_reserved is a
-- counter maintained by update_contract_lifecycle, not a foreign key -- so a plain
-- DELETE would strand the reservation and leave that stock permanently unsellable.

CREATE OR REPLACE FUNCTION public.delete_contract(p_contract_id UUID, p_actor_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_contract public.contracts%ROWTYPE; v_allocation RECORD;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found' USING ERRCODE = 'P0002';
  END IF;

  -- Stock that has physically left the yard cannot be un-shipped by deleting the
  -- paperwork. Cancel the contract first if it needs to be voided after pickup.
  IF v_contract.pickup_status = 'Picked Up' OR v_contract.status = 'Completed' THEN
    RAISE EXCEPTION 'A fulfilled contract cannot be deleted' USING ERRCODE = 'P0001';
  END IF;

  -- Give the reserved units back before the allocation rows cascade away.
  FOR v_allocation IN
    SELECT * FROM public.contract_inventory_allocations
    WHERE contract_id = p_contract_id AND fulfilled_at IS NULL AND released_at IS NULL
    FOR UPDATE
  LOOP
    UPDATE public.inventory
    SET quantity_reserved = GREATEST(quantity_reserved - v_allocation.quantity, 0),
        updated_by = p_actor_id
    WHERE id = v_allocation.inventory_id;
  END LOOP;

  DELETE FROM public.contracts WHERE id = p_contract_id;

  INSERT INTO public.domain_events(entity_type, entity_id, event_type, actor_id, payload)
  VALUES ('contract', p_contract_id, 'contract_deleted', p_actor_id,
    jsonb_build_object('contract_number', v_contract.contract_number, 'sale_id', v_contract.sale_id));
END;
$$;

REVOKE ALL ON FUNCTION public.delete_contract(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_contract(UUID, UUID) TO service_role;

NOTIFY pgrst, 'reload schema';
