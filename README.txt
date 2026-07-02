ScamShield AI
=============

An AI-powered scam detection platform. Paste a suspicious message, enter a URL,
upload a screenshot, or scan a QR code with your camera. Gemini AI analyzes it
and returns a full threat report with a risk score, red flags, attacker goal,
and recommendations.


FEATURES
--------
- Text analysis: paste emails, SMS, or any suspicious message
- URL scanning: check links before you click them
- Image analysis: upload screenshots of suspicious content
- QR code scanner: use your device camera to scan and analyze QR codes
- Simple Mode: plain-language explanations for non-technical users
- Scan history: review all past analyses
- Dashboard: stats, threat breakdown chart, and recent high-risk alerts


REQUIREMENTS
------------
Before you begin, make sure you have the following installed:

1. Node.js (version 20 or higher)
   Download: https://nodejs.org

2. pnpm (package manager)
   Install by running: npm install -g pnpm

3. PostgreSQL (version 14 or higher)
   Download: https://www.postgresql.org/download/
   OR use a free hosted database at: https://neon.tech

4. Google Gemini API Key (free)
   Get one at: https://aistudio.google.com/app/apikey


SETUP INSTRUCTIONS
------------------

Step 1: Extract the project files
   tar -xzf scamshield-project.tar.gz
   cd workspace

Step 2: Install all dependencies
   pnpm install

Step 3: Create a .env file in the root folder
   Create a file named ".env" and add the following lines:

   DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/scamshield
   GEMINI_API_KEY=your_gemini_api_key_here
   SESSION_SECRET=any_random_string_you_choose

   Replace the values with your actual database credentials and API key.

   TIP: If you don't want to install PostgreSQL locally, sign up for a free
   database at https://neon.tech and paste the connection string they give you
   as the DATABASE_URL value.

Step 4: Set up the database tables
   pnpm --filter @workspace/db run push

Step 5: (Optional) Load sample data
   pnpm --filter @workspace/db run seed
   This adds 5 demo scans so the dashboard is not empty on first launch.

Step 6: Start the backend API server
   Open a terminal window and run:
   PORT=5000 pnpm --filter @workspace/api-server run dev

   Keep this terminal running.

Step 7: Start the frontend
   Open a SECOND terminal window and run:
   PORT=3000 BASE_URL=/ pnpm --filter @workspace/scamshield run dev

   Keep this terminal running too.

Step 8: Open the app in your browser
   Go to: http://localhost:3000


ENVIRONMENT VARIABLES
---------------------
DATABASE_URL   - Your PostgreSQL connection string (required)
GEMINI_API_KEY - Your Google Gemini API key (required)
SESSION_SECRET - Any random string for session security (required)


USEFUL COMMANDS
---------------
Regenerate API code from spec:
   pnpm --filter @workspace/api-spec run codegen

Run TypeScript type checks:
   pnpm run typecheck

Push database schema changes:
   pnpm --filter @workspace/db run push


PROJECT FOLDER OVERVIEW
-----------------------
artifacts/api-server/    - Express backend API
artifacts/scamshield/    - React frontend app
lib/api-spec/            - OpenAPI spec (API contract)
lib/db/                  - Database schema and migrations
lib/api-client-react/    - Auto-generated API hooks for the frontend


LICENSE
-------
MIT
