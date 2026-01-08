from textwrap import dedent

class ProjectTasks:
    def design_task(self, agent, project_idea):
        from crewai import Task
        return Task(
            description=dedent(f"""\
                Analyze the following project idea and design a complete file structure for it.
                
                Project Idea:
                {project_idea}
                
                Your design should include:
                1. A list of all necessary files (HTML, CSS, JS, Python, etc.)
                2. A brief description of what each file does.
                3. The chosen technology stack (e.g., React, plain JS, Flask, etc.).

                MANDATORY: You MUST include the following documentation files:
                - 'README.md': Comprehensive project documentation, features, and tech stack explaination.
                - 'INSTALL.md': Detailed step-by-step setup, installation, and running instructions.
                
                Make sure the structure is complete and ready for a developer to start coding.
                Output should be a clear, structured list of file paths."""),
            expected_output="A JSON-like list of file paths and their descriptions, representing the full project structure.",
            agent=agent
        )

    def spec_task(self, agent, design_output):
        from crewai import Task
        return Task(
            description=dedent(f"""\
                Based on the provided Project Design, create detailed requirements for each file.
                
                Project Design:
                {design_output}
                
                For EVERY file listed in the design, write a prompt/instruction for a developer to implement it.
                Include specific details about imports, functions, classes, and logic.
                Ensure consistency across files (e.g., if index.html references app.js, make sure app.js exports what's needed)."""),
            expected_output="A dictionary or detailed list where each key is a file path and the value is the detailed implementation specification.",
            agent=agent
        )

    def coding_task(self, agent, specs, output_dir='/tmp/project'):
        from crewai import Task
        return Task(
            description=dedent(f"""\
                You are the lead developer. Your job is to implement the project based on the specifications.
                
                Specifications:
                {specs}
                
                You have access to a tool to write files. 
                For EACH file in the specification, you MUST use the 'WriteFileTool' to create the file.
                
                IMPORTANT: You must construct the ABSOLUTE path for every file by joining '{output_dir}' with the relative path.
                Example: If the file is 'index.html' and output_dir is '/tmp/project', you MUST call write_file('/tmp/project/index.html', ...).
                DO NOT write to relative paths. ALWAYS use the full path starting with '{output_dir}'.
                
                Ensure the code is complete, bug-free, and handles edge cases.
                DO NOT output the code in markdown blocks or JSON in your final answer; you MUST use the tool to save the files.
                Your final answer should simple be 'All files have been successfully written to {output_dir}' and nothing else."""),
            expected_output="A confirmation that all files have been successfully written to the disk.",
            agent=agent
        )
