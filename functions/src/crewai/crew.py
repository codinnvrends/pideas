"""
CrewAI Implementation for Project Generation
Following latest CrewAI patterns and best practices from official documentation
"""
import os
import sys
import zipfile
import tempfile
import shutil
import uuid
from pathlib import Path
from typing import Dict, Any, Optional
import yaml
from datetime import datetime

from crewai import Agent, Task, Crew, Process
from crewai.project import CrewBase, agent, crew, task
from langchain_google_genai import ChatGoogleGenerativeAI
from google.cloud import firestore, storage
from .models import (
    RequirementsDocument, CodebaseOutput, ReviewReport, 
    TestSuiteOutput, DebugReport, FinalDeliverable,
    ProjectGenerationStatus
)

class ProjectGenerationCrew(CrewBase):
    """
    Project Generation Crew following CrewAI latest patterns
    Orchestrates the complete project generation workflow
    """
    
    def __init__(self, project_inputs: Dict[str, Any], **kwargs):
        super().__init__(**kwargs)
        self.project_inputs = project_inputs
        self.generation_id = str(uuid.uuid4())
        self.llm = self._setup_llm()
        
    def _setup_llm(self):
        """Setup Google Gemini LLM following CrewAI patterns"""
        api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required")
            
        return ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=api_key,
            temperature=0.3,
            max_tokens=4000
        )

    @agent
    def requirements_analyst(self) -> Agent:
        """Requirements Analysis Agent using latest CrewAI patterns"""
        config = self._load_agent_config('requirements_analyst')
        return Agent(
            config=config,
            llm=self.llm,
            verbose=True,
            max_iter=3,
            memory=True
        )

    @agent  
    def developer(self) -> Agent:
        """Development Agent for code generation"""
        config = self._load_agent_config('developer')
        return Agent(
            config=config,
            llm=self.llm,
            verbose=True,
            max_iter=5,
            memory=True,
            allow_delegation=False
        )

    @agent
    def reviewer(self) -> Agent:
        """Code Review Agent"""
        config = self._load_agent_config('reviewer')
        return Agent(
            config=config,
            llm=self.llm,
            verbose=True,
            max_iter=3,
            memory=True
        )

    @agent
    def tester(self) -> Agent:
        """Testing Agent for test generation"""
        config = self._load_agent_config('tester')
        return Agent(
            config=config,
            llm=self.llm,
            verbose=True,
            max_iter=3,
            memory=True
        )

    @agent
    def debugger(self) -> Agent:
        """Debug and Fix Agent"""
        config = self._load_agent_config('debugger')
        return Agent(
            config=config,
            llm=self.llm,
            verbose=True,
            max_iter=5,
            memory=True
        )

    @agent
    def delivery_manager(self) -> Agent:
        """Final Delivery Agent"""
        config = self._load_agent_config('delivery_manager')
        return Agent(
            config=config,
            llm=self.llm,
            verbose=True,
            max_iter=3,
            memory=True
        )

    @task
    def requirements_analysis(self) -> Task:
        """Requirements Analysis Task"""
        config = self._load_task_config('requirements_analysis')
        return Task(
            config=config,
            agent=self.requirements_analyst(),
            output_pydantic=RequirementsDocument,
            context=self.project_inputs
        )

    @task
    def code_development(self) -> Task:
        """Code Development Task"""
        config = self._load_task_config('code_development')
        return Task(
            config=config,
            agent=self.developer(),
            output_pydantic=CodebaseOutput,
            context=[self.requirements_analysis()]
        )

    @task
    def code_review(self) -> Task:
        """Code Review Task"""
        config = self._load_task_config('code_review')
        return Task(
            config=config,
            agent=self.reviewer(),
            output_pydantic=ReviewReport,
            context=[self.code_development()]
        )

    @task
    def test_generation(self) -> Task:
        """Test Generation Task"""
        config = self._load_task_config('test_generation')
        return Task(
            config=config,
            agent=self.tester(),
            output_pydantic=TestSuiteOutput,
            context=[self.code_review()]
        )

    @task
    def debug_and_fix(self) -> Task:
        """Debug and Fix Task"""
        config = self._load_task_config('debug_and_fix')
        return Task(
            config=config,
            agent=self.debugger(),
            output_pydantic=DebugReport,
            context=[self.test_generation()]
        )

    @task
    def final_delivery(self) -> Task:
        """Final Delivery Task"""
        config = self._load_task_config('final_delivery')
        return Task(
            config=config,
            agent=self.delivery_manager(),
            output_pydantic=FinalDeliverable,
            context=[self.debug_and_fix()],
            output_file=f"output/{self.project_inputs.get('project_name', 'project')}_complete_project.zip"
        )

    @crew
    def crew(self) -> Crew:
        """Create the crew with sequential process following CrewAI patterns"""
        return Crew(
            agents=[
                self.requirements_analyst(),
                self.developer(), 
                self.reviewer(),
                self.tester(),
                self.debugger(),
                self.delivery_manager()
            ],
            tasks=[
                self.requirements_analysis(),
                self.code_development(),
                self.code_review(), 
                self.test_generation(),
                self.debug_and_fix(),
                self.final_delivery()
            ],
            process=Process.sequential,
            verbose=True,
            memory=True,
            max_rpm=10,
            full_output=True,
            step_callback=self._step_callback
        )
        
    def _load_agent_config(self, agent_name: str) -> Dict[str, Any]:
        """Load agent configuration from YAML"""
        config_path = Path(__file__).parent / "config" / "agents.yaml"
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        
        agent_config = config.get(agent_name, {})
        # Format config with project inputs
        for key, value in agent_config.items():
            if isinstance(value, str):
                agent_config[key] = value.format(**self.project_inputs)
        
        return agent_config
    
    def _load_task_config(self, task_name: str) -> Dict[str, Any]:
        """Load task configuration from YAML"""
        config_path = Path(__file__).parent / "config" / "tasks.yaml"
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        
        task_config = config.get(task_name, {})
        # Format config with project inputs
        for key, value in task_config.items():
            if isinstance(value, str):
                task_config[key] = value.format(**self.project_inputs)
        
        return task_config
    
    def _step_callback(self, step):
        """Callback to track progress and update status"""
        # This will be used to update Firebase with progress
        print(f"Step completed: {step}")
        # TODO: Update Firebase document with progress
        
    def kickoff(self, inputs: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Start the crew execution with proper input handling
        Following latest CrewAI kickoff patterns
        """
        try:
            # Merge inputs with project inputs
            if inputs:
                merged_inputs = {**self.project_inputs, **inputs}
            else:
                merged_inputs = self.project_inputs
            
            # Execute the crew
            result = self.crew().kickoff(inputs=merged_inputs)
            
            return {
                "success": True,
                "generation_id": self.generation_id,
                "result": result,
                "status": "completed"
            }
            
        except Exception as e:
            return {
                "success": False,
                "generation_id": self.generation_id,
                "error": str(e),
                "status": "failed"
            }

class ProjectGenerationManager:
    """
    Manager class for handling multiple project generations
    Provides interface between Firebase Functions and CrewAI
    """
    
    def __init__(self, firestore_client=None):
        self.firestore_client = firestore_client
        self.active_generations = {}
    
    def start_generation(self, project_inputs: Dict[str, Any], user_id: str, idea_id: str) -> str:
        """Start a new project generation"""
        
        # Create generation tracking document
        generation_id = str(uuid.uuid4())
        
        generation_status = ProjectGenerationStatus(
            generation_id=generation_id,
            user_id=user_id,
            idea_id=idea_id,
            project_name=project_inputs.get('project_name', 'Untitled Project'),
            status="pending",
            current_stage="initialization",
            progress_percentage=0,
            started_at=datetime.now().isoformat(),
            estimated_completion_time=self._estimate_completion_time(project_inputs)
        )
        
        # Save to Firestore
        if self.firestore_client:
            self.firestore_client.collection('projectGenerations').document(generation_id).set(
                generation_status.dict()
            )
        
        # Create and start crew
        crew = ProjectGenerationCrew(project_inputs)
        self.active_generations[generation_id] = crew
        
        # Start generation asynchronously
        # In a real implementation, this would be run in a background task/queue
        result = crew.kickoff()
        
        # Process the result and create downloadable files
        download_url = None
        storage_path = None
        
        if result["success"]:
            try:
                # Create ZIP file from generated project
                project_data = {
                    'project_name': project_inputs.get('project_name', 'Generated Project'),
                    'overview': result.get('result', {}).get('output', 'AI-generated project'),
                    'requirements': project_inputs.get('user_preferences', []),
                    'tech_stack': project_inputs.get('user_preferences', []),
                    'code_files': result.get('result', {}).get('code_files', {}),
                    'test_files': result.get('result', {}).get('test_files', {})
                }
                
                zip_path = self._create_project_zip(project_data, project_inputs.get('project_name', 'Generated Project'))
                
                # Upload to Firebase Storage
                download_url, storage_path = self._upload_to_firebase_storage(
                    zip_path, 
                    generation_id, 
                    project_inputs.get('project_name', 'Generated Project')
                )
                
                # Clean up local ZIP file
                os.remove(zip_path)
                
            except Exception as e:
                print(f"Error creating/uploading project files: {e}")
                # Continue with basic result even if file creation fails
        
        # Update final status
        final_deliverable = None
        if download_url:
            final_deliverable = {
                'projectTitle': project_inputs.get('project_name', 'Generated Project'),
                'downloadUrl': download_url,
                'storagePath': storage_path,
                'fileSize': 'Unknown',
                'createdAt': datetime.now().isoformat()
            }
        
        final_status = {
            **generation_status.dict(),
            "status": result["status"],
            "progress_percentage": 100 if result["success"] else 0,
            "completed_at": datetime.now().isoformat(),
            "result": {
                "finalDeliverable": final_deliverable,
                "output": result.get("result", {}).get("output", "Generation completed")
            },
            "error_message": result.get("error")
        }
        
        if self.firestore_client:
            self.firestore_client.collection('projectGenerations').document(generation_id).update(final_status)
        
        return generation_id
    
    def get_generation_status(self, generation_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a project generation"""
        if self.firestore_client:
            doc = self.firestore_client.collection('projectGenerations').document(generation_id).get()
            if doc.exists:
                return doc.to_dict()
        return None
    
    def _create_project_zip(self, project_data: Dict[str, Any], project_name: str) -> str:
        """Create a ZIP file from the generated project data"""
        # Create temporary directory for project files
        temp_dir = tempfile.mkdtemp()
        project_dir = Path(temp_dir) / project_name.replace(' ', '_').lower()
        project_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Extract and write project files from the generated content
            self._write_project_files(project_data, project_dir)
            
            # Create ZIP file
            zip_path = f"{temp_dir}/{project_name.replace(' ', '_').lower()}.zip"
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(project_dir):
                    for file in files:
                        file_path = Path(root) / file
                        arcname = file_path.relative_to(project_dir)
                        zipf.write(file_path, arcname)
            
            return zip_path
            
        except Exception as e:
            # Clean up temp directory on error
            shutil.rmtree(temp_dir, ignore_errors=True)
            raise e
    
    def _write_project_files(self, project_data: Dict[str, Any], project_dir: Path):
        """Write project files based on generated content"""
        try:
            # Create basic project structure
            (project_dir / "src").mkdir(exist_ok=True)
            (project_dir / "docs").mkdir(exist_ok=True)
            (project_dir / "tests").mkdir(exist_ok=True)
            
            # Write README.md
            readme_content = f"""# {project_data.get('project_name', 'Generated Project')}

## Overview
{project_data.get('overview', 'AI-generated project')}

## Requirements
{chr(10).join(f"- {req}" for req in project_data.get('requirements', ['No specific requirements']))}

## Installation
```bash
# Add installation instructions here
```

## Usage
```bash
# Add usage instructions here
```

## Generated Code
This project was generated using CrewAI multi-agent system.
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
            
            with open(project_dir / "README.md", 'w', encoding='utf-8') as f:
                f.write(readme_content)
            
            # Write main code files if available
            if 'code_files' in project_data:
                for filename, content in project_data['code_files'].items():
                    file_path = project_dir / "src" / filename
                    file_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
            
            # Write test files if available
            if 'test_files' in project_data:
                for filename, content in project_data['test_files'].items():
                    file_path = project_dir / "tests" / filename
                    file_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
            
            # Write requirements.txt or package.json based on technology
            tech_stack = project_data.get('tech_stack', [])
            if any('python' in tech.lower() for tech in tech_stack):
                with open(project_dir / "requirements.txt", 'w') as f:
                    f.write("# Generated requirements\nrequests>=2.25.1\n")
            elif any('javascript' in tech.lower() or 'node' in tech.lower() for tech in tech_stack):
                package_json = {
                    "name": project_data.get('project_name', 'generated-project').lower().replace(' ', '-'),
                    "version": "1.0.0",
                    "description": project_data.get('overview', 'AI-generated project'),
                    "main": "src/index.js",
                    "scripts": {
                        "start": "node src/index.js",
                        "test": "npm test"
                    },
                    "dependencies": {},
                    "author": "CrewAI Generator",
                    "license": "MIT"
                }
                
                import json
                with open(project_dir / "package.json", 'w') as f:
                    json.dump(package_json, f, indent=2)
                    
        except Exception as e:
            print(f"Error writing project files: {e}")
            # Write minimal files to ensure ZIP creation doesn't fail
            with open(project_dir / "README.md", 'w') as f:
                f.write(f"# {project_data.get('project_name', 'Generated Project')}\n\nGenerated project files.")
    
    def _upload_to_firebase_storage(self, zip_path: str, generation_id: str, project_name: str) -> tuple[str, str]:
        """Upload ZIP file to Firebase Storage and return download URL and storage path"""
        try:
            # Initialize Firebase Storage client
            storage_client = storage.Client()
            bucket = storage_client.bucket()  # Uses default bucket
            
            # Create storage path
            sanitized_name = project_name.replace(' ', '_').lower()
            storage_path = f"generated_projects/{generation_id}/{sanitized_name}.zip"
            
            # Upload file
            blob = bucket.blob(storage_path)
            with open(zip_path, 'rb') as zip_file:
                blob.upload_from_file(zip_file, content_type='application/zip')
            
            # Make the blob publicly readable
            blob.make_public()
            
            # Get public URL
            download_url = blob.public_url
            
            return download_url, storage_path
            
        except Exception as e:
            print(f"Error uploading to Firebase Storage: {e}")
            raise e
    
    def _estimate_completion_time(self, project_inputs: Dict[str, Any]) -> str:
        """Estimate completion time based on project complexity"""
        # Simple estimation logic - can be made more sophisticated
        complexity = project_inputs.get('user_skill_level', 'intermediate')
        base_minutes = {
            'beginner': 15,
            'intermediate': 25, 
            'advanced': 35
        }
        
        estimated_minutes = base_minutes.get(complexity, 25)
        completion_time = datetime.now().timestamp() + (estimated_minutes * 60)
        return datetime.fromtimestamp(completion_time).isoformat()
