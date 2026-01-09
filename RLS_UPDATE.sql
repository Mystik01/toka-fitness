-- Refresh delete policies without dropping the table
-- Run after the main setup if you need to reapply RLS changes

DROP POLICY IF EXISTS "Users can unenroll themselves" ON public.class_enrollments;
DROP POLICY IF EXISTS "Users or staff can unenroll" ON public.class_enrollments;

CREATE POLICY "Users or staff can unenroll"
  ON public.class_enrollments
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('staff', 'admin')
    )
  );
