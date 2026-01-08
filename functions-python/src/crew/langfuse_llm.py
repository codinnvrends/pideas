"""
Custom LLM wrapper that reports token usage to Langfuse on every generation.
This bypasses CrewAI's callback isolation issue.
"""
import os
from typing import Any, List, Optional, Iterator, AsyncIterator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
from langchain_core.outputs import ChatResult, ChatGenerationChunk


class LangfuseGeminiLLM(ChatGoogleGenerativeAI):
    """
    A ChatGoogleGenerativeAI wrapper that reports token usage to Langfuse.
    Supports explicit trace_id to handle CrewAI threading context loss.
    Covers generate, stream, and async methods.
    """
    trace_id: Optional[str] = None
    parent_observation_id: Optional[str] = None
    
    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Override _generate to capture and report usage from sync calls."""
        # Call parent
        result = super()._generate(messages, stop, run_manager, **kwargs)
        
        # Report (safe)
        try:
            self._report_to_langfuse(messages, result)
        except Exception as e:
            print(f"Warning: Langfuse reporting failed: {e}")
            
        return result

    def _stream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> Iterator[ChatGenerationChunk]:
        """Override _stream to capture usage from streaming calls."""
        # We need to capture the accumulated response to report it
        collected_chunks = []
        
        # Iterate over parent stream
        for chunk in super()._stream(messages, stop, run_manager, **kwargs):
            collected_chunks.append(chunk)
            yield chunk
            
        # Report after stream finishes
        try:
            # Reconstruct a ChatResult-like object or just extract from chunks
            # Gemini usually sends usage in the last chunk's usage_metadata
            input_tokens = 0
            output_tokens = 0
            output_text = "".join([c.text for c in collected_chunks])
            
            # Look for usage in chunks (usually the last one)
            for chunk in reversed(collected_chunks):
                if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                    usage = chunk.usage_metadata
                    input_tokens = usage.get("input_tokens", 0) or 0
                    output_tokens = usage.get("output_tokens", 0) or 0
                    if input_tokens > 0: # If we found input tokens, we likely found the full usage
                        break
                        
            # Use the existing report function with manually constructed data
            self._report_usage_directly(
                messages, 
                output_text, 
                input_tokens, 
                output_tokens
            )
            
        except Exception as e:
            print(f"Warning: Langfuse stream reporting failed: {e}")

    # Use the same logic for extraction
    def _report_to_langfuse(self, messages: List[BaseMessage], result: ChatResult):
        from langfuse import get_client
        langfuse = get_client()
        if not langfuse:
            return

        input_tokens = 0
        output_tokens = 0
        
        # Strategy 1: Check llm_output
        if result.llm_output:
            usage = result.llm_output.get("usage_metadata", {})
            if usage:
                input_tokens = usage.get("input_tokens", 0) or usage.get("prompt_tokens", 0) or 0
                output_tokens = usage.get("output_tokens", 0) or usage.get("completion_tokens", 0) or 0
        
        # Strategy 2: Check standard generations
        if input_tokens == 0 and result.generations:
            for gen in result.generations:
                # Check generation_info
                if hasattr(gen, 'generation_info') and gen.generation_info:
                    usage = gen.generation_info.get("usage_metadata", {}) or gen.generation_info.get("token_usage", {})
                    if usage:
                        input_tokens = usage.get("input_tokens", 0) or 0
                        output_tokens = usage.get("output_tokens", 0) or 0
                        break
                
                # Strategy 3: Check message.usage_metadata (Crucial for LangChain v0.2+)
                if hasattr(gen, 'message') and hasattr(gen.message, 'usage_metadata'):
                    usage = gen.message.usage_metadata
                    if usage:
                        input_tokens = usage.get("input_tokens", 0) or 0
                        output_tokens = usage.get("output_tokens", 0) or 0
                        break

        # Extract text
        input_text = messages[-1].content if messages else ""
        output_text = result.generations[0].text if result.generations else ""
        
        if input_tokens > 0 or output_tokens > 0:
            print(f"DEBUG: Found tokens! Input: {input_tokens}, Output: {output_tokens}")
        else:
            print("DEBUG: No tokens found in result object.")

        self._report_usage_directly(messages, output_text, input_tokens, output_tokens)

    def _report_usage_directly(self, messages, output_text, input_tokens, output_tokens):
        from langfuse import get_client
        langfuse = get_client()
        if not langfuse: 
            return

        input_text = messages[-1].content if messages else ""
        
        # Report logic handles trace_id
        if self.trace_id:
            trace = langfuse.trace(id=self.trace_id)
            trace.generation(
                name="crewai-llm-call",
                model=self.model,
                input=str(input_text)[:1000],
                output=str(output_text)[:1000],
                parent_observation_id=self.parent_observation_id,
                usage_details={
                    "input": input_tokens,
                    "output": output_tokens,
                }
            )
            print(f"Langfuse: Attached generation to Trace ID: {self.trace_id}, Parent: {self.parent_observation_id}")
        else:
            with langfuse.start_as_current_observation(
                as_type="generation",
                name="crewai-llm-call-orphaned",
                model=self.model,
                input=str(input_text)[:500],
                output=str(output_text)[:500],
            ) as generation:
                generation.update(
                    usage_details={
                        "input": input_tokens,
                        "output": output_tokens,
                    }
                )


def get_langfuse_gemini_model(trace_id: Optional[str] = None, parent_observation_id: Optional[str] = None):
    """
    Factory function to create a LangfuseGeminiLLM instance.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment")
    
    llm = LangfuseGeminiLLM(
        model="gemini-2.5-flash",
        verbose=True,
        temperature=0.7,
        google_api_key=api_key,
        include_thoughts=True,
    )
    llm.trace_id = trace_id
    llm.parent_observation_id = parent_observation_id
    return llm

