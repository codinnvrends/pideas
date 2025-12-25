import os
import shutil
import tempfile
import datetime
import json
from firebase_functions import https_fn
from firebase_admin import initialize_app, storage, firestore
from google.cloud import storage as gcs_storage
import uuid

# Initialize Firebase Admin
initialize_app(options={
    'storageBucket': 'pideas'
})

def update_operation_status(op_id, status, message=None):
    if not op_id:
        return
    db = firestore.client()
    doc_ref = db.collection('operations').document(op_id)
    data = {
        'status': status,
        'updatedAt': firestore.SERVER_TIMESTAMP
    }
    if message:
        doc_ref.set({
            'logs': firestore.ArrayUnion([{
                'message': message,
                'timestamp': datetime.datetime.now().isoformat()
            }])
        }, merge=True)
    doc_ref.set(data, merge=True)

def generate_file_tree(start_path):
    tree = []
    for item in os.listdir(start_path):
        item_path = os.path.join(start_path, item)
        node = {
            'name': item,
            'path': os.path.relpath(item_path, start_path),
        }
        
        if os.path.isfile(item_path):
            node['type'] = 'file'
            # Read content for preview (limit size/extensions)
            if item.endswith(('.py', '.js', '.md', '.json', '.html', '.css', '.txt', '.yml', '.yaml')):
                try:
                    with open(item_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if len(content) < 50000: # 50KB limit per file for preview
                            node['content'] = content
                        else:
                            node['content'] = "(File too large for preview)"
                except:
                    node['content'] = "(Binary or unreadable)"
            else:
                 node['content'] = "(Binary file)"
        else:
            node['type'] = 'directory'
            node['children'] = generate_file_tree(item_path)
            
        tree.append(node)
    return tree

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
        operation_id = data.get("operationId")
        
        if not idea:
            return {"success": False, "error": "Missing 'idea' field"}
            
        print(f"Received idea: {idea[:100]}...")
        update_operation_status(operation_id, 'STARTING', f"Received request for: {idea[:50]}...")
        
        # 2. Preparation
        # Create a unique temp directory for this request
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, "project_code")
            os.makedirs(project_dir)
            
            # 3. Distillation
            print("Distilling idea...")
            update_operation_status(operation_id, 'DISTILLING', "Analyzing requirements and distilling blueprint...")
            blueprint = distill_idea(idea)
            print(f"Blueprint generated: {blueprint[:100]}...")
            update_operation_status(operation_id, 'AI_GENERATION', "Blueprint created. AI Crew starting...")
            
            # 4. Run CrewAI
            print("Starting CrewAI...")
            # We can't easily stream logs from inside CrewAI yet without custom callbacks, 
            # so we just update status before and after major chunks if possible.
            crew = ProjectGeneratorCrew(output_dir=project_dir)
            crew_result = crew.run(blueprint)
            print("CrewAI finished.")
            update_operation_status(operation_id, 'PROCESSING', "Code generation complete. Preparing files...")
            
            # 5. Zip the result
            print("Zipping output...")
            archive_path = shutil.make_archive(
                base_name=os.path.join(temp_dir, "codebase"),
                format='zip',
                root_dir=project_dir
            )
            
            # 5b. Generate File Tree JSON for Preview
            file_tree = generate_file_tree(project_dir)
            json_preview_path = os.path.join(temp_dir, "preview.json")
            with open(json_preview_path, 'w', encoding='utf-8') as f:
                json.dump(file_tree, f)
            
            # 6. Upload to Cloud Storage
            print("Uploading to Cloud Storage...")
            update_operation_status(operation_id, 'UPLOADING', "Uploading assets...")
            
            storage_client = gcs_storage.Client()
            bucket = storage_client.bucket('pideas-76f25-downloads')
            
            # Upload Zip
            timestamp = datetime.datetime.now().isoformat()
            zip_blob_name = f"generated_codebases/{timestamp}_{uuid.uuid4()}_codebase.zip"
            zip_blob = bucket.blob(zip_blob_name)
            zip_blob.upload_from_filename(archive_path)
            zip_blob.make_public()
            
            # Upload JSON Preview
            json_blob_name = f"generated_codebases/{timestamp}_{uuid.uuid4()}_preview.json"
            json_blob = bucket.blob(json_blob_name)
            json_blob.upload_from_filename(json_preview_path)
            json_blob.make_public()
            
            update_operation_status(operation_id, 'COMPLETED', "Ready for download.")
            
            return {
                "success": True, 
                "downloadUrl": zip_blob.public_url,
                "previewUrl": json_blob.public_url,
                "blueprint": blueprint
            }
            
    except Exception as e:
        print(f"Error in generate_codebase: {str(e)}")
        if operation_id:
             update_operation_status(operation_id, 'ERROR', f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
