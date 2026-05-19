CREATE POLICY "Authenticated users can delete templates"
ON public.lab_test_templates
FOR DELETE
TO authenticated
USING (true);