from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import logging
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env file only in local development
load_dotenv()

app = Flask(__name__)

# Get environment variables with validation
SUPABASE_URL = os.environ.get("SUPABASE_URL")
# Prefer service role key (bypasses RLS when needed); fall back to SUPABASE_KEY if not provided
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or os.environ.get("SUPABASE_KEY")

# Validate required environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.error("❌ Missing required environment variables: SUPABASE_URL and/or SUPABASE_KEY")
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")

# Initialize Supabase client directly
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configure CORS for both development and production
cors_origins = ["http://localhost:3001"]  # Development
if os.environ.get('VERCEL_URL'):
    cors_origins.append(f"https://{os.environ.get('VERCEL_URL')}")
if os.environ.get('VERCEL_PROJECT_PRODUCTION_URL'):
    cors_origins.append(f"https://{os.environ.get('VERCEL_PROJECT_PRODUCTION_URL')}")
# Add your custom domain if you have one
cors_origins.extend([
    "https://*.vercel.app",
    "https://*.ommix.xyz"  # Replace with your actual domain if you have one
])

CORS(
    app,
    supports_credentials=True,
    origins=cors_origins,
)

# Check if running on Vercel
IS_VERCEL = os.environ.get('VERCEL') == '1'

# Configure logging based on environment
if IS_VERCEL:
    # Production: Minimal logging to stdout, only real errors to stderr
    logging.basicConfig(
        level=logging.WARNING,  # Only log warnings and errors
        stream=sys.stdout,
        format='[%(levelname)s] %(message)s'
    )
else:
    # Development: Verbose logging
    logging.basicConfig(
        level=logging.INFO,
        stream=sys.stdout,
        format='[%(levelname)s] %(name)s: %(message)s'
    )

logger = logging.getLogger(__name__)

# Check if we're in production
is_production = os.environ.get('VERCEL_ENV') == 'production' or os.environ.get('NODE_ENV') == 'production'

def get_frontend_url():
    """Get the correct frontend URL based on environment"""
    if IS_VERCEL:
        # In production/Vercel, construct URL from environment variables
        if os.environ.get('VERCEL_PROJECT_PRODUCTION_URL'):
            return f"https://{os.environ.get('VERCEL_PROJECT_PRODUCTION_URL')}"
        elif os.environ.get('VERCEL_URL'):
            return f"https://{os.environ.get('VERCEL_URL')}"
        else:
            # Fallback to request host if available
            return "https://your-domain.com"  # Replace with your actual domain
    else:
        # Development
        return "http://localhost:3001"

def check_supabase_connection():
    """Check if Supabase connection is working"""
    try:
        # Try to make a simple query to test connection
        response = supabase.auth.get_session()
        if not IS_VERCEL:
            logger.info("✅ Supabase connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {str(e)}")
        return False

# Check connection on startup
check_supabase_connection()

def get_user_role(user_id: str) -> str:
    """Get user role from the secure user_roles table"""
    try:
        response = supabase.table("user_roles").select("role").eq("user_id", user_id).single().execute()
        if hasattr(response, 'data') and response.data:
            return response.data.get("role", "user")
        return "user"
    except Exception as e:
        if not IS_VERCEL:
            logger.warning(f"Could not fetch role for user {user_id}: {str(e)}")
        return "user"

# Middleware to detect browser requests and redirect
@app.before_request
def redirect_browser_requests():
    """Redirect browser requests to frontend, except for /api/ endpoints"""
    # Skip for any /api/ endpoints (these are API calls, not browser visits)
    if request.path.startswith('/api/'):
        return None
    
    # Check if request is from a browser (has Accept header with text/html)
    accept_header = request.headers.get('Accept', '')
    is_browser_request = 'text/html' in accept_header
    
    # Only redirect GET requests from browsers
    if request.method == 'GET' and is_browser_request:
        # Determine frontend URL based on environment
        if IS_VERCEL:
            # In production, redirect to the root domain
            frontend_url = request.url_root.replace('/api', '')
        else:
            # In development, redirect to Next.js dev server
            frontend_url = 'http://localhost:3001'
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="5;url={frontend_url}">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                }}
                .container {{
                    max-width: 500px;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }}
                h1 {{ font-size: 2rem; margin-bottom: 1rem; }}
                p {{ font-size: 1.1rem; margin-bottom: 1.5rem; opacity: 0.9; }}
                .emoji {{ font-size: 4rem; margin-bottom: 1rem; }}
                a {{
                    display: inline-block;
                    padding: 12px 24px;
                    background: white;
                    color: #667eea;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: transform 0.2s;
                }}
                a:hover {{ transform: scale(1.05); }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">🚫</div>
                <h1>You Shouldn't Be Here!</h1>
                <p>You're in the wrong place, don't worry I'll redirect you just wait a sec.</p>
                <p>Redirecting you in 5 seconds...</p>
                <a href="{frontend_url}">Click here if not redirected</a>
            </div>
        </body>
        </html>
        """, 200
    
    return None

@app.route("/api/python")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/api/login", methods=["POST"])
def login():
    email = None  # Initialize email variable for exception handling
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if response.user and response.session:
            access_token = response.session.access_token
            refresh_token = response.session.refresh_token
            
            # ℹ️ Only log in development
            if not IS_VERCEL:
                logger.info(f"✅ User {email} logged in successfully")
            
            flask_response = make_response(jsonify({
                "message": "Login successful",
                "user": {
                    "id": response.user.id, 
                    "email": response.user.email,
                    "created_at": response.user.created_at,
                    "last_sign_in_at": response.user.last_sign_in_at
                }
            }), 200)
            
            # ✅ Set cookies for session
            flask_response.set_cookie(
                "sb-access-token",
                access_token,
                httponly=True,
                secure=is_production,
                samesite="Lax",
                max_age=3600
            )
            flask_response.set_cookie(
                "sb-refresh-token",
                refresh_token,
                httponly=True,
                secure=is_production,
                samesite="Lax",
                max_age=604800  # 7 days
            )
            return flask_response
        else:
            # ℹ️ Failed login is INFO, not an error - user just typed wrong password
            if not IS_VERCEL:
                logger.info(f"ℹ️ Failed login attempt for {email}")
            return jsonify({"error": "Invalid login credentials"}), 401

    except Exception as e:
        error_message = str(e).lower()
        
        # Check if it's an authentication-related error (should be 401)
        if any(term in error_message for term in [
            'invalid_credentials', 
            'invalid login credentials',
            'email not confirmed', 
            'email_not_confirmed',
            'invalid_grant',
            'user not found',
            'invalid email or password',
            'authentication failed',
            'invalid_user_password'
        ]):
            # ℹ️ Authentication failure is normal user behavior, not a server error
            if not IS_VERCEL:
                logger.info(f"ℹ️ Authentication failed for {email or 'unknown'}: {error_message}")
            return jsonify({"error": "Invalid login credentials"}), 401
        
        # Check for rate limiting (should be 429)
        if any(term in error_message for term in [
            'too many requests',
            'rate limit',
            'too_many_requests'
        ]):
            if not IS_VERCEL:
                logger.info(f"ℹ️ Rate limit hit for {email or 'unknown'}")
            return jsonify({"error": "Too many login attempts. Please try again later."}), 429
        
        # ❌ Real server errors (database connection, network issues, etc.)
        logger.error(f"❌ Login server error: {str(e)}")
        return jsonify({"error": "Internal server error. Please try again."}), 500

@app.route("/api/register", methods=["POST"])
def register():
    """Handle user registration with email and password"""
    email = None  # Initialize email variable for exception handling
    try:
        data = request.get_json()
        
        if not data:
            return make_response(jsonify({"error": "No data provided"}), 400)
        
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return make_response(jsonify({"error": "Email and password are required"}), 400)
        
        if len(password) < 6:
            return make_response(jsonify({"error": "Password must be at least 6 characters long"}), 400)
        
        # Register user with Supabase
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "email_redirect_to": f"{get_frontend_url()}"
            }
        })
        
        if response.user:
            if not IS_VERCEL:
                logger.info(f"✅ User {email} registered successfully")
            
            # Check if user needs email confirmation
            if response.session:
                # User is automatically logged in (email confirmation disabled)
                return make_response(jsonify({
                    "message": "Registration successful! You are now logged in.",
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "created_at": response.user.created_at
                    },
                    "access_token": response.session.access_token,
                    "email_confirmed": True
                }), 201)
            else:
                # User needs to confirm email
                return make_response(jsonify({
                    "message": "Registration successful! Please check your email to verify your account before logging in.",
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "created_at": response.user.created_at
                    },
                    "email_confirmed": False
                }), 201)
        else:
            return make_response(jsonify({"error": "Registration failed"}), 400)
            
    except Exception as e:
        error_message = str(e).lower()
        
        # Check if it's a user-related error (should be 400 or 409)
        if any(term in error_message for term in [
            'user_already_exists',
            'already registered', 
            'already exists',
            'email already registered',
            'duplicate'
        ]):
            # ℹ️ User already exists is normal behavior, not a server error
            if not IS_VERCEL:
                logger.info(f"ℹ️ Registration attempt for existing user: {email or 'unknown'}")
            return make_response(jsonify({"error": "An account with this email already exists"}), 409)
        
        # Check for invalid email/password format
        if any(term in error_message for term in [
            'invalid email',
            'invalid_email',
            'email format',
            'weak password',
            'password too weak'
        ]):
            if not IS_VERCEL:
                logger.info(f"ℹ️ Registration validation error for {email or 'unknown'}: {error_message}")
            return make_response(jsonify({"error": str(e)}), 400)
        
        # Check for rate limiting
        if any(term in error_message for term in [
            'too many requests',
            'rate limit',
            'too_many_requests'
        ]):
            if not IS_VERCEL:
                logger.info(f"ℹ️ Registration rate limit hit for {email or 'unknown'}")
            return make_response(jsonify({"error": "Too many registration attempts. Please try again later."}), 429)
        
        # ❌ Real server errors (database connection, network issues, etc.)
        logger.error(f"❌ Registration server error: {str(e)}")
        return make_response(jsonify({"error": "Internal server error. Please try again."}), 500)

@app.route("/api/validate-session", methods=["GET"])
def validate_session():
    try:
        token = request.cookies.get("sb-access-token")
        if not token:
            # ℹ️ No token is normal - user isn't logged in
            return jsonify({"error": "No token"}), 401

        user = supabase.auth.get_user(token)

        if user and user.user:
            return jsonify({
                "message": "Valid session",
                "user": {
                    "id": user.user.id,
                    "email": user.user.email,
                    "created_at": user.user.created_at,
                    "last_sign_in_at": user.user.last_sign_in_at
                }
            }), 200
        else:
            # ℹ️ Invalid token is normal - session expired
            return jsonify({"error": "Invalid session"}), 401

    except Exception as e:
        # ❌ Real error - Supabase connection issue
        logger.error(f"❌ Session validation error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/me", methods=["GET", "PATCH"])
def get_me():
    token = request.cookies.get("sb-access-token")
    refresh_token = request.cookies.get("sb-refresh-token")
    
    if not token:
        return jsonify({"error": "Not logged in"}), 401

    try:
        user = supabase.auth.get_user(token)
        
        if not user or not user.user:
            return jsonify({"error": "Invalid session"}), 401

        # GET - Return user data
        if request.method == "GET":
            metadata = user.user.user_metadata or {}
            # Build display name from metadata
            display_name = metadata.get("display_name")
            if not display_name and metadata.get("first_name"):
                display_name = f"{metadata.get('first_name', '')} {metadata.get('last_name', '')}".strip()
            
            # Get role from secure database table instead of user_metadata
            role = get_user_role(user.user.id)
            
            return jsonify({
                "id": user.user.id,
                "email": user.user.email,
                "created_at": user.user.created_at,
                "last_sign_in_at": user.user.last_sign_in_at,
                "displayName": display_name,
                "role": role,
                "user_metadata": metadata
            }), 200

        # PATCH - Update user data
        if request.method == "PATCH":
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400

            # Prevent users from updating their own role via this endpoint
            if "role" in data:
                return jsonify({"error": "Cannot update role via this endpoint"}), 403

            current_metadata = user.user.user_metadata or {}
            updated_metadata = {**current_metadata}

            # Handle display name update (can be first/last name or direct display_name)
            if "first_name" in data or "last_name" in data:
                first_name = data.get("first_name", current_metadata.get("first_name", "")).strip()
                last_name = data.get("last_name", current_metadata.get("last_name", "")).strip()
                updated_metadata["first_name"] = first_name
                updated_metadata["last_name"] = last_name
                updated_metadata["display_name"] = f"{first_name} {last_name}".strip()
            elif "display_name" in data:
                updated_metadata["display_name"] = data["display_name"].strip()

            # Set session and update user
            supabase.auth.set_session(token, refresh_token or "")
            result = supabase.auth.update_user({"data": updated_metadata})

            if not IS_VERCEL:
                logger.info(f"✅ Updated user profile for {user.user.email}")

            # Return updated user data
            display_name = updated_metadata.get("display_name")
            if not display_name and updated_metadata.get("first_name"):
                display_name = f"{updated_metadata.get('first_name', '')} {updated_metadata.get('last_name', '')}".strip()

            # Get role from secure database table
            role = get_user_role(user.user.id)

            return jsonify({
                "id": user.user.id,
                "email": user.user.email,
                "created_at": user.user.created_at,
                "last_sign_in_at": user.user.last_sign_in_at,
                "displayName": display_name,
                "role": role,
                "user_metadata": updated_metadata
            }), 200
            
    except Exception as e:
        logger.error(f"❌ User API error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/onboarding", methods=["POST"])
def onboarding():
    """Update user's display name during onboarding"""
    try:
        token = request.cookies.get("sb-access-token")
        refresh_token = request.cookies.get("sb-refresh-token")
        if not token:
            return jsonify({"error": "Not logged in"}), 401

        data = request.get_json()
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()

        if not first_name or not last_name:
            return jsonify({"error": "First name and last name are required"}), 400

        # Get current user to verify token is valid
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            return jsonify({"error": "Invalid session"}), 401

        # Update user metadata with display name
        display_name = f"{first_name} {last_name}"
        current_metadata = user.user.user_metadata or {}
        
        # Preserve existing metadata (like role) and add name fields
        updated_metadata = {
            **current_metadata,
            "first_name": first_name,
            "last_name": last_name,
            "display_name": display_name,
        }

        # Set the session first so update_user works
        supabase.auth.set_session(token, refresh_token or "")
        
        # Now update the user metadata
        result = supabase.auth.update_user({"data": updated_metadata})

        if not IS_VERCEL:
            logger.info(f"✅ Updated user profile: {display_name}")

        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "id": user.user.id,
                "email": user.user.email,
                "display_name": display_name,
            }
        }), 200

    except Exception as e:
        logger.error(f"❌ Onboarding error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/logout", methods=["POST"])
def logout():
    try:
        response = make_response(jsonify({"message": "Logged out successfully"}), 200)
        response.set_cookie(
            "sb-access-token", 
            "", 
            expires=0, 
            httponly=True, 
            samesite="Lax", 
            secure=is_production
        )
        return response
        
    except Exception as e:
        logger.error(f"❌ Logout error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    """Handle password reset email sending"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get("email")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Send password reset email via Supabase
        response = supabase.auth.reset_password_for_email(
            email,
            {
                "redirect_to": f"{get_frontend_url()}/auth/reset-password"
            }
        )
        
        if not IS_VERCEL:
            logger.info(f"✅ Password reset email sent to: {email}")
        return jsonify({
            "message": "Password reset email sent successfully",
            "email": email
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Reset password error: {str(e)}")
        return jsonify({"error": "Failed to send reset email. Please try again."}), 500

@app.route("/api/verify-email", methods=["POST"])
def verify_email():
    """Handle email verification with 6-digit code"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get("email")
        token = data.get("token")  # 6-digit code
        type = data.get("type", "signup")  # signup, email_change, etc.
        
        if not email or not token:
            return jsonify({"error": "Email and verification code are required"}), 400
        
        # Verify the email with Supabase
        response = supabase.auth.verify_otp({
            "email": email,
            "token": token,
            "type": type
        })
        
        if response.user and response.session:
            access_token = response.session.access_token
            
            if not IS_VERCEL:
                logger.info(f"✅ Email verified successfully for {email}")
            
            flask_response = make_response(jsonify({
                "message": "Email verified successfully",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "created_at": response.user.created_at,
                    "last_sign_in_at": response.user.last_sign_in_at
                }
            }), 200)
            
            # Set cookie for session
            flask_response.set_cookie(
                "sb-access-token",
                access_token,
                httponly=True,
                secure=is_production,
                samesite="Lax",
                max_age=3600
            )
            return flask_response
        else:
            return jsonify({"error": "Invalid verification code"}), 400
            
    except Exception as e:
        logger.error(f"❌ Email verification error: {str(e)}")
        return jsonify({"error": "Failed to verify email. Please try again."}), 500

@app.route("/api/verify-callback", methods=["POST"])
def verify_callback():
    """Handle email verification callback from link"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        
        if not access_token or not refresh_token:
            return jsonify({"error": "Access token and refresh token are required"}), 400
        
        # Set the session with the tokens from the verification link
        response = supabase.auth.set_session(access_token, refresh_token)
        
        if response.user and response.session:
            if not IS_VERCEL:
                logger.info(f"✅ Email verification callback successful for {response.user.email}")
            
            flask_response = make_response(jsonify({
                "message": "Email verification successful",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "created_at": response.user.created_at,
                    "last_sign_in_at": response.user.last_sign_in_at
                }
            }), 200)
            
            # Set cookies for session
            flask_response.set_cookie(
                "sb-access-token",
                response.session.access_token,
                httponly=True,
                secure=is_production,
                samesite="Lax",
                max_age=3600
            )
            flask_response.set_cookie(
                "sb-refresh-token",
                response.session.refresh_token,
                httponly=True,
                secure=is_production,
                samesite="Lax",
                max_age=604800  # 7 days
            )
            return flask_response
        else:
            return jsonify({"error": "Invalid verification tokens"}), 400
            
    except Exception as e:
        logger.error(f"❌ Email verification callback error: {str(e)}")
        return jsonify({"error": "Failed to verify email. Please try again."}), 500

@app.route("/api/auth/update-password", methods=["POST"])
def update_password():
    """Handle password update with reset token"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        new_password = data.get("password")
        
        if not access_token or not refresh_token or not new_password:
            return jsonify({"error": "Access token, refresh token, and new password are required"}), 400
        
        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        # Set the session with the tokens from the reset email
        response = supabase.auth.set_session(access_token, refresh_token)
        
        if not response.user:
            # ℹ️ Invalid token is not an error - user's link expired
            if not IS_VERCEL:
                logger.info(f"ℹ️ Invalid or expired reset token attempt")
            return jsonify({"error": "Invalid or expired reset token"}), 401
        
        # Update the user's password
        update_response = supabase.auth.update_user({
            "password": new_password
        })
        
        if update_response.user:
            if not IS_VERCEL:
                logger.info(f"✅ Password updated successfully for user: {update_response.user.email}")
            
            # Create a new session for the user
            flask_response = make_response(jsonify({
                "message": "Password updated successfully",
                "user": {
                    "id": update_response.user.id,
                    "email": update_response.user.email,
                    "created_at": update_response.user.created_at,
                    "last_sign_in_at": update_response.user.last_sign_in_at
                }
            }), 200)
            
            # Set new session cookie
            if response.session and response.session.access_token:
                flask_response.set_cookie(
                    "sb-access-token",
                    response.session.access_token,
                    httponly=True,
                    secure=is_production,
                    samesite="Lax",
                    max_age=3600
                )
            
            return flask_response
        else:
            return jsonify({"error": "Failed to update password"}), 400
            
    except Exception as e:
        logger.error(f"❌ Update password error: {str(e)}")
        return jsonify({"error": "Failed to update password. Please try again."}), 500

@app.route('/api/auth/delete-account', methods=['POST', 'DELETE'])
def delete_account():
    """Handle account deletion"""
    try:
        token = request.cookies.get("sb-access-token")
        if not token:
            return jsonify({"error": "Not logged in"}), 401

        user = supabase.auth.get_user(token)

        if user and user.user:
            delete_response = supabase.auth.admin.delete_user(user.user.id)
            if delete_response:
                response = make_response(jsonify({"message": "Account deleted successfully"}), 200)
                response.set_cookie(
                    "sb-access-token", 
                    "", 
                    expires=0, 
                    httponly=True, 
                    samesite="Lax", 
                    secure=is_production
                )
                if not IS_VERCEL:
                    logger.info(f"✅ Account deleted for user: {user.user.email}")
                return response
            else:
                return jsonify({"error": "Failed to delete account"}), 400
        else:
            return jsonify({"error": "Invalid session"}), 401
            
    except Exception as e:
        logger.error(f"❌ Delete account error: {str(e)}")
        return jsonify({"error": "Failed to delete account. Please try again."}), 500

@app.route("/api/staff-users", methods=["GET"])
def get_staff_users():
    """Fetch all users with staff or admin role"""
    try:
        # Query auth.users table directly using RPC or raw SQL
        # Since we can't use admin API without service role key,
        # we'll use a PostgreSQL function or direct query
        
        # Alternative: Query users via RPC function
        # First, let's try using the admin list_users with proper error handling
        try:
            response = supabase.auth.admin.list_users()
            
            # Filter for staff and admin users
            staff_users = []
            for user in response:
                # Handle both list and object responses
                users_list = response if isinstance(response, list) else getattr(response, 'users', [])
                for user in users_list:
                    user_role = user.user_metadata.get("role", "user") if user.user_metadata else "user"
                    if user_role in ["staff", "admin"]:
                        display_name = user.user_metadata.get("display_name") if user.user_metadata else None
                        first_name = user.user_metadata.get("first_name") if user.user_metadata else None
                        last_name = user.user_metadata.get("last_name") if user.user_metadata else None
                        
                        # Build full name if available
                        if display_name:
                            name = display_name
                        elif first_name and last_name:
                            name = f"{first_name} {last_name}"
                        elif first_name:
                            name = first_name
                        else:
                            name = user.email.split('@')[0]  # Use email username as fallback
                        
                        staff_users.append({
                            "id": user.id,
                            "email": user.email,
                            "name": name,
                            "role": user_role,
                        })
                break
            
            if not IS_VERCEL:
                logger.info(f"✅ Fetched {len(staff_users)} staff users")
            
            return jsonify({"staff_users": staff_users}), 200
            
        except Exception as admin_error:
            # Admin API failed, try alternative method using PostgreSQL RPC
            if not IS_VERCEL:
                logger.warning(f"Admin API failed, using alternative method: {str(admin_error)}")
            
            # For now, return empty list with a note
            # In production, you'd create a PostgreSQL function to query auth.users
            return jsonify({
                "staff_users": [],
                "note": "Admin API requires service role key. Please add staff users manually or use service role key."
            }), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching staff users: {str(e)}")
        return jsonify({"error": f"Failed to fetch staff users: {str(e)}"}), 500

@app.route("/api/classes", methods=["GET"])
def get_classes():
    """Fetch all classes from Supabase"""
    try:
        response = supabase.table("classes").select("*").order("start", desc=False).execute()
        classes = response.data if hasattr(response, 'data') else []
        
        if not IS_VERCEL:
            logger.info(f"✅ Fetched {len(classes)} classes")
        
        return jsonify({"classes": classes}), 200
        
    except Exception as e:
        logger.error(f"❌ Error fetching classes: {str(e)}")
        return jsonify({"error": "Failed to fetch classes"}), 500

@app.route("/api/classes", methods=["POST"])
def create_class():
    """Create a new class (staff only)"""
    try:
        token = request.cookies.get("sb-access-token")
        if not token:
            return jsonify({"error": "Not authenticated"}), 401
        
        # Verify user and check role from secure database table
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            return jsonify({"error": "Invalid token"}), 401
        
        user_role = get_user_role(user.user.id)
        if user_role not in ["staff", "admin"]:
            return jsonify({"error": "Only staff can create classes"}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        required_fields = ["class_name", "class_type", "instructor", "start", "end", "location", "max_participants"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Create class in Supabase
        class_data = {
            "class_name": data.get("class_name"),
            "class_type": data.get("class_type"),
            "instructor": data.get("instructor"),
            "start": data.get("start"),
            "end": data.get("end"),
            "location": data.get("location"),
            "max_participants": data.get("max_participants"),
            "description": data.get("description", ""),
            "participants": data.get("participants", [])
        }
        
        response = supabase.table("classes").insert(class_data).execute()
        created_class = response.data[0] if hasattr(response, 'data') and response.data else class_data
        
        if not IS_VERCEL:
            logger.info(f"✅ Class '{data.get('class_name')}' created successfully")
        
        return jsonify({"class": created_class}), 201
        
    except Exception as e:
        logger.error(f"❌ Error creating class: {str(e)}")
        return jsonify({"error": "Failed to create class"}), 500

@app.route("/api/classes/<class_id>", methods=["PUT"])
def update_class(class_id):
    """Update a class (staff only)"""
    try:
        token = request.cookies.get("sb-access-token")
        if not token:
            return jsonify({"error": "Not authenticated"}), 401
        
        # Verify user and check role from secure database table
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            return jsonify({"error": "Invalid token"}), 401
        
        user_role = get_user_role(user.user.id)
        if user_role not in ["staff", "admin"]:
            return jsonify({"error": "Only staff can edit classes"}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Update class in Supabase
        update_data = {}
        for field in ["class_name", "class_type", "instructor", "start", "end", "location", "max_participants", "description", "participants"]:
            if field in data:
                update_data[field] = data[field]
        
        response = supabase.table("classes").update(update_data).eq("id", class_id).execute()
        updated_class = response.data[0] if hasattr(response, 'data') and response.data else update_data
        
        if not IS_VERCEL:
            logger.info(f"✅ Class {class_id} updated successfully")
        
        return jsonify({"class": updated_class}), 200
        
    except Exception as e:
        logger.error(f"❌ Error updating class: {str(e)}")
        return jsonify({"error": "Failed to update class"}), 500

@app.route("/api/classes/<class_id>", methods=["DELETE"])
def delete_class(class_id):
    """Delete a class (staff only)"""
    try:
        token = request.cookies.get("sb-access-token")
        if not token:
            return jsonify({"error": "Not authenticated"}), 401
        
        # Verify user and check role from secure database table
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            return jsonify({"error": "Invalid token"}), 401
        
        user_role = get_user_role(user.user.id)
        if user_role not in ["staff", "admin"]:
            return jsonify({"error": "Only staff can delete classes"}), 403
        
        # Delete class from Supabase
        response = supabase.table("classes").delete().eq("id", class_id).execute()
        
        if not IS_VERCEL:
            logger.info(f"✅ Class {class_id} deleted successfully")
        
        return jsonify({"message": "Class deleted successfully"}), 200
        
    except Exception as e:
        logger.error(f"❌ Error deleting class: {str(e)}")
        return jsonify({"error": "Failed to delete class"}), 500

# For local development
if __name__ == "__main__":
    app.run(debug=True, port=5328)

# Vercel serverless function handler
app = app
