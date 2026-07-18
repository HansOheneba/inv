-- Atlas chat history — persistent conversations for the owner's AI copilot.
-- Modelled the same way ChatGPT/DeepSeek store chats: one row per conversation
-- (thread) and one row per message. The prompt sent to the model is rebuilt
-- from these message rows on every turn rather than stored as a single blob,
-- which is what lets a conversation be resumed later.
--
-- Scoped per-user via RLS. Atlas is owner-only at the app layer, so in practice
-- only the owner ever has rows here, but keying on auth.uid() keeps it correct
-- and self-contained regardless of who is signed in.

create table if not exists public.atlas_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists atlas_conversations_user_idx
  on public.atlas_conversations (user_id, updated_at desc);

create table if not exists public.atlas_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.atlas_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists atlas_messages_conversation_idx
  on public.atlas_messages (conversation_id, created_at);

-- ============================================================================
-- Grants — mirror the other migrations, which apply schema via plain SQL.
-- ============================================================================
grant select, insert, update, delete on public.atlas_conversations to authenticated;
grant select, insert, update, delete on public.atlas_messages to authenticated;

-- ============================================================================
-- Row Level Security — each user only ever sees and edits their own chats.
-- ============================================================================
alter table public.atlas_conversations enable row level security;
alter table public.atlas_messages enable row level security;

create policy "own conversations" on public.atlas_conversations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own messages" on public.atlas_messages
  for all to authenticated
  using (
    exists (
      select 1 from public.atlas_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.atlas_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
