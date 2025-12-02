#Toka Fitness — Full-Stack Web Application

A full-stack fitness tracking and membership web application built using Next.js, Flask, and Supabase.
This project was created to demonstrate modern web development practices, secure authentication, and API-driven architecture.

⸻

##🚀 Tech Stack

Frontend: Next.js, React, Tailwind
Backend: Flask (Python), REST API
Database & Auth: Supabase (Postgres + Auth)
Deployment: Vercel (Next.js + Python Serverless Functions)

⸻

##🌐 Live Demo

Production: https://ommix.xyz
Dev Branch: https://dev.ommix.xyz

My Supabase database pauses itself after a little while so you may get server error and unable to register or login if this has happend.
⸻

##📌 Features
	•	🔐 User authentication with Supabase
	•	📊 Fitness tracking (workouts, progress logging, etc.)
	•	🧩 Full-stack architecture using Next.js frontend + Flask backend
	•	☁️ Cloud deployment using Vercel (Next.js hosting + Python serverless functions)
	•	🗄️ Database integration with Postgres (Supabase)
	•	⚙️ Reusable API endpoints for user data and fitness entries

⸻

##🏗️ Architecture Overview

This project uses a hybrid setup:
	•	The Next.js frontend handles routing, UI, and interactions
	•	The Flask API provides backend logic and communicates with Supabase
	•	All Flask routes are exposed under /api/* using Vercel rewrites
	•	In production, the Flask API runs as serverless Python functions

This structure allows the UI to stay fast while the backend handles secure operations and database interactions.

⸻

##🧪 Local Development

Install dependencies
`npm i`

Run Locally:

Mac/Linux:
`npm run dev`

Windows:
`npm run dev:win`

⸻

## Future Plans

This project is a work in progress for me as I'm activly building on during my lessons.
