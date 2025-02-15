from mistralai import Mistral
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.environ.get("MISTRAL_AI_API_KEY")

client = Mistral(api_key=api_key)
