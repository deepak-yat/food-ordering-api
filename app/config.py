import os
from dotenv import load_dotenv

load_dotenv()

GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")