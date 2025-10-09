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
    "https://your-custom-domain.com"  # Replace with your actual domain if you have one
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

@app.route("/api/python")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/api/login", methods=["POST"])
def login():
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
            return jsonify({"error": "Authentication failed"}), 401

    except Exception as e:
        # ❌ THIS is a real error (server/network issue, not user mistake)
        logger.error(f"❌ Login error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/register", methods=["POST"])
def register():
    """Handle user registration with email and password"""
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
            "password": password
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
        logger.error(f"❌ Registration error: {str(e)}")
        return make_response(jsonify({"error": str(e)}), 500)

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
                "redirect_to": "http://localhost:3001/auth/reset-password"
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

@app.route("/api/update-password", methods=["POST"])
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

# For local development
if __name__ == "__main__":
    app.run(debug=True, port=5328)

# Vercel serverless function handler
app = app
