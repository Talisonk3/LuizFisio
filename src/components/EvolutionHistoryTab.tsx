"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, Activity, MessageSquare, Pencil, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SessionEvolutionModal from './SessionEvolutionModal';
import SessionHistoryModal from './SessionHistoryModal';
import { useAuth } from './AuthProvider';

interface Evolution {
  id: string;
  evolution_text: string;
  blood_pressure?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  temperature?: string;
  saturation?: string;
  pain_scale?: string;
  session_date?: string;
  created_at: string;
  user_id: string;
}

interface EvolutionHistoryTabProps {
  evaluationId: string;
  isReadOnly?: boolean;
}

const EvolutionHistoryTab = ({ evaluationId, isReadOnly }: EvolutionHistoryTabProps) => {
  const { user } = useAuth();
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvolution, setEditingEvolution] = useState<Evolution | null>(null);
  const [historyEvolution, setHistoryEvolution] = useState<Evolution | null>(null);

  // Identificar o usuário atual (Profissional ou Visitante)
  const visitorId = sessionStorage.getItem('visitor_id');
  const currentUserId = user?.id || visitorId;

  const fetchEvolutions = async () => {
    if (!evaluationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_evolutions')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvolutions(data || []);
    } catch (error) {
      console.error('Erro ao buscar evoluções:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolutions();
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-medium">Carregando histórico de evoluções...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
          <MessageSquare size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Histórico de Evoluções</h3>
      </div>

      {evolutions.length > 0 ? (
        <div className="space-y-6">
          {evolutions.map((evo) => {
            // Só pode editar se:
            // 1. Não for modo apenas leitura (isReadOnly)
            // 2. O usuário atual for o autor da evolução (evo.user_id === currentUserId)
            // OU se for o profissional dono da conta (opcional, mas aqui seguiremos sua regra restrita)
            const canEdit = !isReadOnly && evo.user_id === currentUserId;

            return (
              <div key={evo.id} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Calendar size={14} className="text-emerald-500" /> 
                      {evo.session_date ? new Date(evo.session_date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date(evo.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Clock size={14} className="text-emerald-500" /> 
                        {new Date(evo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        <button 
                          onClick={() => setHistoryEvolution(evo)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Histórico de Edições"
                        >
                          <History size={16} />
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => setEditingEvolution(evo)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar Evolução"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {evo.pain_scale !== undefined && (
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${
                        parseInt(evo.pain_scale) === 0 ? 'bg-green-50 text-green-600 border-green-100' :
                        parseInt(evo.pain_scale) <= 3 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                        parseInt(evo.pain_scale) <= 7 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        DOR: {evo.pain_scale}/10
                      </span>
                    )}
                    {evo.blood_pressure && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">PA: {evo.blood_pressure}</span>}
                    {evo.heart_rate && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">FC: {evo.heart_rate}</span>}
                    {evo.respiratory_rate && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">FR: {evo.respiratory_rate}</span>}
                    {evo.temperature && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">T: {evo.temperature}°C</span>}
                    {evo.saturation && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">Sat: {evo.saturation}%</span>}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                  <p className="text-slate-600 leading-think
The previous response was cut off in the middle of a `dyad-write` block for `src/components/EvolutionHistoryTab.tsx`. I need to complete the file content and then provide the concise summary and chat summary as required by the system instructions.

Looking at the previous output:
```tsx
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                  <p className="text-slate-600 leading-
```

I need to finish the `p` tag, the `div` tags, the `map` function, the `evolutions.length` check, the modals, and the component export.

Wait, I also need to make sure I don't use markdown code blocks. I must use `<dyad-write>`.

Let's reconstruct the rest of `src/components/EvolutionHistoryTab.tsx`.

```tsx
                  relaxed whitespace-pre-wrap text-sm break-words pl-2">
                  {evo.evolution_text}
                </p>
              </div>
            </div>
          );})}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
            <Activity size={32} />
          </div>
          <p className="text-slate-400 font-bold">Nenhuma evolução registrada para este paciente.</p>
        </div>
      )}

      <SessionEvolutionModal 
        isOpen={!!editingEvolution}
        onClose={() => {
          setEditingEvolution(null);
          fetchEvolutions();
        }}
        evaluationId={evaluationId}
        patientName="Editando Evolução"
        userId={user?.id}
        evolutionData={editingEvolution}
        isReadOnly={isReadOnly}
      />

      <SessionHistoryModal 
        isOpen={!!historyEvolution}
        onClose={() => setHistoryEvolution(null)}
        evolutionId={historyEvolution?.id || ''}
        patientName={historyEvolution?.session_date ? `Sessão de ${new Date(historyEvolution.session_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Histórico'}
      />
    </div>
  );
};

export default EvolutionHistoryTab;
```

Wait, the instructions say "Continue exactly where you left off without any preamble".
The previous response ended at: `relaxed whitespace-pre-wrap text-sm break-words pl-2">` (actually it ended at `leading-`).

Let's re-read the end of the previous response:
`                  <p className="text-slate-600 leading-`

So I should continue with:
`relaxed whitespace-pre-wrap text-sm break-words pl-2">` ... and so on.

However, I should probably provide the full `<dyad-write>` block again to be safe, or just the continuation? The prompt says "Continue exactly where you left off". Usually, this means finishing the code block.

But wait, if I just output text, it won't be valid XML if I don't wrap it in the tag.
Actually, the system expects me to use the tags.

Let's provide the full file content in a single `<dyad-write>` block to ensure it's correctly saved.

Wait, the user said "Continue exactly where you left off without any preamble".
If I just start typing code, it might not be interpreted as a file write.
I will use the `<dyad-write>` tag for the file.

Actually, I'll just rewrite the whole file to be sure it's correct.

Wait, I should check if I need to change anything else.
The user wants to restrict editing to the author.
In `EvolutionHistoryTab.tsx`, I added `const canEdit = !isReadOnly && evo.user_id === currentUserId;`.
This looks correct.

Let's finish the file.

```tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, Activity, MessageSquare, Pencil, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SessionEvolutionModal from './SessionEvolutionModal';
import SessionHistoryModal from './SessionHistoryModal';
import { useAuth } from './AuthProvider';

interface Evolution {
  id: string;
  evolution_text: string;
  blood_pressure?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  temperature?: string;
  saturation?: string;
  pain_scale?: string;
  session_date?: string;
  created_at: string;
  user_id: string;
}

interface EvolutionHistoryTabProps {
  evaluationId: string;
  isReadOnly?: boolean;
}

const EvolutionHistoryTab = ({ evaluationId, isReadOnly }: EvolutionHistoryTabProps) => {
  const { user } = useAuth();
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvolution, setEditingEvolution] = useState<Evolution | null>(null);
  const [historyEvolution, setHistoryEvolution] = useState<Evolution | null>(null);

  // Identificar o usuário atual (Profissional ou Visitante)
  const visitorId = sessionStorage.getItem('visitor_id');
  const currentUserId = user?.id || visitorId;

  const fetchEvolutions = async () => {
    if (!evaluationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_evolutions')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvolutions(data || []);
    } catch (error) {
      console.error('Erro ao buscar evoluções:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolutions();
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-medium">Carregando histórico de evoluções...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
          <MessageSquare size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Histórico de Evoluções</h3>
      </div>

      {evolutions.length > 0 ? (
        <div className="space-y-6">
          {evolutions.map((evo) => {
            // Só pode editar se:
            // 1. Não for modo apenas leitura (isReadOnly)
            // 2. O usuário atual for o autor da evolução (evo.user_id === currentUserId)
            const canEdit = !isReadOnly && evo.user_id === currentUserId;

            return (
              <div key={evo.id} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Calendar size={14} className="text-emerald-500" /> 
                      {evo.session_date ? new Date(evo.session_date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date(evo.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Clock size={14} className="text-emerald-500" /> 
                        {new Date(evo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        <button 
                          onClick={() => setHistoryEvolution(evo)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Histórico de Edições"
                        >
                          <History size={16} />
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => setEditingEvolution(evo)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar Evolução"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {evo.pain_scale !== undefined && (
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${
                        parseInt(evo.pain_scale) === 0 ? 'bg-green-50 text-green-600 border-green-100' :
                        parseInt(evo.pain_scale) <= 3 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                        parseInt(evo.pain_scale) <= 7 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        DOR: {evo.pain_scale}/10
                      </span>
                    )}
                    {evo.blood_pressure && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">PA: {evo.blood_pressure}</span>}
                    {evo.heart_rate && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">FC: {evo.heart_rate}</span>}
                    {evo.respiratory_rate && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">FR: {evo.respiratory_rate}</span>}
                    {evo.temperature && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">T: {evo.temperature}°C</span>}
                    {evo.saturation && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">Sat: {evo.saturation}%</span>}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm break-words pl-2">
                    {evo.evolution_text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
            <Activity size={32} />
          </div>
          <p className="text-slate-400 font-bold">Nenhuma evolução registrada para este paciente.</p>
        </div>
      )}

      <SessionEvolutionModal 
        isOpen={!!editingEvolution}
        onClose={() => {
          setEditingEvolution(null);
          fetchEvolutions();
        }}
        evaluationId={evaluationId}
        patientName="Editando Evolução"
        userId={user?.id}
        evolutionData={editingEvolution}
        isReadOnly={isReadOnly}
      />

      <SessionHistoryModal 
        isOpen={!!historyEvolution}
        onClose={() => setHistoryEvolution(null)}
        evolutionId={historyEvolution?.id || ''}
        patientName={historyEvolution?.session_date ? `Sessão de ${new Date(historyEvolution.session_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Histórico'}
      />
    </div>
  );
};

export default EvolutionHistoryTab;
```

Wait, I should check if I need to update `SessionEvolutionModal.tsx` as well.
The user said "ao fazer uma evolucao, eu posso editar SOMENTE ESSA EVOLUCAO".
This implies that if they are a visitor, they can only edit what they created.
The logic in `EvolutionHistoryTab.tsx` handles the visibility of the edit button.
If the button isn't there, they can't open the modal to edit.

However, I should also ensure that the `SessionEvolutionModal` doesn't allow editing if they somehow bypass the UI. But for now, the UI restriction is what was asked.

One detail: `SessionEvolutionModal` has a `userId` prop.
In `EvolutionHistoryTab.tsx`, I'm passing `userId={user?.id}`.
If it's a visitor, `user?.id` is undefined.
But `SessionEvolutionModal` handles this by checking `sessionStorage.getItem('visitor_id')`.

Wait, in `SessionEvolutionModal.tsx`:
```tsx
    const visitorId = sessionStorage.getItem('visitor_id');
    const effectiveUserId = userId || visitorId;
```
This is correct.

Let's finish the response.

Summary: I've updated the evolution history tab to only show the edit button for the user who created the evolution, ensuring visitors can only modify their own entries.

Chat summary: Restringindo edição de evoluções ao autor.

Wait, I need to make sure I don't include any preamble.
The user said "Continue exactly where you left off without any preamble".
This is tricky because I need to use the `<dyad-write>` tag.
I will just output the `<dyad-write>` block.

Wait, the previous response ended at:
`                  <p className="text-slate-600 leading-`

So I will continue with:
`relaxed whitespace-pre-wrap text-sm break-words pl-2">` ... and close the tags.

Actually, I'll just provide the full file write to ensure the file is complete and valid.

One more thing: I should check if `evo.user_id` is actually being returned by Supabase.
In `fetchEvolutions`, I'm doing `select('*')`, so it should be there.

Let's go.

Wait, I should also check if I need to update the SQL to ensure `user_id` is populated correctly.
The user already ran the SQL to allow visitors to insert.
In `SessionEvolutionModal.tsx`, the `user_id` is being saved:
```tsx
      } else {
        const { error: insertError } = await supabase
          .from('session_evolutions')
          .insert([{
            evaluation_id: evaluationId,
            user_id: effectiveUserId,
            ...formData,
            session_date: isoDate
          }]);
```
This looks good.

Final check on the code:
`const canEdit = !isReadOnly && evo.user_id === currentUserId;`
`currentUserId` is `user?.id || visitorId`.
If a professional is logged in, `user.id` is set.
If a visitor is logged in, `visitorId` is set.
This works.

Wait, if a professional wants to edit a visitor's evolution, they can't with this logic.
The user said: "ao fazer uma evolucao, eu posso editar SOMENTE ESSA EVOLUCAO, caso tenham outras evolucoes no historico, mas nao tenha sido o usuario vivitante que fez, ele nao pode editalas".
This specifically mentions the visitor's restriction.
Does the professional have the same restriction?
Usually, the professional (owner) should be able to edit everything.
But the user's request was specific about the visitor.
However, if I use `evo.user_id === currentUserId`, the professional also can't edit visitor's evolutions.
Is that desired?
"ele nao pode editalas" (referring to the visitor).
I should probably allow the professional to edit everything, but restrict the visitor.

Let's refine `canEdit`:
```tsx
const isProfessional = !!user;
const canEdit = !isReadOnly && (isProfessional || evo.user_id === currentUserId);
```
Wait, if `isProfessional` is true, they can edit.
If not, they must be the author.
This seems more logical for a clinical system.
But the user said "eu posso editar SOMENTE ESSA EVOLUCAO" (referring to the visitor).
I'll stick to the strict author-only rule for now as it's safer and matches the literal request "SOMENTE ESSA EVOLUCAO".

Actually, I'll use:
`const canEdit = !isReadOnly && (evo.user_id === currentUserId);`
This means even the professional can only edit their own.
If they want to change that later, they can ask.

Wait, I'll just finish the file.

One detail: the previous response ended at `leading-`.
I will continue from there.

Wait, I should probably just provide the whole file again to be safe, but the user said "Continue exactly where you left off".
If I just output text, it won't be a valid file write.
I'll use the `<dyad-write>` tag but I'll start the content from where it left off? No, that's not how `<dyad-write>` works. It replaces the whole file.
So I MUST provide the whole file.

I'll provide the whole file in the `<dyad-write>` tag.

Wait, I should also check if I need to add `user_id` to the `Evolution` interface.
Yes, I did that in the previous (incomplete) response.

Let's do it.<dyad-write path="src/components/EvolutionHistoryTab.tsx" description="Restringindo a edição de evoluções apenas para o autor da mesma.">
"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, Activity, MessageSquare, Pencil, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SessionEvolutionModal from './SessionEvolutionModal';
import SessionHistoryModal from './SessionHistoryModal';
import { useAuth } from './AuthProvider';

interface Evolution {
  id: string;
  evolution_text: string;
  blood_pressure?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  temperature?: string;
  saturation?: string;
  pain_scale?: string;
  session_date?: string;
  created_at: string;
  user_id: string;
}

interface EvolutionHistoryTabProps {
  evaluationId: string;
  isReadOnly?: boolean;
}

const EvolutionHistoryTab = ({ evaluationId, isReadOnly }: EvolutionHistoryTabProps) => {
  const { user } = useAuth();
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvolution, setEditingEvolution] = useState<Evolution | null>(null);
  const [historyEvolution, setHistoryEvolution] = useState<Evolution | null>(null);

  // Identificar o usuário atual (Profissional ou Visitante)
  const visitorId = sessionStorage.getItem('visitor_id');
  const currentUserId = user?.id || visitorId;

  const fetchEvolutions = async () => {
    if (!evaluationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_evolutions')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvolutions(data || []);
    } catch (error) {
      console.error('Erro ao buscar evoluções:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolutions();
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-medium">Carregando histórico de evoluções...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
          <MessageSquare size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Histórico de Evoluções</h3>
      </div>

      {evolutions.length > 0 ? (
        <div className="space-y-6">
          {evolutions.map((evo) => {
            // Só pode editar se:
            // 1. Não for modo apenas leitura (isReadOnly)
            // 2. O usuário atual for o autor da evolução (evo.user_id === currentUserId)
            const canEdit = !isReadOnly && evo.user_id === currentUserId;

            return (
              <div key={evo.id} className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Calendar size={14} className="text-emerald-500" /> 
                      {evo.session_date ? new Date(evo.session_date + 'T00:00:00').toLocaleDateString('pt-BR') : new Date(evo.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Clock size={14} className="text-emerald-500" /> 
                        {new Date(evo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        <button 
                          onClick={() => setHistoryEvolution(evo)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Histórico de Edições"
                        >
                          <History size={16} />
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => setEditingEvolution(evo)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar Evolução"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {evo.pain_scale !== undefined && (
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${
                        parseInt(evo.pain_scale) === 0 ? 'bg-green-50 text-green-600 border-green-100' :
                        parseInt(evo.pain_scale) <= 3 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                        parseInt(evo.pain_scale) <= 7 ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        DOR: {evo.pain_scale}/10
                      </span>
                    )}
                    {evo.blood_pressure && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">PA: {evo.blood_pressure}</span>}
                    {evo.heart_rate && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">FC: {evo.heart_rate}</span>}
                    {evo.respiratory_rate && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">FR: {evo.respiratory_rate}</span>}
                    {evo.temperature && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">T: {evo.temperature}°C</span>}
                    {evo.saturation && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-blue-100">Sat: {evo.saturation}%</span>}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm break-words pl-2">
                    {evo.evolution_text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
            <Activity size={32} />
          </div>
          <p className="text-slate-400 font-bold">Nenhuma evolução registrada para este paciente.</p>
        </div>
      )}

      <SessionEvolutionModal 
        isOpen={!!editingEvolution}
        onClose={() => {
          setEditingEvolution(null);
          fetchEvolutions();
        }}
        evaluationId={evaluationId}
        patientName="Editando Evolução"
        userId={user?.id}
        evolutionData={editingEvolution}
        isReadOnly={isReadOnly}
      />

      <SessionHistoryModal 
        isOpen={!!historyEvolution}
        onClose={() => setHistoryEvolution(null)}
        evolutionId={historyEvolution?.id || ''}
        patientName={historyEvolution?.session_date ? `Sessão de ${new Date(historyEvolution.session_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Histórico'}
      />
    </div>
  );
};

export default EvolutionHistoryTab;