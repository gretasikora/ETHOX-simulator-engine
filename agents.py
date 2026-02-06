Agent = {
  "id": int,
  "archetype": str,
  "traits": {
    "price_sensitivity": float,   # 0–1
    "loyalty": float,             # 0–1
    "social_influence": float     # 0–1
  },
  "state": {
    "sentiment": float,           # -1 to +1
    "active": bool
  },
  "memory": [str],                # last 3 utterances
  "neighbors": [int]
}
