# config.py
import random

SEED = 123
NUM_AGENTS = 20
TRAIT_VARIANCE_SCALE = 1.0  # Use full Soto & John (2017) variance for valid population representation
MODEL = "gpt-4o-mini"
MAX_TOKENS = 200
TEMPERATURE = 0.4

TRIGGER_EVENT_MESSAGE = '''We recently identified unauthorised access to an internal government system and acted immediately to contain it.
At this stage, there is no evidence that personal or financial information was compromised.
We are conducting a full review and will provide further updates as appropriate.

'''
random.seed(SEED)
