"""
Pydantic models for CrewAI structured outputs
Following latest CrewAI patterns for structured data handling
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum

class PriorityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TechStack(str, Enum):
    REACT = "react"
    NEXTJS = "nextjs"
    NODEJS = "nodejs"
    PYTHON_FLASK = "python-flask"
    PYTHON_FASTAPI = "python-fastapi"
    VUE = "vue"
    ANGULAR = "angular"
    DJANGO = "django"
    EXPRESS = "express"
    VANILLA_JS = "vanilla-js"

class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class Feature(BaseModel):
    name: str = Field(..., description="Feature name")
    description: str = Field(..., description="Detailed feature description")
    priority: PriorityLevel = Field(..., description="Feature priority level")
    estimated_hours: int = Field(..., description="Estimated development hours")
    dependencies: List[str] = Field(default=[], description="List of dependent features")

class TechStackRecommendation(BaseModel):
    primary_stack: TechStack = Field(..., description="Primary technology stack")
    database: str = Field(..., description="Recommended database technology")
    additional_tools: List[str] = Field(default=[], description="Additional tools and libraries")
    justification: str = Field(..., description="Reasoning for technology choices")

class RequirementsDocument(BaseModel):
    project_name: str = Field(..., description="Project name")
    project_overview: str = Field(..., description="High-level project description")
    objectives: List[str] = Field(..., description="Project objectives and goals")
    tech_stack: TechStackRecommendation = Field(..., description="Technology stack recommendation")
    features: List[Feature] = Field(..., description="Detailed feature breakdown")
    architecture_description: str = Field(..., description="Technical architecture overview")
    estimated_timeline_weeks: int = Field(..., description="Estimated development timeline in weeks")
    dependencies: List[str] = Field(default=[], description="External dependencies and requirements")
    deployment_requirements: List[str] = Field(default=[], description="Deployment and hosting requirements")

class FileContent(BaseModel):
    filename: str = Field(..., description="File name with extension")
    filepath: str = Field(..., description="Full file path relative to project root")
    content: str = Field(..., description="Complete file content")
    file_type: str = Field(..., description="File type/category (source, config, docs, etc.)")

class ProjectStructure(BaseModel):
    root_directory: str = Field(..., description="Root directory name")
    directories: List[str] = Field(..., description="List of all directories in the project")
    files: List[FileContent] = Field(..., description="All project files with content")
    entry_point: str = Field(..., description="Main entry point file")
    
class CodebaseOutput(BaseModel):
    project_structure: ProjectStructure = Field(..., description="Complete project structure")
    setup_commands: List[str] = Field(..., description="Commands to setup the project")
    run_commands: List[str] = Field(..., description="Commands to run the project")
    build_commands: List[str] = Field(default=[], description="Commands to build the project")
    total_files: int = Field(..., description="Total number of files created")

class IssueReport(BaseModel):
    severity: str = Field(..., description="Issue severity (critical, high, medium, low)")
    category: str = Field(..., description="Issue category (security, performance, quality, etc.)")
    description: str = Field(..., description="Detailed issue description")
    location: str = Field(..., description="File and line where issue was found")
    recommendation: str = Field(..., description="Recommended fix or improvement")
    fixed: bool = Field(default=False, description="Whether the issue was automatically fixed")

class ReviewReport(BaseModel):
    overall_quality_score: int = Field(..., ge=0, le=100, description="Overall code quality score (0-100)")
    security_score: int = Field(..., ge=0, le=100, description="Security assessment score (0-100)")
    performance_score: int = Field(..., ge=0, le=100, description="Performance optimization score (0-100)")
    maintainability_score: int = Field(..., ge=0, le=100, description="Code maintainability score (0-100)")
    issues_found: List[IssueReport] = Field(default=[], description="List of identified issues")
    improvements_made: List[str] = Field(default=[], description="List of improvements implemented")
    compliance_status: bool = Field(..., description="Whether code meets coding standards")
    recommendations: List[str] = Field(default=[], description="Additional recommendations for improvement")

class TestCase(BaseModel):
    test_name: str = Field(..., description="Test case name")
    test_type: str = Field(..., description="Test type (unit, integration, e2e)")
    description: str = Field(..., description="Test case description")
    file_path: str = Field(..., description="Test file path")
    coverage_percentage: Optional[float] = Field(None, description="Code coverage percentage")

class TestSuiteOutput(BaseModel):
    test_cases: List[TestCase] = Field(..., description="List of all test cases")
    test_files: List[FileContent] = Field(..., description="Test files with content")
    test_config: List[FileContent] = Field(default=[], description="Test configuration files")
    coverage_report: Dict[str, float] = Field(default={}, description="Coverage report by file")
    total_tests: int = Field(..., description="Total number of test cases")
    setup_instructions: List[str] = Field(..., description="Test setup instructions")
    run_instructions: List[str] = Field(..., description="Instructions to run tests")

class BugFix(BaseModel):
    bug_description: str = Field(..., description="Description of the bug")
    root_cause: str = Field(..., description="Root cause analysis")
    fix_description: str = Field(..., description="Description of the fix applied")
    files_modified: List[str] = Field(..., description="List of files modified for the fix")
    test_results: str = Field(..., description="Test results after fix")

class DebugReport(BaseModel):
    bugs_found: int = Field(..., description="Total number of bugs found")
    bugs_fixed: int = Field(..., description="Total number of bugs fixed")
    bug_fixes: List[BugFix] = Field(default=[], description="Detailed bug fixes")
    performance_optimizations: List[str] = Field(default=[], description="Performance optimizations applied")
    final_test_status: str = Field(..., description="Final test execution status")
    deployment_ready: bool = Field(..., description="Whether the code is ready for deployment")
    remaining_issues: List[str] = Field(default=[], description="Any remaining unresolved issues")

class DocumentationFile(BaseModel):
    filename: str = Field(..., description="Documentation file name")
    content: str = Field(..., description="Documentation content")
    doc_type: str = Field(..., description="Type of documentation (readme, api, user guide, etc.)")

class FinalDeliverable(BaseModel):
    project_name: str = Field(..., description="Final project name")
    version: str = Field(default="1.0.0", description="Project version")
    description: str = Field(..., description="Project description")
    complete_files: List[FileContent] = Field(..., description="All final project files")
    documentation: List[DocumentationFile] = Field(..., description="All documentation files")
    setup_guide: str = Field(..., description="Complete setup and installation guide")
    deployment_guide: str = Field(..., description="Deployment instructions")
    user_guide: str = Field(..., description="User guide and feature documentation")
    api_documentation: Optional[str] = Field(None, description="API documentation if applicable")
    zip_filename: str = Field(..., description="Generated ZIP file name")
    download_size_mb: float = Field(..., description="Estimated download size in MB")
    total_files_count: int = Field(..., description="Total number of files in deliverable")

class ProjectGenerationStatus(BaseModel):
    """Status model for tracking project generation progress"""
    generation_id: str = Field(..., description="Unique generation ID")
    user_id: str = Field(..., description="User ID who initiated generation")
    idea_id: str = Field(..., description="Original idea ID")
    project_name: str = Field(..., description="Generated project name")
    status: str = Field(..., description="Current status (pending, in-progress, completed, failed)")
    current_stage: str = Field(..., description="Current stage of generation")
    progress_percentage: int = Field(default=0, ge=0, le=100, description="Progress percentage")
    started_at: str = Field(..., description="Generation start timestamp")
    completed_at: Optional[str] = Field(None, description="Generation completion timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    download_url: Optional[str] = Field(None, description="Download URL when completed")
    estimated_completion_time: Optional[str] = Field(None, description="Estimated completion time")
