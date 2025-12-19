# CrewAI Integration Plan: Hybrid Architecture

## 📋 Context & Status
- **Current Backend**: Node.js 20 (Firebase Functions Gen 2)
  - Handles: Auth, Database, Basic Idea Generation (Genkit/Gemini).
- **Target Feature**: "Generate Complete Project" (CrewAI Multi-Agent System).
- **Challenge**: CrewAI is a Python-native framework. Running it in Node.js is not feasible.
- **Solution**: **Hybrid Architecture**. Deploy a parallel Python backend solely for the Agentic workflows.

## 🏗️ Architecture Design

### System Overview
```mermaid
graph TD
    User[Web Client (React)]
    
    subgraph "Firebase Project"
        NodeFunc[Functions: pideas-core (Node.js)]
        PyFunc[Functions: pideas-agents (Python)]
        Firestore[(Firestore)]
        Storage[(Storage)]
    end
    
    User --"Generate Idea"--> NodeFunc
    User --"Generate CODEBASE"--> PyFunc
    
    NodeFunc --"Read/Write"--> Firestore
    PyFunc --"Read Profile"--> Firestore
    PyFunc --"Upload ZIP"--> Storage
    
    PyFunc --"CrewAI Agents"--> Gemini[Gemini API]
```

### Directory Structure
```text
/
├── functions/               # EXISTING: Node.js Backend
│   ├── src/index.ts
│   └── package.json
│
├── functions-python/        # NEW: Python Backend (CrewAI)
│   ├── main.py              # Entry point
│   ├── requirements.txt     # Python deps (crewai, etc.)
│   └── src/
│       ├── agents/          # Agent Definitions
│       └── tasks/           # Task Definitions
│
└── firebase.json            # Configured for codebase support
```

## 📋 Implementation Plan

### Phase 1: Infrastructure Setup (Hybrid)
1.  **Configure `firebase.json` for Multi-Codebase**:
    - Defines `functions` (default) as Node.js.
    - Defines `functions-python` as Python 3.11+.
    - Update `firestore.rules` if necessary.
2.  **Initialize Python Environment**:
    - Create `functions-python/` directory.
    - Set up `venv` and `requirements.txt`.
    - Install `crewai`, `firebase-functions`, `firebase-admin`.

### Phase 2: CrewAI Agent Development (Python)
Develop the agent swarm in `functions-python/src/`:
1.  **Agents**:
    - `RequirementsAnalyst`: Refines the unique project idea into specs.
    - `TechLead`: Plans the directory structure.
    - `FullStackDev`: Writes the code.
    - `QAEngineer`: Reviews code (mock execution).
2.  **Workflow**:
    - Build a sequential Crew that takes the `ideaId` from Firestore.
    - Generates files in a temporary directory.
    - Zips the result.

### Phase 3: Integration
1.  **API Endpoint**:
    - Expose `generateCompleteProject` HTTPS Callable in Python.
2.  **Data Handoff**:
    - Frontend calls Python endpoint with `ideaId`.
    - Python function fetches Idea Context from Firestore.
3.  **Delivery**:
    - Python function uploads generated ZIP to Firebase Storage.
    - Returns `downloadUrl` to Frontend.

### Phase 4: Frontend Update
1.  Add specific button: "Generate Full Codebase (Beta)".
2.  Handle long-running request (Progress polling or storage trigger).

## ⚠️ Key Considerations
- **Cold Starts**: Python functions may lag on first hit.
- **Timeouts**: CrewAI runs can take minutes.
  - *Strategy*: Use GCP Cloud Tasks or increase timeout to max (60m for Gen 2).
  - *Better Strategy*: Return "Job ID" immediately, process in background, frontend polls Firestore for status.
