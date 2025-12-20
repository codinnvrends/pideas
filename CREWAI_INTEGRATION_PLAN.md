# CrewAI Integration Plan: End-to-End Code Generation

## Goal
Enable users to generate a complete, downloadable codebase for their selected project idea using a multi-agent AI system (CrewAI).

## Architecture

### Backend: Python Cloud Functions (Gen 2)
We will leverage the existing `functions-python` environment.
- **Runtime**: Python 3.11+
- **Framework**: CrewAI, LangChain, Firebase Admin
- **AI Model**: Google Gemini 1.5 Pro (via Vertex AI or Google AI Studio)

### Workflow
1.  **Trigger**: User clicks "Generate Codebase" in React Frontend.
2.  **Input**: Frontend sends `ProjectIdea` object (title, description, tech stack, difficulty).
3.  **Preprocessing (Distillation)**:
    -   **Goal**: Convert verbose, human-friendly idea content into a strict `TechnicalBlueprint` for AI consumption.
    -   **Action**: Call Gemini LLM to strip marketing fluff/explanations and extract:
        -   `core_features` (List[str])
        -   `tech_stack` (JSON: frontend, backend, database)
        -   `data_models` (List[str])
        -   `project_structure_hint` (str)
4.  **Processing (CrewAI)**:
    -   **Input**: The distilled `TechnicalBlueprint`.
    -   **Agents** collaborate to design the folder structure and write code for every file.
    -   Files are written to valid paths in the `/tmp` directory of the Cloud Function instance.
5.  **Packaging**: The system zips the generated directory.
6.  **Delivery**:
    -   Zip file uploaded to Firebase Cloud Storage bucket.
    -   Signed URL (valid for 1 hour) returned to Frontend.
7.  **Output**: User's browser downloads the zip file.

## CrewAI Agents & Tasks

### 1. The Architect (Agent)
-   **Role**: Senior Solutions Architect.
-   **Goal**: Design the complete file structure and technical stack.
-   **Task**: `DesignTask`
    -   Input: Project Idea.
    -   Output: A detailed JSON or list of file paths and their intended purpose/contents.

### 2. The Tech Lead (Agent)
-   **Role**: Engineering Manager.
-   **Goal**: Create detailed requirements and specific implementation plans for each file.
-   **Task**: `SpecificationTask`
    -   Input: Architect's file structure.
    -   Output: Detailed prompts/instructions for the Developer agent for *each* file.

### 3. The Developer (Agent)
-   **Role**: Senior Full Stack Engineer.
-   **Goal**: Write the actual code.
-   **Task**: `ImplementationTask`
    -   Input: Tech Lead's specs.
    -   Output: Complete code content for each file.
    -   *Note*: This might need to be iterated or parallelized for large projects.

### 4. The QA Engineer (Agent) (Optional/V2)
-   **Role**: Quality Assurance.
-   **Goal**: Review code for syntax errors and requirement matching.

## Implementation Steps

### Phase 1: Python Backend Setup
1.  Update `functions-python/requirements.txt`:
    -   Add `crewai`, `crewai-tools`, `langchain-google-genai`, `firebase-admin`.
2.  Create `src/crew/agents.py`: Define the agent classes.
3.  Create `src/crew/tasks.py`: Define the tasks.
4.  Create `src/crew/main.py`: Main entry point class `ProjectGeneratorCrew`.
5.  Create `main.py` (Cloud Function entry point):
    -   expose generic `generate_codebase` HTTPS callable function.
    -   Handle zip and upload logic.

### Phase 2: Frontend Integration
1.  Add `GenerateCodebaseButton` component.
2.  Add loading UI (Progress bar or "Agents at work" spinner).
3.  Handle the response (trigger browser download of the zip URL).

## Technical Considerations
-   **Timeouts**: Cloud Functions have a max timeout (usually 60m for Gen 2). CrewAI runs can be long. We must ensure the function verifies timeout settings (set to at least 5-10 mins).
-   **Memory**: CrewAI agents keep history. We might need a machine with 2GB+ RAM.
-   **Concurrency**: Ensure unique temp directories per request to avoid collisions.
