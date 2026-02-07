import pandas as pd
import os


def calculate_gender_ratio(csv_path=None):
    if csv_path is None:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        csv_path = os.path.join(base, 'datasets', 'Amazon Customer Behavior Survey.csv')
    df = pd.read_csv(csv_path)
    gender_counts = df[df['Gender'].isin(['Male', 'Female'])]['Gender'].value_counts()
    total_binary = gender_counts.sum()
    male_ratio = gender_counts.get('Male', 0) / total_binary
    female_ratio = gender_counts.get('Female', 0) / total_binary
    return {
        'male': male_ratio,
        'female': female_ratio
    }


def calculate_age_group_ratios(csv_path=None):
    if csv_path is None:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        csv_path = os.path.join(base, 'datasets', 'Amazon Customer Behavior Survey.csv')
    df = pd.read_csv(csv_path)
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    df_age = df.dropna(subset=['age'])
    under_25 = (df_age['age'] < 25).sum()
    age_25_40 = ((df_age['age'] >= 25) & (df_age['age'] < 40)).sum()
    age_40_plus = (df_age['age'] >= 40).sum()
    total = len(df_age)
    return {
        'Under 25': under_25 / total,
        '25-40': age_25_40 / total,
        '40+': age_40_plus / total
    }