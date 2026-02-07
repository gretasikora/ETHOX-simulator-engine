# config.py
import random

SEED = 42
NUM_AGENTS = 20

MODEL = "gpt-4.1-mini"
MAX_TOKENS = 200
TEMPERATURE = 0.4

TRIGGER_EVENT_MESSAGE = "The marketplace has reorganised its search functionality - it is better organised overall, but not intuitive at first."

random.seed(SEED)
