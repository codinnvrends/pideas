import os
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_project_theory(project_title: str, project_overview: str, tech_stack: str = None) -> str:
    """
    Generates a comprehensive, academic-style theoretical report for a given project idea.
    
    Args:
        project_title: The title of the project.
        project_overview: A description of the project.
        tech_stack: Optional list or string of technologies (e.g., "React, Firebase").
        
    Returns:
        A Markdown-formatted string containing the theoretical report.
    """
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        # Initialize Model (Using Flash for speed/efficiency, as reports can be long)
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0.3, # Low temperature for more academic/formal tone
            max_output_tokens=8192
        )

        template = """
        You are a Senior Computer Science Researcher and Technical Architect.
        Your task is to generate a comprehensive, academic-style theoretical report for the following software project.
        
        Project Title: {project_title}
        Overview: {project_overview}
        Technology Stack: {tech_stack}
        
        The report must be written in a formal, academic tone, suitable for a university final year project report or a technical whitepaper.
        Use standard Markdown formatting.
        
        Structure the report exactly as follows:

        # Theoretical Analysis: {project_title}

        ## 1. Abstract
        Provide a concise executive summary of the project, highlighting the problem addressed, the solution proposed, and the key technologies utilized.

        ## 2. Introduction
        ### 2.1 Problem Statement
        Define the core problem or gap this project intends to fill.
        ### 2.2 Objectives
        List the primary and secondary objectives of the system.
        ### 2.3 Scope
        Define what is included in the project and what is out of scope.

        ## 3. Literature Review & Theoretical Background
        Explain the theoretical concepts and technologies underpinning the project. 
        For example, if it uses AI, explain the relevant model architectures (e.g., Transformers, CNNs). 
        If it's a web app, explain the architectural patterns (e.g., SPA, Serverless, MVC).
        Be specific to the provided tech stack ({tech_stack}).

        ## 4. Methodology & System Design
        ### 4.1 Architectural Pattern
        Describe the high-level architecture (e.g., Microservices, Monolithic, Event-Driven) and justify why it was chosen.
        ### 4.2 Core Algorithms & Logic
        Describe the key algorithms or data flow logic required. (e.g., "The recommendation engine utilizes a collaborative filtering approach...")
        ### 4.3 Data Design
        Briefly describe the data model or storage strategy.

        ## 5. Implementation Analysis
        Discuss the implementation details of critical components. 
        Focus on the "How" and "Why" of the technical choices.

        ## 6. Future Scope & Research Extensions
        Discuss how this project could be extended in the future (e.g., scaling strategies, new AI models, integration with IoT).

        ## 7. References
        Provide a list of 3-5 key references (documentation, whitepapers, or academic concepts) relevant to the tech stack. Format them as a list.
        
        Generate the report now.
        """

        prompt = PromptTemplate(
            template=template,
            input_variables=["project_title", "project_overview", "tech_stack"]
        )

        chain = prompt | llm

        response = chain.invoke({
            "project_title": project_title,
            "project_overview": project_overview,
            "tech_stack": tech_stack or "Standard Modern Web Stack"
        })

        return response.content

    except Exception as e:
        logger.error(f"Error generating project theory: {str(e)}")
        raise e
