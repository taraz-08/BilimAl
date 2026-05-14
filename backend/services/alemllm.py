import requests
from typing import Optional
from config import settings

def generate_text(prompt: str) -> Optional[str]:
    api_key = getattr(settings, "ALEMLLM_API_KEY", "sk-U9D124ThkKBBNYc4688H2g")
    url = "https://llm.alem.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "alemllm",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"AlemLLM API Error: {e}")
        return None
