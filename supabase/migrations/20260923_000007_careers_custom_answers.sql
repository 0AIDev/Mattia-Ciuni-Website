-- Custom application answers remain private and are intentionally stored as
-- structured data so an evaluator can consume a stable, normalized payload later.
alter table public.careers_applications
  add column if not exists custom_answers jsonb not null default '{}'::jsonb;

comment on column public.careers_applications.custom_answers is 'Normalized applicant answers keyed by admin-defined question id; reserved for future evaluator/LLM workflows.';
