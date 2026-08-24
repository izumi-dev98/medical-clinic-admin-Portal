-- Add social media URLs to the clinic information table.
alter table public.clinic_information
add column if not exists social_urls jsonb default '{}'::jsonb;

-- Replace the placeholder URLs, then run this update.
update public.clinic_information
set social_urls = jsonb_build_object(
  'facebook', 'https://facebook.com/your-page',
  'tiktok', 'https://tiktok.com/@your-account',
  'youtube', 'https://youtube.com/@your-channel',
  'instagram', 'https://instagram.com/your-account',
  'x', 'https://x.com/your-account',
  'telegram', 'https://t.me/your-account',
  'linkedin', 'https://linkedin.com/company/your-company'
)
where id = (select id from public.clinic_information order by id limit 1);

-- Check the saved data.
select clinic_title, social_urls
from public.clinic_information;
