begin;

alter table public.ecc_documentos
  add column if not exists caminho_storage text,
  add column if not exists nome_arquivo text,
  add column if not exists tipo_arquivo text,
  add column if not exists tamanho_bytes bigint;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agape-documentos',
  'agape-documentos',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = greatest(coalesce(storage.buckets.file_size_limit, 0), excluded.file_size_limit),
    allowed_mime_types = excluded.allowed_mime_types;

commit;
