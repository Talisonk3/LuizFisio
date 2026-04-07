-- Atualizar políticas da tabela session_evolutions para permitir inserção por visitantes (anon)
-- Verificamos se existe uma associação na tabela visitor_evaluations para o paciente em questão
CREATE POLICY "Permitir que visitantes insiram evoluções" ON public.session_evolutions
FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visitor_evaluations
    WHERE visitor_evaluations.evaluation_id = session_evolutions.evaluation_id
  )
);

CREATE POLICY "Permitir que visitantes atualizem evoluções" ON public.session_evolutions
FOR UPDATE TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.visitor_evaluations
    WHERE visitor_evaluations.evaluation_id = session_evolutions.evaluation_id
  )
);

-- Atualizar políticas da tabela session_evolution_history para permitir que visitantes registrem o histórico
CREATE POLICY "Permitir que visitantes insiram histórico de evoluções" ON public.session_evolution_history
FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visitor_evaluations
    JOIN public.session_evolutions ON session_evolutions.evaluation_id = visitor_evaluations.evaluation_id
    WHERE session_evolutions.id = session_evolution_history.evolution_id
  )
);

-- Importante: Garantir que visitantes possam ver as evoluções (já existe, mas reforçando para anon)
DROP POLICY IF EXISTS "Visitantes visualizam evoluções autorizadas" ON public.session_evolutions;
CREATE POLICY "Visitantes visualizam evoluções autorizadas" ON public.session_evolutions
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.visitor_evaluations
    WHERE visitor_evaluations.evaluation_id = session_evolutions.evaluation_id
  )
);