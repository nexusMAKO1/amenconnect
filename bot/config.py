import os

# Together API
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", "e82d95829f92bd54a691c9ebd9696942e5984ab7058a3f0ddfba2437fc02a663")
TOGETHER_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo"

# Green API configuration
GREEN_API_INSTANCE_ID = os.getenv("GREEN_API_INSTANCE_ID", "7105220307")
GREEN_API_TOKEN = os.getenv("GREEN_API_TOKEN", "2d101b287231477aaca87eab7dc79a21c20cb9f645774691a6")
GREEN_API_URL = f"https://api.green-api.com/waInstance{GREEN_API_INSTANCE_ID}"
