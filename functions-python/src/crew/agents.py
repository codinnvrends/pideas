"""
Project agents for CrewAI code generation.
Uses LangfuseGeminiLLM wrapper for automatic token tracking.
"""
from .langfuse_llm import get_langfuse_gemini_model


class ProjectAgents:
    def __init__(self, user_id: str = None, trace_id: str = None, parent_observation_id: str = None):
        self.user_id = user_id
        # Use custom LLM wrapper that reports to Langfuse automatically
        self.llm = get_langfuse_gemini_model(trace_id=trace_id, parent_observation_id=parent_observation_id)

    def architect_agent(self):
        from crewai import Agent
        return Agent(
            role='Senior Solutions Architect',
            goal='Design the complete file structure and technical stack for the project.',
            backstory="""You are an expert software architect with decades of experience building scalable applications. 
            You excel at choosing the right technologies and structuring complex projects into manageable components.
            Your job is to look at a project idea and create a perfect blueprint for it.""",
            allow_delegation=False,
            verbose=True,
            llm=self.llm
        )

    def tech_lead_agent(self):
        from crewai import Agent
        return Agent(
            role='Technical Lead',
            goal='Create detailed requirements and specific implementation plans for each file.',
            backstory="""You are a pragmatic engineering manager. You take high-level architectural designs and break them down 
            into specific, actionable tasks for your developers. You know standard libraries inside out and always define clean APIs.""",
            allow_delegation=False,
            verbose=True,
            llm=self.llm
        )

    def developer_agent(self):
        from crewai import Agent
        from .tools import file_tool
        return Agent(
            role='Senior Full Stack Developer',
            goal='Write clean, efficient, and bug-free code based on specifications.',
            backstory="""You are a coding wizard. You can write code in any language (Python, JavaScript, React, etc.) effortlessly. 
            You follow best practices, write comments, and ensure your code is production-ready.""",
            allow_delegation=False,
            verbose=True,
            tools=[file_tool],
            llm=self.llm
        )

