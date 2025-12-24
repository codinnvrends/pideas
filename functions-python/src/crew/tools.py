from crewai.tools import BaseTool
from pydantic import Field
import os

class WriteFileTool(BaseTool):
    name: str = "WriteFileTool"
    description: str = "Useful to write content to a file at a specific path. The file_path should be absolute or relative."

    def _run(self, file_path: str, content: str) -> str:
        try:
            # Security check: ensure we are writing to /tmp or a allowed dir
            # For this MVP we trust the agent but in prod we should sanitize paths
            
            directory = os.path.dirname(file_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)
                
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            return f"Successfully wrote to {file_path}"
        except Exception as e:
            return f"Error writing file: {str(e)}"

# Create the tool instance
file_tool = WriteFileTool()
