import os

def distill_idea(project_idea_raw: str, user_id: str = None) -> str:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import PromptTemplate
    from langchain_core.messages import HumanMessage

    """
    Takes a raw, verbose project idea and converts it into a strict Technical Blueprint.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")
    
    # Langfuse removed for stability
    langfuse = None
        
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.2,
        google_api_key=api_key
    )
    
    prompt_template = """You are a Technical Product Manager. Your goal is to convert a user's potentially vague or verbose project idea into a strict Technical Blueprint for a development team.
    
    User's Idea:
    {idea}
    
    Output a structured Technical Blueprint containing ONLY:
    1. Project Title
    2. Core Features (Bullet points of functional requirements)
    3. Tech Stack (Recommended frontend, backend, database)
    4. Data Models (List of likely entities/schemas)
    5. Project Structure Hint (e.g. "React + Firebase", "Flask + HTML")
    6. Documentation Requirements (Must include README.md and INSTALL.md)
    
    Do not include marketing text, intro or outro. Just the technical facts.
    """
    
    formatted_prompt = prompt_template.format(idea=project_idea_raw)
    
    
    # Direct LLM call without tracing
    prompt = PromptTemplate.from_template(prompt_template)
    chain = prompt | llm
    result = chain.invoke({"idea": project_idea_raw})
    return result.content
