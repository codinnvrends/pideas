import os
import shutil
import tempfile
import datetime
from firebase_functions import https_fn
from firebase_admin import initialize_app, storage
from google.cloud import storage as gcs_storage
import uuid

# Initialize Firebase Admin
initialize_app(options={
    'storageBucket': 'pideas'
})

@https_fn.on_call(memory=2048, timeout_sec=540) # 2GB RAM, 9 mins timeout
def generate_codebase(req: https_fn.CallableRequest):
    """
    Cloud Function to generate a codebase from a project idea using CrewAI.
    """
    from src.crew.main import ProjectGeneratorCrew
    from src.crew.distiller import distill_idea

    try:
        # 1. Parse Input
        data = req.data
        idea = data.get("idea")
        if not idea:
            return {"success": False, "error": "Missing 'idea' field"}
            
        print(f"Received idea: {idea[:100]}...")
        
        # 2. Preparation
        # Create a unique temp directory for this request
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, "project_code")
            os.makedirs(project_dir)
            
            # 3. Distillation
            print("Distilling idea...")
            blueprint = distill_idea(idea)
            print(f"Blueprint generated: {blueprint[:100]}...")
            
            # 4. Run CrewAI
            print("Starting CrewAI...")
            crew = ProjectGeneratorCrew(output_dir=project_dir)
            crew_result = crew.run(blueprint)
            print("CrewAI finished.")
            
            # 5. Zip the result
            print("Zipping output...")
            archive_path = shutil.make_archive(
                base_name=os.path.join(temp_dir, "codebase"),
                format='zip',
                root_dir=project_dir
            )
            
            # 6. Upload to Cloud Storage
            # 6. Upload to Cloud Storage
            storage_client = gcs_storage.Client()
            bucket = storage_client.bucket('pideas-76f25-downloads')
            blob_name = f"generated_codebases/{datetime.datetime.now().isoformat()}_codebase.zip"
            blob = bucket.blob(blob_name)
            
            print(f"Uploading to {blob_name}...")
            blob.upload_from_filename(archive_path)
            
            # 7. Generate Public Download URL
            blob.make_public()
            
            url = blob.public_url
            
            return {
                "success": True, 
                "downloadUrl": url,
                "blueprint": blueprint
            }
            
    except Exception as e:
        print(f"Error in generate_codebase: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
