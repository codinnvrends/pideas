from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore
import logging

# Initialize Firebase Admin
initialize_app()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["GET", "POST"]),
    region="us-central1"
)
def generate_project(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Cloud Function to generate a complete project using CrewAI.
    """
    try:
        req_json = req.get_json(silent=True)
        if not req_json:
            return https_fn.Response("Invalid JSON input", status=400)
            
        idea_id = req_json.get("ideaId")
        user_id = req_json.get("userId")
        
        if not idea_id or not user_id:
             return https_fn.Response("Missing ideaId or userId", status=400)
             
        logger.info(f"Received project generation request for idea: {idea_id} by user: {user_id}")
        
        # TODO: Implement CrewAI logic here
        
        return https_fn.Response(f"Project generation started for {idea_id}", status=200)
        
    except Exception as e:
        logger.error(f"Error in generate_project: {str(e)}")
        return https_fn.Response(f"Internal Server Error: {str(e)}", status=500)
