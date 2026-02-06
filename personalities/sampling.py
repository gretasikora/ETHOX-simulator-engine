"""
Society generator for BFI-2 15 facets, conditioned on:
- Gender: female/male
- Age: <18, 18-40, 40+

Sources used conceptually:
- Correlations (Table 3) and gender means/SDs (Table 5): Soto & John (2017)
- Scoring key: official BFI-2 scoring key PDF (Colby Personality Lab)
- Age effects: estimated from open BFI2 dataset (ShinyItemAnalysis / CRAN)
"""

from __future__ import annotations

import io
import math
import tarfile
from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import requests
import statsmodels.api as sm


# -----------------------------
# 1) Constants: facets & keys
# -----------------------------

FACETS = [
    "Sociability", "Assertiveness", "Energy Level",
    "Compassion", "Respectfulness", "Trust",
    "Organization", "Productiveness", "Responsibility",
    "Anxiety", "Depression", "Emotional Volatility",
    "Intellectual Curiosity", "Aesthetic Sensitivity", "Creative Imagination",
]

# Official BFI-2 facet scoring key (item numbers; reverse-coded marked True)
# Source: BFI-2 Self-report form and scoring key PDF (Colby Personality Lab)
FACET_KEY: Dict[str, List[Tuple[int, bool]]] = {
    "Sociability": [(1, False), (16, True), (31, True), (46, False)],
    "Assertiveness": [(6, False), (21, False), (36, True), (51, True)],
    "Energy Level": [(11, True), (26, True), (41, False), (56, False)],
    "Compassion": [(2, False), (17, True), (32, False), (47, True)],
    "Respectfulness": [(7, False), (22, True), (37, True), (52, False)],
    "Trust": [(12, True), (27, False), (42, True), (57, False)],
    "Organization": [(3, True), (18, False), (33, False), (48, True)],
    "Productiveness": [(8, True), (23, True), (38, False), (53, False)],
    "Responsibility": [(13, False), (28, True), (43, False), (58, True)],
    "Anxiety": [(4, True), (19, False), (34, False), (49, True)],
    "Depression": [(9, True), (24, True), (39, False), (54, False)],
    "Emotional Volatility": [(14, False), (29, True), (44, True), (59, False)],
    "Intellectual Curiosity": [(10, False), (25, True), (40, False), (55, True)],
    "Aesthetic Sensitivity": [(5, True), (20, False), (35, False), (50, True)],
    "Creative Imagination": [(15, False), (30, True), (45, True), (60, False)],
}

# ---------------------------------------------
# 2) Soto & John (2017) inputs (hard-coded)
# ---------------------------------------------
# 2a) Facet correlation matrix R (Table 3, internet sample)
# Order matches FACETS above.
R = np.eye(15)

def _set_r(i: int, j: int, v: float) -> None:
    R[i, j] = v
    R[j, i] = v

# Fill lower triangle (internet sample correlations from Table 3)
# Indices:
idx = {name: k for k, name in enumerate(FACETS)}

# Extraversion
_set_r(idx["Assertiveness"], idx["Sociability"], 0.54)
_set_r(idx["Energy Level"], idx["Sociability"], 0.59)
_set_r(idx["Energy Level"], idx["Assertiveness"], 0.48)

# Agreeableness
_set_r(idx["Compassion"], idx["Sociability"], 0.12)
_set_r(idx["Compassion"], idx["Assertiveness"], 0.03)
_set_r(idx["Compassion"], idx["Energy Level"], 0.29)

_set_r(idx["Respectfulness"], idx["Sociability"], -0.05)
_set_r(idx["Respectfulness"], idx["Assertiveness"], -0.14)
_set_r(idx["Respectfulness"], idx["Energy Level"], 0.15)
_set_r(idx["Respectfulness"], idx["Compassion"], 0.58)

_set_r(idx["Trust"], idx["Sociability"], 0.16)
_set_r(idx["Trust"], idx["Assertiveness"], -0.01)
_set_r(idx["Trust"], idx["Energy Level"], 0.28)
_set_r(idx["Trust"], idx["Compassion"], 0.48)
_set_r(idx["Trust"], idx["Respectfulness"], 0.50)

# Conscientiousness
_set_r(idx["Organization"], idx["Sociability"], -0.01)
_set_r(idx["Organization"], idx["Assertiveness"], 0.16)
_set_r(idx["Organization"], idx["Energy Level"], 0.13)
_set_r(idx["Organization"], idx["Compassion"], 0.09)
_set_r(idx["Organization"], idx["Respectfulness"], 0.20)
_set_r(idx["Organization"], idx["Trust"], 0.06)

_set_r(idx["Productiveness"], idx["Sociability"], 0.14)
_set_r(idx["Productiveness"], idx["Assertiveness"], 0.31)
_set_r(idx["Productiveness"], idx["Energy Level"], 0.35)
_set_r(idx["Productiveness"], idx["Compassion"], 0.22)
_set_r(idx["Productiveness"], idx["Respectfulness"], 0.26)
_set_r(idx["Productiveness"], idx["Trust"], 0.15)
_set_r(idx["Productiveness"], idx["Organization"], 0.60)

_set_r(idx["Responsibility"], idx["Sociability"], 0.04)
_set_r(idx["Responsibility"], idx["Assertiveness"], 0.17)
_set_r(idx["Responsibility"], idx["Energy Level"], 0.20)
_set_r(idx["Responsibility"], idx["Compassion"], 0.30)
_set_r(idx["Responsibility"], idx["Respectfulness"], 0.37)
_set_r(idx["Responsibility"], idx["Trust"], 0.20)
_set_r(idx["Responsibility"], idx["Organization"], 0.52)
_set_r(idx["Responsibility"], idx["Productiveness"], 0.60)

# Negative Emotionality
_set_r(idx["Anxiety"], idx["Sociability"], -0.20)
_set_r(idx["Anxiety"], idx["Assertiveness"], -0.21)
_set_r(idx["Anxiety"], idx["Energy Level"], -0.23)
_set_r(idx["Anxiety"], idx["Compassion"], -0.20)
_set_r(idx["Anxiety"], idx["Respectfulness"], -0.16)
_set_r(idx["Anxiety"], idx["Trust"], -0.31)
_set_r(idx["Anxiety"], idx["Organization"], -0.05)
_set_r(idx["Anxiety"], idx["Productiveness"], -0.16)
_set_r(idx["Anxiety"], idx["Responsibility"], -0.16)

_set_r(idx["Depression"], idx["Sociability"], -0.39)
_set_r(idx["Depression"], idx["Assertiveness"], -0.39)
_set_r(idx["Depression"], idx["Energy Level"], -0.47)
_set_r(idx["Depression"], idx["Compassion"], -0.14)
_set_r(idx["Depression"], idx["Respectfulness"], -0.18)
_set_r(idx["Depression"], idx["Trust"], -0.34)
_set_r(idx["Depression"], idx["Organization"], -0.21)
_set_r(idx["Depression"], idx["Productiveness"], -0.36)
_set_r(idx["Depression"], idx["Responsibility"], -0.31)
_set_r(idx["Depression"], idx["Anxiety"], 0.64)

_set_r(idx["Emotional Volatility"], idx["Sociability"], -0.06)
_set_r(idx["Emotional Volatility"], idx["Assertiveness"], -0.12)
_set_r(idx["Emotional Volatility"], idx["Energy Level"], -0.15)
_set_r(idx["Emotional Volatility"], idx["Compassion"], -0.08)
_set_r(idx["Emotional Volatility"], idx["Respectfulness"], -0.30)
_set_r(idx["Emotional Volatility"], idx["Trust"], -0.32)
_set_r(idx["Emotional Volatility"], idx["Organization"], -0.17)
_set_r(idx["Emotional Volatility"], idx["Productiveness"], -0.27)
_set_r(idx["Emotional Volatility"], idx["Responsibility"], -0.31)
_set_r(idx["Emotional Volatility"], idx["Anxiety"], 0.65)
_set_r(idx["Emotional Volatility"], idx["Depression"], 0.59)

# Open-Mindedness
_set_r(idx["Intellectual Curiosity"], idx["Sociability"], 0.00)
_set_r(idx["Intellectual Curiosity"], idx["Assertiveness"], 0.18)
_set_r(idx["Intellectual Curiosity"], idx["Energy Level"], 0.10)
_set_r(idx["Intellectual Curiosity"], idx["Compassion"], 0.12)
_set_r(idx["Intellectual Curiosity"], idx["Respectfulness"], 0.04)
_set_r(idx["Intellectual Curiosity"], idx["Trust"], 0.04)
_set_r(idx["Intellectual Curiosity"], idx["Organization"], -0.10)
_set_r(idx["Intellectual Curiosity"], idx["Productiveness"], 0.01)
_set_r(idx["Intellectual Curiosity"], idx["Responsibility"], -0.04)
_set_r(idx["Intellectual Curiosity"], idx["Anxiety"], 0.03)
_set_r(idx["Intellectual Curiosity"], idx["Depression"], -0.01)
_set_r(idx["Intellectual Curiosity"], idx["Emotional Volatility"], -0.02)

_set_r(idx["Aesthetic Sensitivity"], idx["Sociability"], 0.02)
_set_r(idx["Aesthetic Sensitivity"], idx["Assertiveness"], 0.11)
_set_r(idx["Aesthetic Sensitivity"], idx["Energy Level"], 0.11)
_set_r(idx["Aesthetic Sensitivity"], idx["Compassion"], 0.14)
_set_r(idx["Aesthetic Sensitivity"], idx["Respectfulness"], 0.09)
_set_r(idx["Aesthetic Sensitivity"], idx["Trust"], 0.09)
_set_r(idx["Aesthetic Sensitivity"], idx["Organization"], -0.07)
_set_r(idx["Aesthetic Sensitivity"], idx["Productiveness"], -0.01)
_set_r(idx["Aesthetic Sensitivity"], idx["Responsibility"], -0.05)
_set_r(idx["Aesthetic Sensitivity"], idx["Anxiety"], 0.02)
_set_r(idx["Aesthetic Sensitivity"], idx["Depression"], 0.03)
_set_r(idx["Aesthetic Sensitivity"], idx["Emotional Volatility"], 0.02)
_set_r(idx["Aesthetic Sensitivity"], idx["Intellectual Curiosity"], 0.49)

_set_r(idx["Creative Imagination"], idx["Sociability"], 0.18)
_set_r(idx["Creative Imagination"], idx["Assertiveness"], 0.33)
_set_r(idx["Creative Imagination"], idx["Energy Level"], 0.29)
_set_r(idx["Creative Imagination"], idx["Compassion"], 0.16)
_set_r(idx["Creative Imagination"], idx["Respectfulness"], 0.08)
_set_r(idx["Creative Imagination"], idx["Trust"], 0.12)
_set_r(idx["Creative Imagination"], idx["Organization"], -0.02)
_set_r(idx["Creative Imagination"], idx["Productiveness"], 0.14)
_set_r(idx["Creative Imagination"], idx["Responsibility"], 0.05)
_set_r(idx["Creative Imagination"], idx["Anxiety"], -0.13)
_set_r(idx["Creative Imagination"], idx["Depression"], -0.21)
_set_r(idx["Creative Imagination"], idx["Emotional Volatility"], -0.12)
_set_r(idx["Creative Imagination"], idx["Intellectual Curiosity"], 0.48)
_set_r(idx["Creative Imagination"], idx["Aesthetic Sensitivity"], 0.44)

# 2b) Table 5 internet-sample means/SDs by gender (men/women), facets only
# NOTE: these are on the 1–5 facet scale (average of 4 items).
SOTO2017_TABLE5_INET = {
    "Sociability": {"men_mean": 2.80, "men_sd": 1.02, "women_mean": 3.10, "women_sd": 1.07},
    "Assertiveness": {"men_mean": 3.28, "men_sd": 0.92, "women_mean": 3.28, "women_sd": 0.93},
    "Energy Level": {"men_mean": 3.37, "men_sd": 0.88, "women_mean": 3.56, "women_sd": 0.89},
    "Compassion": {"men_mean": 3.72, "men_sd": 0.79, "women_mean": 3.97, "women_sd": 0.76},
    "Respectfulness": {"men_mean": 3.87, "men_sd": 0.73, "women_mean": 4.08, "women_sd": 0.68},
    "Trust": {"men_mean": 3.13, "men_sd": 0.83, "women_mean": 3.32, "women_sd": 0.80},
    "Organization": {"men_mean": 3.33, "men_sd": 0.99, "women_mean": 3.51, "women_sd": 1.03},
    "Productiveness": {"men_mean": 3.31, "men_sd": 0.87, "women_mean": 3.43, "women_sd": 0.93},
    "Responsibility": {"men_mean": 3.40, "men_sd": 0.78, "women_mean": 3.57, "women_sd": 0.83},
    "Anxiety": {"men_mean": 3.28, "men_sd": 0.95, "women_mean": 3.58, "women_sd": 0.88},
    "Depression": {"men_mean": 2.82, "men_sd": 1.03, "women_mean": 2.88, "women_sd": 1.02},
    "Emotional Volatility": {"men_mean": 2.77, "men_sd": 1.04, "women_mean": 3.09, "women_sd": 1.04},
    "Intellectual Curiosity": {"men_mean": 4.18, "men_sd": 0.69, "women_mean": 4.03, "women_sd": 0.71},
    "Aesthetic Sensitivity": {"men_mean": 3.71, "men_sd": 0.90, "women_mean": 3.88, "women_sd": 0.94},
    "Creative Imagination": {"men_mean": 3.89, "men_sd": 0.81, "women_mean": 3.82, "women_sd": 0.80},
}
SOTO_INET_N_MEN = 500
SOTO_INET_N_WOMEN = 500


# -----------------------------
# 3) Utility: nearest PD
# -----------------------------
def nearest_pd(a: np.ndarray, eps: float = 1e-8) -> np.ndarray:
    """Project a symmetric matrix to the nearest positive-definite matrix."""
    b = (a + a.T) / 2
    eigvals, eigvecs = np.linalg.eigh(b)
    eigvals_clipped = np.maximum(eigvals, eps)
    return eigvecs @ np.diag(eigvals_clipped) @ eigvecs.T


# ----------------------------------------------------------
# 4) Download + load open BFI2 dataset from CRAN (R package)
# ----------------------------------------------------------
def download_bfi2_from_cran() -> pd.DataFrame:
    """
    Downloads the latest ShinyItemAnalysis source package from CRAN,
    extracts data/BFI2.rda, and reads it into pandas using pyreadr.

    Requires: pip install pyreadr
    """
    import pyreadr  # type: ignore

    # Get latest version from CRAN PACKAGES file
    packages_url = "https://cran.r-project.org/src/contrib/PACKAGES"
    packages_txt = requests.get(packages_url, timeout=60).text

    # Parse the ShinyItemAnalysis version
    blocks = packages_txt.split("\n\n")
    version = None
    for blk in blocks:
        if blk.startswith("Package: ShinyItemAnalysis"):
            m = next((line for line in blk.splitlines() if line.startswith("Version: ")), None)
            if m:
                version = m.replace("Version: ", "").strip()
            break
    if not version:
        raise RuntimeError("Could not detect ShinyItemAnalysis version from CRAN PACKAGES.")

    tar_url = f"https://cran.r-project.org/src/contrib/ShinyItemAnalysis_{version}.tar.gz"
    tgz = requests.get(tar_url, timeout=120).content

    # Extract BFI2.rda from tarball
    tf = tarfile.open(fileobj=io.BytesIO(tgz), mode="r:gz")
    members = tf.getmembers()
    rda_member = None
    for mem in members:
        # in source tarballs the path is usually ShinyItemAnalysis/data/BFI2.rda
        if mem.name.endswith("/data/BFI2.rda"):
            rda_member = mem
            break
    if rda_member is None:
        raise RuntimeError("BFI2.rda not found inside ShinyItemAnalysis source tarball.")

    rda_bytes = tf.extractfile(rda_member).read()
    res = pyreadr.read_r(io.BytesIO(rda_bytes))
    # the object name is likely "BFI2"
    if "BFI2" not in res:
        # fall back: take first object
        obj = next(iter(res.values()))
    else:
        obj = res["BFI2"]
    df = obj.copy()
    return df


# -----------------------------
# 5) Score BFI-2 facets
# -----------------------------
def score_facets_from_items(df_items: pd.DataFrame) -> pd.DataFrame:
    """
    Expects columns i1..i60 (Likert 1-5). Returns facet-score dataframe (1-5).
    """
    df = df_items.copy()

    # Reverse-key: for 1..5 scale => 6 - x
    def item_col(k: int) -> str:
        return f"i{k}"

    facet_scores = {}
    for facet, keys in FACET_KEY.items():
        vals = []
        for item_num, is_rev in keys:
            col = item_col(item_num)
            if col not in df.columns:
                raise KeyError(f"Missing item column {col} in dataset.")
            x = df[col].astype(float)
            if is_rev:
                x = 6.0 - x
            vals.append(x)
        facet_scores[facet] = pd.concat(vals, axis=1).mean(axis=1)
    return pd.DataFrame(facet_scores)


# ---------------------------------------------
# 6) Estimate age effects from open BFI2 data
# ---------------------------------------------
@dataclass
class AgeModel:
    # per-facet regression params for z-scored facet:
    # z = b0 + bF*female + bA*age_c + bFA*(female*age_c)
    params: Dict[str, np.ndarray]
    age_ref: float

def fit_age_models(facets: pd.DataFrame, age: pd.Series, gender: pd.Series, age_ref: float = 29.0) -> AgeModel:
    """
    Fit per-facet OLS on z-scored facet:
        z ~ 1 + female + age_c + female*age_c
    Returns coefficients for demographic mean shifts.

    Assumes gender can be mapped to female indicator:
      - if strings: contains 'f' => female
      - if numeric 0/1: assume 1=female
    """
    # Female indicator
    if gender.dtype == "O":
        female = gender.astype(str).str.lower().str.startswith("f").astype(int)
    else:
        # heuristic: if values are {0,1}, treat 1 as female
        female = gender.astype(int)

    age_c = age.astype(float) - float(age_ref)

    X = pd.DataFrame({
        "const": 1.0,
        "female": female,
        "age_c": age_c,
        "female_age_c": female * age_c,
    })

    params = {}
    for facet in FACETS:
        y = facets[facet].astype(float)
        y_z = (y - y.mean()) / y.std(ddof=0)
        model = sm.OLS(y_z, X, missing="drop").fit()
        params[facet] = model.params.values  # [b0, bF, bA, bFA]
    return AgeModel(params=params, age_ref=age_ref)

def delta_z_for_age_group(am: AgeModel, facet: str, female: int, age_mid: float) -> float:
    """
    Returns predicted z(age_mid) - predicted z(age_ref), so intercept cancels.
    """
    b0, bF, bA, bFA = am.params[facet]
    age_c = age_mid - am.age_ref
    # pred at age_mid:
    z_mid = b0 + bF*female + bA*age_c + bFA*(female*age_c)
    # pred at age_ref (age_c=0):
    z_ref = b0 + bF*female
    return float(z_mid - z_ref)


# ---------------------------------------------------------
# 7) Build society distribution (mixture over demographics)
# ---------------------------------------------------------
def pooled_sd(m_sd: float, f_sd: float, n_m: int, n_f: int) -> float:
    return math.sqrt(((n_m - 1) * (m_sd ** 2) + (n_f - 1) * (f_sd ** 2)) / (n_m + n_f - 2))

def build_covariance_from_R() -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns (SD_vector, Sigma) using pooled SDs from Soto&John Table 5 + R from Table 3.
    """
    sds = []
    for facet in FACETS:
        row = SOTO2017_TABLE5_INET[facet]
        sd = pooled_sd(row["men_sd"], row["women_sd"], SOTO_INET_N_MEN, SOTO_INET_N_WOMEN)
        sds.append(sd)
    sd_vec = np.array(sds, dtype=float)
    Sigma = np.diag(sd_vec) @ R @ np.diag(sd_vec)
    Sigma = nearest_pd(Sigma)
    return sd_vec, Sigma

def build_cell_means(age_model: AgeModel) -> Dict[Tuple[str, str], np.ndarray]:
    """
    Builds mean vectors mu_{gender, age_group} anchored to Soto&John gender means
    for the 18-40 group (reference age), and shifted by age deltas learned from BFI2.

    Returns dict keyed by (gender, age_group).
    """
    # Representative midpoints for your categories
    age_mid = {
        "Under 18": 16.0,
        "18-40": 29.0,     # reference
        "40+": 55.0,
    }

    cell_mu = {}
    for gender in ["female", "male"]:
        female_ind = 1 if gender == "female" else 0

        # Base means for reference age group from Soto&John Table 5 (internet sample)
        base = []
        for facet in FACETS:
            row = SOTO2017_TABLE5_INET[facet]
            base_mean = row["women_mean"] if gender == "female" else row["men_mean"]
            base.append(base_mean)
        base = np.array(base, dtype=float)

        # Convert age deltas in z units into raw-score deltas using pooled SDs
        sd_vec, _ = build_covariance_from_R()

        for ag in ["Under 18", "18-40", "40+"]:
            deltas = []
            for k, facet in enumerate(FACETS):
                dz = delta_z_for_age_group(age_model, facet=facet, female=female_ind, age_mid=age_mid[ag])
                deltas.append(dz * sd_vec[k])
            mu = base + np.array(deltas, dtype=float)
            cell_mu[(gender, ag)] = mu

    return cell_mu


# -----------------------------
# 8) Sampling 200 people
# -----------------------------
def normalize_probs(d: Dict[str, float]) -> Dict[str, float]:
    s = sum(d.values())
    if s <= 0:
        raise ValueError("Probabilities must sum to > 0.")
    return {k: v / s for k, v in d.items()}

def sample_society(
    n: int,
    p_gender: Dict[str, float],
    p_age: Dict[str, float],
    cell_mu: Dict[Tuple[str, str], np.ndarray],
    Sigma: np.ndarray,
    seed: int = 123,
    clamp_1_5: bool = True,
) -> pd.DataFrame:
    """
    Sample n people:
      1) sample gender ~ p_gender
      2) sample age_group ~ p_age
      3) traits ~ MVN(mu_{g,a}, Sigma)
    """
    rng = np.random.default_rng(seed)

    p_gender = normalize_probs(p_gender)
    p_age = normalize_probs(p_age)

    genders = list(p_gender.keys())
    ages = list(p_age.keys())

    gender_draw = rng.choice(genders, size=n, p=[p_gender[g] for g in genders])
    age_draw = rng.choice(ages, size=n, p=[p_age[a] for a in ages])

    X = np.zeros((n, len(FACETS)))
    for i in range(n):
        mu = cell_mu[(gender_draw[i], age_draw[i])]
        x = rng.multivariate_normal(mean=mu, cov=Sigma)
        if clamp_1_5:
            x = np.clip(x, 1.0, 5.0)
        X[i, :] = x

    df = pd.DataFrame(X, columns=FACETS)
    df.insert(0, "age_group", age_draw)
    df.insert(0, "gender", gender_draw)
    return df


# -----------------------------
# 9) Putting it all together
# -----------------------------
def main():
    # A) Load open item-level dataset with age+gender
    df_bfi2 = download_bfi2_from_cran()

    # Expect columns i1..i60 plus age and gender (names can vary slightly)
    # Try common possibilities:
    age_col = "age" if "age" in df_bfi2.columns else "Age"
    gender_col = "gender" if "gender" in df_bfi2.columns else "Gender"

    facets = score_facets_from_items(df_bfi2)
    age = df_bfi2[age_col]
    gender = df_bfi2[gender_col]

    # B) Fit age models
    age_model = fit_age_models(facets, age=age, gender=gender, age_ref=29.0)

    # C) Build covariance from Soto&John correlations + SDs
    _, Sigma = build_covariance_from_R()

    # D) Build demographic cell means anchored to Soto&John gender means
    cell_mu = build_cell_means(age_model)

    # E) Plug in YOUR customer base proportions (examples below)
    p_gender = {"female": 0.55, "male": 0.45}
    p_age = {"Under 18": 0.05, "18-40": 0.65, "40+": 0.30}

    # F) Sample 200 people
    df_people = sample_society(
        n=200,
        p_gender=p_gender,
        p_age=p_age,
        cell_mu=cell_mu,
        Sigma=Sigma,
        seed=42,
        clamp_1_5=True,
    )

    # Quick checks: do demographics match input (approximately)?
    print(df_people[["gender", "age_group"]].value_counts(normalize=True).sort_index())
    print("\nOverall facet means:")
    print(df_people[FACETS].mean().round(2))

    # Save
    df_people.to_csv("synthetic_society_200.csv", index=False)
    print("\nWrote synthetic_society_200.csv")

if __name__ == "__main__":
    main()
