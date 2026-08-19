
CREATE TABLE public.notification_reads (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)
);

GRANT SELECT, INSERT, DELETE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notification_reads select"
  ON public.notification_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.is_staff(auth.uid()));

CREATE POLICY "own notification_reads insert"
  ON public.notification_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_staff(auth.uid()));

CREATE POLICY "own notification_reads delete"
  ON public.notification_reads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX notification_reads_notification_idx
  ON public.notification_reads(notification_id);

CREATE OR REPLACE FUNCTION public.unread_notifications_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.notifications n
  WHERE
    (
      (n.user_id = auth.uid() AND n.read_at IS NULL)
      OR (
        n.user_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.notification_reads r
          WHERE r.notification_id = n.id AND r.user_id = auth.uid()
        )
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.unread_notifications_count() TO authenticated;
