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

TRIGGER_EVENT_MESSAGE = '''Announcement of the government (PolicyTechnocrats):
Today, we are announcing a responsible reform to secure the retirement system for future generations while protecting today’s retirees.
This plan strengthens the system by adjusting eligibility rules for younger workers, asking the wealthiest retirees to contribute a fairer share, and increasing support for seniors who need it most.
These changes ensure long-term stability without disrupting current benefits, and they preserve individual choice while restoring trust in the system.
'''

random.seed(SEED)
