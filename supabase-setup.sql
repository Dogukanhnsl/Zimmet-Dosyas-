-- Bunu Supabase projenizde "SQL Editor" bölümüne yapıştırıp çalıştırın.
-- Uygulamanın tüm verisini (kişiler + hareketler) tek bir satırda JSON olarak tutan basit bir tablo oluşturur.

create table if not exists app_state (
  id int primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into app_state (id, data)
values (1, '{"people":[],"transactions":[]}'::jsonb)
on conflict (id) do nothing;
