-- 054_auto_logged_emails.sql
--
-- Count emails the CRM actually sent, instead of trusting a number someone typed.
--
-- Outreach figures have always come from the Daily Tasks form, so the dashboard
-- reported intent rather than activity -- 1500 emails could sit against 7
-- contacts. Mail sent through Contact Outreach is observable, so it is counted
-- here; mail sent straight from Gmail is not, so the hand-entered figure stays,
-- narrowed to mean "sent outside the CRM".
--
-- Rather than teach every reader to add two columns, emails_completed keeps its
-- name and becomes the generated total. get_dashboard_charts (034) and the
-- monthly report (035) go on reading it and quietly get the right answer.
--
--   emails_manual     what the PIC typed, for mail we cannot see
--   emails_auto       what the CRM sent, written only by log_auto_email()
--   emails_completed  generated total, what every report reads

ALTER TABLE public.daily_activity RENAME COLUMN emails_completed TO emails_manual;

ALTER TABLE public.daily_activity
    ADD COLUMN IF NOT EXISTS emails_auto INTEGER NOT NULL DEFAULT 0
        CHECK (emails_auto >= 0);

ALTER TABLE public.daily_activity
    ADD COLUMN emails_completed INTEGER
        GENERATED ALWAYS AS (emails_manual + emails_auto) STORED;

-- ───────────────────────────────────────────────────────────────────────────────
-- The Daily Tasks form now writes emails_manual; emails_completed is generated
-- and cannot be assigned. Everything else about this function is unchanged, and
-- the p_emails_completed parameter keeps its name so callers do not break.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_daily_activity(
    p_pic_id           UUID,
    p_entry_date       DATE,
    p_emails_completed INTEGER DEFAULT 0,
    p_email_replies    INTEGER DEFAULT 0,
    p_emails_bounced   INTEGER DEFAULT 0,
    p_calls_completed  INTEGER DEFAULT 0,
    p_calls_answered   INTEGER DEFAULT 0,
    p_calls_unanswered INTEGER DEFAULT 0,
    p_texts_completed  INTEGER DEFAULT 0,
    p_text_replies     INTEGER DEFAULT 0,
    p_texts_opted_out  INTEGER DEFAULT 0,
    p_notes            TEXT DEFAULT NULL,
    p_actor_id         UUID DEFAULT NULL
) RETURNS public.daily_activity AS $$
DECLARE
    v_row public.daily_activity;
BEGIN
    INSERT INTO public.daily_activity AS da (
        pic_id, entry_date,
        emails_manual, email_replies, emails_bounced,
        calls_completed, calls_answered, calls_unanswered,
        texts_completed, text_replies, texts_opted_out,
        notes, created_by
    ) VALUES (
        p_pic_id, COALESCE(p_entry_date, CURRENT_DATE),
        p_emails_completed, p_email_replies, p_emails_bounced,
        p_calls_completed, p_calls_answered, p_calls_unanswered,
        p_texts_completed, p_text_replies, p_texts_opted_out,
        p_notes, p_actor_id
    )
    ON CONFLICT (pic_id, entry_date) DO UPDATE SET
        emails_manual    = EXCLUDED.emails_manual,
        email_replies    = EXCLUDED.email_replies,
        emails_bounced   = EXCLUDED.emails_bounced,
        calls_completed  = EXCLUDED.calls_completed,
        calls_answered   = EXCLUDED.calls_answered,
        calls_unanswered = EXCLUDED.calls_unanswered,
        texts_completed  = EXCLUDED.texts_completed,
        text_replies     = EXCLUDED.text_replies,
        texts_opted_out  = EXCLUDED.texts_opted_out,
        notes            = EXCLUDED.notes,
        updated_at       = now()
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────────────────────
-- Called once per successfully sent email. Deliberately additive and tiny: a
-- send must never fail because its bookkeeping did, and a PIC saving the Daily
-- Tasks form mid-day must not wipe what the CRM has already observed -- which
-- is why this touches emails_auto only.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_auto_email(p_pic_id UUID, p_actor_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    INSERT INTO public.daily_activity (pic_id, entry_date, emails_auto, created_by)
    VALUES (p_pic_id, CURRENT_DATE, 1, p_actor_id)
    ON CONFLICT (pic_id, entry_date) DO UPDATE SET
        emails_auto = public.daily_activity.emails_auto + 1,
        updated_at  = now();
END;
$$;

REVOKE ALL ON FUNCTION public.log_auto_email(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_auto_email(UUID, UUID) TO service_role;

NOTIFY pgrst, 'reload schema';
