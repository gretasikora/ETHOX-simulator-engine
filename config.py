# config.py
import random

SEED = 42
NUM_AGENTS = 20

MODEL = "gpt-4.1-mini"
MAX_TOKENS = 200
TEMPERATURE = 0.4

TRIGGER_EVENT_MESSAGE = "The market has added a new selection of kitchenware in place of beauty and personal care."

random.seed(SEED)
