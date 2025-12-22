import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    # Try looking in the parent directory just in case debugging locally
    load_dotenv("../functions/.env")
    api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("CRITICAL: GEMINI_API_KEY not found in environment.")
else:
    print(f"Using API Key: {api_key[:5]}...")
    genai.configure(api_key=api_key)
    print("Listing available models for generateContent:")
    try:
        found = False
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
                found = True
        if not found:
            print("No models found that support generateContent.")
    except Exception as e:
        print(f"Error listing models: {e}")
