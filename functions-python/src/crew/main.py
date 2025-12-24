import os
from .agents import ProjectAgents
from .tasks import ProjectTasks


class ProjectGeneratorCrew:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        self.agents = ProjectAgents()
        self.tasks = ProjectTasks()

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
            process=Process.sequential
        )

        # 4. Kickoff
        result = crew.kickoff()
        return result
