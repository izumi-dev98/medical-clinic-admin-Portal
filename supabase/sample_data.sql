-- Sample data for the NOSH clinic admin portal.
-- Run the table SQL files first, then run this file.

insert into public.clinic_information (clinic_title, about_us, address, emergency_phone, phone, email)
select 'NOSH Wellness Clinic', 'Compassionate primary care and specialist services for healthier families.', '12 Greenway Avenue, New York, NY 10001', '+1 212 555 0199', '+1 212 555 0188', 'hello@noshclinic.com'
where not exists (select 1 from public.clinic_information);

insert into public.mission_vision_core (section_type, title, description, display_order)
select * from (values
  ('Mission', 'Care that feels human', 'To provide accessible, thoughtful healthcare that puts every patient at the center.', 1),
  ('Vision', 'A healthier community', 'To become the most trusted partner for lifelong health in our community.', 2),
  ('Core Value', 'Compassion first', 'We listen carefully, communicate clearly, and treat every person with dignity.', 3),
  ('Core Value', 'Always improving', 'We use evidence, curiosity, and teamwork to make every visit better.', 4)
) as sample(section_type, title, description, display_order)
where not exists (select 1 from public.mission_vision_core);

insert into public.awards (title, description, image_urls)
select * from (values
  ('Best Community Clinic 2025', 'Recognized for outstanding patient care and community health education.', '{}'::text[]),
  ('Patient Choice Award', 'Voted one of the most trusted local healthcare providers by our patients.', '{}'::text[])
) as sample(title, description, image_urls)
where not exists (select 1 from public.awards existing where existing.title = sample.title);

insert into public.services (title, description, image_urls)
select * from (values
  ('General Consultation', 'Personalized consultations for everyday health concerns and preventive care.', '{}'::text[]),
  ('Cardiology', 'Complete heart health assessments, monitoring, and specialist guidance.', '{}'::text[]),
  ('Dental Care', 'Modern preventive, restorative, and cosmetic dental treatments for all ages.', '{}'::text[]),
  ('Women''s Health', 'Private, supportive care for women through every stage of life.', '{}'::text[])
) as sample(title, description, image_urls)
where not exists (select 1 from public.services existing where existing.title = sample.title);

insert into public.doctors (doctor_name, facility, address, phone, gender, qualifications, biography, image_url)
select * from (values
  ('Dr. Amelia Carter', 'Main Clinic', '12 Greenway Avenue, New York, NY 10001', '+1 212 555 0101', 'Female', 'MD, Internal Medicine', 'Dr. Carter has more than 12 years of experience in preventive and family medicine.', null),
  ('Dr. James Dean', 'Specialist Center', '24 Park Street, New York, NY 10002', '+1 212 555 0102', 'Male', 'MD, FACC, Cardiology', 'Dr. Dean specializes in cardiovascular health, prevention, and rehabilitation.', null),
  ('Dr. Sophia Brown', 'Dental Studio', '18 Madison Avenue, New York, NY 10003', '+1 212 555 0103', 'Female', 'DDS, Cosmetic Dentistry', 'Dr. Brown provides gentle, modern dental care focused on confident healthy smiles.', null)
) as sample(doctor_name, facility, address, phone, gender, qualifications, biography, image_url)
where not exists (select 1 from public.doctors);

insert into public.management_team (name, position, department, description, image_url)
select * from (values
  ('Amelia Nguyen', 'Clinic Director', 'Administration', 'Leads clinic operations and keeps every department focused on excellent patient experiences.', null),
  ('Sarah Kim', 'Patient Care Manager', 'Patient Services', 'Coordinates patient support and helps families find the right care quickly.', null),
  ('Michael Brooks', 'Finance Manager', 'Finance', 'Oversees billing, planning, and responsible financial operations for the clinic.', null)
) as sample(name, position, department, description, image_url)
where not exists (select 1 from public.management_team);

insert into public.corporate (title, description, image_url)
select * from (values
  ('Corporate Wellness Partnerships', 'Flexible healthcare programs that help local businesses support healthier teams.', null),
  ('Employee Health Screening', 'Convenient workplace screening packages designed around the needs of growing organizations.', null)
) as sample(title, description, image_url)
where not exists (select 1 from public.corporate existing where existing.title = sample.title);

insert into public.medical_packages (title, short_description, description, price, duration, included_services, image_url, is_active)
select * from (values
  ('Complete Health Checkup', 'A complete picture of your current health.', 'A comprehensive screening package designed to identify health risks early and give you a clear care plan.', 199.00, '2 hours', 'Blood test, ECG, chest X-ray, doctor consultation', null, true),
  ('Family Wellness Plan', 'Essential preventive care for the whole family.', 'A convenient package for families who want regular health reviews and practical wellness guidance.', 349.00, '3 hours', 'Four consultations, basic lab work, wellness planning', null, true),
  ('Heart Health Screening', 'Focused screening for cardiovascular wellness.', 'A specialist-led package for understanding your heart health and reducing future risk.', 149.00, '90 minutes', 'ECG, blood pressure review, cholesterol test, cardiology consultation', null, true)
) as sample(title, short_description, description, price, duration, included_services, image_url, is_active)
where not exists (select 1 from public.medical_packages);

insert into public.promotions (title, description, discount_type, discount_value, start_date, end_date, promo_code, image_url, is_active)
select * from (values
  ('New Patient Welcome Offer', 'Save on your first general consultation at NOSH.', 'Percentage', 20.00, '2026-01-01'::date, '2026-12-31'::date, 'WELCOME20', null, true),
  ('Dental Care Days', 'Enjoy a special price on dental cleaning and checkups.', 'Fixed amount', 25.00, '2026-08-01'::date, '2026-09-30'::date, 'SMILE25', null, true)
) as sample(title, description, discount_type, discount_value, start_date, end_date, promo_code, image_url, is_active)
where not exists (select 1 from public.promotions);

insert into public.blog_posts (title, short_description, content, author, category, image_url, published_date, status, is_featured)
select * from (values
  ('5 Simple Habits for Better Heart Health', 'Small daily choices can make a meaningful difference to your heart.', 'Regular movement, balanced meals, restful sleep, and routine checkups all support a healthier heart. Start with one small habit today and build from there.', 'Dr. James Dean', 'Heart Health', null, '2026-08-10'::date, 'Published', true),
  ('How to Prepare for Your First Checkup', 'Make your next appointment more useful with a little preparation.', 'Bring a list of your medications, recent symptoms, questions, and any relevant health records. Honest conversations help your care team support you better.', 'Dr. Amelia Carter', 'Wellness', null, '2026-08-17'::date, 'Published', false),
  ('Understanding Preventive Care', 'Prevention helps you stay ahead of health concerns.', 'Preventive care includes screenings, vaccinations, healthy routines, and regular conversations with your healthcare team. Your care plan should fit your life and goals.', 'Sarah Kim', 'Patient Guide', null, null, 'Draft', false)
) as sample(title, short_description, content, author, category, image_url, published_date, status, is_featured)
where not exists (select 1 from public.blog_posts);
