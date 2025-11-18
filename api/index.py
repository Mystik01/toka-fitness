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
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

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

# Middleware to detect browser requests and redirect
@app.before_request
def redirect_browser_requests():
    """Redirect browser requests to frontend, except for /api/python test endpoint"""
    # Skip for /api/python test endpoint
    if request.path == '/api/python':
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
            
            # ✅ Set cookie for session
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
    
@app.route("/api/me", methods=["GET"])
def get_me():
    try:
        token = request.cookies.get("sb-access-token")
        if not token:
            return jsonify({"error": "Not logged in"}), 401

        user = supabase.auth.get_user(token)

        if user and user.user:
            return jsonify({
                "id": user.user.id,
                "email": user.user.email,
                "created_at": user.user.created_at,
                "last_sign_in_at": user.user.last_sign_in_at
            }), 200
        else:
            return jsonify({"error": "Invalid session"}), 401
            
    except Exception as e:
        logger.error(f"❌ Get user error: {str(e)}")
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
            
            # Set cookie for session
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

# For local development
if __name__ == "__main__":
    app.run(debug=True, port=5328)

# Vercel serverless function handler
app = app
