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


def llm_supervisor(prompt: str) -> str:
    response = _client.responses.create(
        model="gpt-4.1",
        input=prompt,
        max_output_tokens=10000,
        temperature=0.3,
    )
    return response.output_text
