-- Libreria media e cronologia di publish del pannello admin.
--
-- I file stanno in R2 (`MEDIA` binding) e qui ci sono solo i metadati: chiave,
-- MIME, dimensione e soprattutto l'alt text, che e' la meta di accessibilita' di
-- ogni immagine pubblica. Un file da 8MB non entra in una riga jsonb, e un alt
-- text senza il file non serve a nessuno: quindi i due dati stanno separati.
create table if not exists public.admin_media (
  key text primary key,
  name text not null default '',
  kind text not null default 'other' check (kind in ('image', 'audio', 'video', 'pdf', 'other')),
  content_type text not null default '',
  size integer not null default 0,
  -- L'alt text e' richiesto solo per le immagini, e l'obbligo e' applicato dal
  -- pannello che chiede conferma esplicita, non da un vincolo: un PDF non ha
  -- un'alternativa testuale e renderlo obbligatorio spingerebbe a mettere
  -- "documento" dappertutto, che e' peggio di non averlo.
  alt text,
  caption text,
  uploaded_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_media_kind_idx on public.admin_media (kind, uploaded_at desc);

alter table public.admin_media enable row level security;

comment on table public.admin_media is
  'Metadata for files in the R2 MEDIA bucket. The bucket is private; files are served by functions/media/[[path]].ts.';
comment on column public.admin_media.key is
  'R2 key, always under content/. Doubles as the public path: /media/<key>.';

-- Il check constraint del CMS era la lista chiusa dei sei kind iniziali. La
-- lista cresce, quindi l'ALTER esiste perche' il pannello pubblica anche pagine,
-- voice note, video, redirect, tassonomie, metadati media e impostazioni: senza,
-- una riga di qualsiasi tipo verrebbe respinta da PostgREST con un 400 che dal
-- pannello sembrerebbe un errore di rete.
alter table public.admin_content drop constraint if exists admin_content_kind_check;
alter table public.admin_content
  add constraint admin_content_kind_check
  check (kind in ('post', 'note', 'feedback', 'page', 'site_copy', 'job', 'voice_note', 'video', 'redirect', 'taxonomy', 'media_meta', 'settings'));
