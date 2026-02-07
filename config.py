# config.py
import random

SEED = 42
NUM_AGENTS = 3
WARMUP_ROUNDS = 3

MODEL = "gpt-4.1-mini"
MAX_TOKENS = 100
TEMPERATURE = 0.4

TRIGGER_EVENT_MESSAGE = "Prices have doubled."

random.seed(SEED)
