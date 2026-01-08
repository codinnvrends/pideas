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
    
    # Initialize Langfuse for manual tracing with token counts
    langfuse = None
    try:
        from langfuse import get_client
        langfuse = get_client()
    except Exception as e:
        print(f"Warning: Langfuse init failed: {e}")
        
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
    
    # Create trace and generation span if Langfuse is available
    if langfuse:
        trace = langfuse.trace(
            name="blueprint-generation",
            user_id=user_id,
            session_id=f"distill_{user_id}" if user_id else None,
            metadata={"idea_length": len(project_idea_raw)}
        )
        
        generation = trace.generation(
            name="gemini-blueprint-generation",
            model="gemini-2.5-flash",
            input=formatted_prompt,
        )
        
        # Invoke LLM directly to get full response with metadata
        result = llm.invoke([HumanMessage(content=formatted_prompt)])
        
        # Extract token usage from response
        input_tokens = 0
        output_tokens = 0
        total_tokens = 0
        
        # LangChain Google Genai returns usage in usage_metadata
        if hasattr(result, 'usage_metadata') and result.usage_metadata:
            usage = result.usage_metadata
            input_tokens = usage.get('input_tokens', 0) or usage.get('prompt_tokens', 0) or 0
            output_tokens = usage.get('output_tokens', 0) or usage.get('completion_tokens', 0) or 0
            total_tokens = usage.get('total_tokens', 0) or (input_tokens + output_tokens)
            print(f"Token usage - Input: {input_tokens}, Output: {output_tokens}, Total: {total_tokens}")
        
        # End generation with output and usage
        generation.end(
            output=result.content,
            usage={
                "input": input_tokens,
                "output": output_tokens,
                "total": total_tokens,
            }
        )
        
        langfuse.flush()
        return result.content
    else:
        # Fallback without Langfuse
        prompt = PromptTemplate.from_template(prompt_template)
        chain = prompt | llm
        result = chain.invoke({"idea": project_idea_raw})
        return result.content
