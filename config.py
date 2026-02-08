# config.py
import random

SEED = 42
NUM_AGENTS = 20

MODEL = "gpt-4.1-mini"
MAX_TOKENS = 200
TEMPERATURE = 0.4

TRIGGER_EVENT_MESSAGE = '''We recently identified unauthorised access to an internal government system and acted immediately to contain it.
At this stage, there is no evidence that personal or financial information was compromised.
We are conducting a full review and will provide further updates as appropriate.

'''
random.seed(SEED)
