# llm/client.py
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from config import MAX_TOKENS, MODEL, TEMPERATURE

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_ensure_env_loaded = False
_client = None


def _get_api_key() -> str | None:
    """Get OPENAI_API_KEY from Django settings, .env, or environment."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        return api_key
    try:
        from django.conf import settings
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if api_key:
            return api_key
    except Exception:
        pass
    return None


def _get_client() -> OpenAI:
    """Lazy init; loads .env on first use, uses Django settings when available."""
    global _client, _ensure_env_loaded
    if not _ensure_env_loaded:
        load_dotenv(_PROJECT_ROOT / ".env")
        load_dotenv(_PROJECT_ROOT / "backend" / ".env")  # fallback
        _ensure_env_loaded = True
    api_key = _get_api_key()
    if _client is None:
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY not set. Add OPENAI_API_KEY=sk-... to .env in project root "
                "(ETHOX-simulator-engine/.env) or set the environment variable."
            )
        _client = OpenAI(api_key=api_key)
    return _client


def llm_generate(prompt: str) -> str:
    response = _get_client().responses.create(
        model=MODEL,
        input=prompt,
        max_output_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
    )
    return response.output_text


def llm_supervisor(prompt: str) -> str:
    response = _get_client().responses.create(
        model="gpt-4.1",
        input=prompt,
        max_output_tokens=10000,
        temperature=0.3,
    )
    return response.output_text
