-- Supabase SQL for avatar/image storage access
-- Run this in the Supabase SQL Editor after creating the profiles table.

create policy if not exists "allow_public_read_for_avatar_bucket"
on storage.objects
for select
using (bucket_id = 'designer_files');

create policy if not exists "allow_authenticated_upload_to_avatar_bucket"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'designer_files');

create policy if not exists "allow_authenticated_update_to_avatar_bucket"
on storage.objects
for update
to authenticated
using (bucket_id = 'designer_files')
with check (bucket_id = 'designer_files');

create policy if not exists "allow_authenticated_delete_from_avatar_bucket"
on storage.objects
for delete
to authenticated
using (bucket_id = 'designer_files');

create policy if not exists "allow_anon_upload_to_avatar_bucket"
on storage.objects
for insert
to anon
with check (bucket_id = 'designer_files');
