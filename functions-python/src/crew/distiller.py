import os

def distill_idea(project_idea_raw: str, user_id: str = None) -> str:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage

    """
    Takes a raw, verbose project idea and converts it into a strict Technical Blueprint.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")
    
    # Initialize Langfuse for tracing
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
    
    # Use Langfuse v3 API with context managers
    if langfuse:
        from langfuse import propagate_attributes
        
        # Create a generation observation using v3 API
        with langfuse.start_as_current_observation(
            as_type="generation",
            name="blueprint-generation",
            model="gemini-2.5-flash",
            input=formatted_prompt[:500],  # Preview
        ) as generation:
            # Propagate user attributes
            with propagate_attributes(
                user_id=user_id,
                session_id=f"distill_{user_id}" if user_id else None,
                metadata={"idea_length": len(project_idea_raw)}
            ):
                # Invoke LLM
                result = llm.invoke([HumanMessage(content=formatted_prompt)])
                
                # Extract token usage from response
                input_tokens = 0
                output_tokens = 0
                
                if hasattr(result, 'usage_metadata') and result.usage_metadata:
                    usage = result.usage_metadata
                    input_tokens = usage.get('input_tokens', 0) or usage.get('prompt_tokens', 0) or 0
                    output_tokens = usage.get('output_tokens', 0) or usage.get('completion_tokens', 0) or 0
                    print(f"Token usage - Input: {input_tokens}, Output: {output_tokens}")
                
                # Update generation with output and usage (Langfuse v3 uses usage_details)
                generation.update(
                    output=result.content[:500],  # Preview
                    usage_details={
                        "input": input_tokens,
                        "output": output_tokens,
                    }
                )
        
        langfuse.flush()
        return result.content
    else:
        # Fallback without Langfuse
        result = llm.invoke([HumanMessage(content=formatted_prompt)])
        return result.content
