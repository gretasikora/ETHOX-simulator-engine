# llm/client.py
from openai import OpenAI

from config import MAX_TOKENS, MODEL, TEMPERATURE

_client = OpenAI()


def llm_generate(prompt: str) -> str:
    response = _client.responses.create(
        model=MODEL,
        input=prompt,
        max_output_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
    )
    return response.output_text
