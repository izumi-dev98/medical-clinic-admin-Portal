 # Clinic Admin Portal

 This is the admin dashboard for the clinic website. Administrators log in here to manage clinic content. The client-facing website reads the saved content from the same Supabase project, so changes made in this portal appear on the client after the client fetches the updated data.


 ## What the admin manages

- Hospital/Clinic Information, including the profile image used as the admin logo
- Mission, Vision & Core
- Awards
- Services
- Doctors
- Management Team
- Medical Packages
- Promotions
- Blog posts
- Corporate information
- Social URLs
- Appointments
- Admin users

 Images are uploaded through Cloudinary. Clinic Information and Awards preserve the full image proportions. Other image fields use the selectable 16:9 crop position.

 ## Data flow

 ```text
 Admin Portal -> Supabase tables -> Client Website
				  -> Cloudinary images -> public image URLs
 ```

 The admin portal writes to the tables in `supabase/`. The client project must use the same Supabase project and read the relevant tables, for example:

 ```js
 const { data, error } = await supabase
	.from('services')
	.select('*')
	.order('created_at', { ascending: false })
 ```

 The same pattern applies to `clinic_information`, `mission_vision_core`, `awards`, `doctors`, `management_team`, `medical_packages`, `promotions`, `blog_posts`, `corporate`, and `appointments`.

 ## Requirements

 - Node.js 18 or newer
 - A Supabase project
 - A Cloudinary account with an unsigned upload preset
 - Vercel, or another serverless host, for the API routes

 ## Local setup

 1. Install dependencies:

	 ```bash
	 npm install
	 ```

 2. Create `.env.local` in the project root:

	 ```env
	 VITE_SUPABASE_URL=https://your-project.supabase.co
	 VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
	 VITE_USE_SUPABASE_PROXY=false

	 SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
	 AUTH_SESSION_SECRET=use-a-long-random-secret
	 CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
	 CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
	 CLOUDINARY_API_KEY=your-cloudinary-api-key
	 CLOUDINARY_API_SECRET=your-cloudinary-api-secret
	 ```

	 Never expose `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SESSION_SECRET`, or `CLOUDINARY_API_SECRET` in client-side code.

 3. In Supabase SQL Editor, run the SQL files in `supabase/`. At minimum, run the table scripts for the content that the client website will display. Run `admin_users.sql` to create the initial administrator.

 4. Start the admin portal:

	 ```bash
	 npm run dev
	 ```

	 Open the local URL shown by Vite, usually `http://localhost:5173`.

 ## Initial login

 The `admin_users.sql` seed creates the username `admin`. Change or replace the seeded password hash before using this in production. Passwords are stored as bcrypt hashes, never as plaintext.

 ## Available scripts

 ```bash
 npm run dev       # Start local development
 npm run build     # Create a production build
 npm run preview   # Preview the production build locally
 npm run lint      # Run ESLint
 ```

 ## Deployment

 Deploy the repository to Vercel and add all environment variables from `.env.local` in the Vercel project settings. Redeploy after changing environment variables. The `api/` directory contains authentication, session, Cloudinary upload, and Cloudinary deletion routes.

 The client website does not receive data from the admin portal directly. It reads the shared Supabase tables and uses the saved public Cloudinary image URLs. After saving content in the admin portal, refresh or re-fetch the client page to display the update.

 ## Security notes

 - Keep service-role and API secret values server-side only.
 - Keep Supabase Row Level Security policies enabled.
 - Restrict admin access through the login API and a strong `AUTH_SESSION_SECRET`.
 - Review the policies in each SQL file before production deployment.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
