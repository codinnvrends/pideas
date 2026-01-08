"""
CrewAI Project Generator with Langfuse tracing.
Token tracking is handled by LangfuseGeminiLLM wrapper automatically.
"""
import os
from .agents import ProjectAgents
from .tasks import ProjectTasks


def init_langfuse():
    """Initialize Langfuse client."""
    try:
        from langfuse import get_client
        return get_client()
    except Exception as e:
        print(f"Warning: Langfuse initialization failed: {e}")
        return None


class ProjectGeneratorCrew:
    def __init__(self, output_dir: str, user_id: str = None):
        self.output_dir = output_dir
        self.user_id = user_id
        self.langfuse = init_langfuse()
        
        # Tasks are stateless, so safe to init here
        self.tasks = ProjectTasks()

    def run(self, project_blueprint: str):
        from crewai import Crew, Process
        
        # 4. Kickoff with Langfuse parent span
        if self.langfuse:
            from langfuse import propagate_attributes
            
            with self.langfuse.start_as_current_observation(
                as_type="span",
                name="crewai-code-generation",
            ) as span:
                # Extract IDs for manual propagation
                trace_id = span.trace_id
                parent_obs_id = span.id
                
                # Instantiate Agents with Trace Context
                # This ensures LLM calls are attached to this specific span
                agents = ProjectAgents(
                    user_id=self.user_id, 
                    trace_id=trace_id, 
                    parent_observation_id=parent_obs_id
                )
                
                # 1. Instantiate Agents
                architect = agents.architect_agent()
                tech_lead = agents.tech_lead_agent()
                developer = agents.developer_agent()

                # 2. Instantiate Tasks
                design_task = self.tasks.design_task(architect, project_blueprint)
                spec_task = self.tasks.spec_task(tech_lead, design_task)
                coding_task = self.tasks.coding_task(developer, spec_task, self.output_dir)

                # 3. Create Crew
                crew = Crew(
                    agents=[architect, tech_lead, developer],
                    tasks=[design_task, spec_task, coding_task],
                    verbose=True,
                    process=Process.sequential,
                    max_iter=50
                )

                with propagate_attributes(
                    user_id=self.user_id,
                    session_id=f"crew_{self.user_id}" if self.user_id else None,
                    tags=["crewai", "code-generation"],
                    metadata={"blueprint_length": len(project_blueprint)}
                ):
                    result = crew.kickoff()
                
                span.update_trace(
                    input=project_blueprint[:500],
                    output=str(result)[:500] if result else None,
                )
            
            self.langfuse.flush()
        else:
            # Fallback for no Langfuse
            agents = ProjectAgents(user_id=self.user_id)
            architect = agents.architect_agent()
            tech_lead = agents.tech_lead_agent()
            developer = agents.developer_agent()
            
            design_task = self.tasks.design_task(architect, project_blueprint)
            spec_task = self.tasks.spec_task(tech_lead, design_task)
            coding_task = self.tasks.coding_task(developer, spec_task, self.output_dir)
            
            crew = Crew(
                agents=[architect, tech_lead, developer],
                tasks=[design_task, spec_task, coding_task],
                verbose=True,
                process=Process.sequential,
                max_iter=50
            )
            result = crew.kickoff()
            
        return result

        # 4. Kickoff with Langfuse parent span
        if self.langfuse:
            from langfuse import propagate_attributes
            
            with self.langfuse.start_as_current_observation(
                as_type="span",
                name="crewai-code-generation",
            ) as span:
                with propagate_attributes(
                    user_id=self.user_id,
                    session_id=f"crew_{self.user_id}" if self.user_id else None,
                    tags=["crewai", "code-generation"],
                    metadata={"blueprint_length": len(project_blueprint)}
                ):
                    result = crew.kickoff()
                
                span.update_trace(
                    input=project_blueprint[:500],
                    output=str(result)[:500] if result else None,
                )
            
            self.langfuse.flush()
        else:
            result = crew.kickoff()
            
        return result
