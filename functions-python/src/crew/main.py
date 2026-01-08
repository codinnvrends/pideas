import os
from .agents import ProjectAgents
from .tasks import ProjectTasks

# Initialize Langfuse for CrewAI tracing
def init_langfuse_instrumentation():
    """Initialize Langfuse + CrewAI + LangChain instrumentation via OpenInference."""
    try:
        from langfuse import get_client
        from openinference.instrumentation.crewai import CrewAIInstrumentor
        
        # Initialize the Langfuse client (uses env vars)
        langfuse = get_client()
        
        # Instrument CrewAI to capture agent/task operations
        CrewAIInstrumentor().instrument(skip_dep_check=True)
        
        # Also instrument LangChain to capture LLM calls with token usage
        try:
            from openinference.instrumentation.langchain import LangChainInstrumentor
            LangChainInstrumentor().instrument()
        except Exception as e:
            print(f"Warning: LangChain instrumentation failed: {e}")
        
        return langfuse
    except Exception as e:
        print(f"Warning: Langfuse initialization failed: {e}")
        return None


class ProjectGeneratorCrew:
    def __init__(self, output_dir: str, user_id: str = None):
        self.output_dir = output_dir
        self.user_id = user_id
        self.agents = ProjectAgents(user_id=user_id)
        self.tasks = ProjectTasks()
        self.langfuse = init_langfuse_instrumentation()

    def run(self, project_blueprint: str):
        from crewai import Crew, Process
        # 1. Instantiate Agents
        architect = self.agents.architect_agent()
        tech_lead = self.agents.tech_lead_agent()
        developer = self.agents.developer_agent()

        # 2. Instantiate Tasks
        design_task = self.tasks.design_task(architect, project_blueprint)
        spec_task = self.tasks.spec_task(tech_lead, design_task) # Context from design
        coding_task = self.tasks.coding_task(developer, spec_task, self.output_dir) # Context from spec

        # 3. Create Crew
        crew = Crew(
            agents=[architect, tech_lead, developer],
            tasks=[design_task, spec_task, coding_task],
            verbose=True, # High verbosity for logs
            process=Process.sequential,
            max_iter=50  # Increased from default 25 for complex projects
        )

        # 4. Kickoff with Langfuse tracing
        if self.langfuse:
            with self.langfuse.start_as_current_observation(
                as_type="span",
                name="crewai-code-generation",
                metadata={"user_id": self.user_id, "blueprint_length": len(project_blueprint)}
            ):
                result = crew.kickoff()
                self.langfuse.flush()
        else:
            result = crew.kickoff()
            
        return result
