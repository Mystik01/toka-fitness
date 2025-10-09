import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()  # Loads environment variables from .env file

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
if url is None or key is None:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")
supabase: Client = create_client(url, key)

