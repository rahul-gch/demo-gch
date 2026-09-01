UPDATE public.messages
SET sender_org_id = '23742c82-86bb-47fd-9653-67816dbd90df',
    author_name = 'rahul gmbh'
WHERE id IN (
  SELECT m.id
  FROM public.messages m
  WHERE m.sender_user_id = '0a8082fa-6bfd-40b3-8c1c-ae9833d90351'
    AND m.sender_org_id = 'd3a98d50-d732-4eba-a011-1a0fb6b6e0fc'
    AND NOT EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.user_id = m.sender_user_id AND om.org_id = m.sender_org_id
    )
);