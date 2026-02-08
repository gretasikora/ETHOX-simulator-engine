# config.py
import random

SEED = 42
NUM_AGENTS = 20

# Trait variance: 1.0 = full BFI-2 population variance (many extremes like 0.95/0.17).
# Lower values (e.g. 0.6) pull traits toward 0.5 for fewer edge cases.
TRAIT_VARIANCE_SCALE = 0.65

MODEL = "gpt-4.1-mini"
MAX_TOKENS = 200
TEMPERATURE = 0.4

TRIGGER_EVENT_MESSAGE = "The marketplace has reorganised its search functionality - it is better organised overall, but not intuitive at first."

random.seed(SEED)
