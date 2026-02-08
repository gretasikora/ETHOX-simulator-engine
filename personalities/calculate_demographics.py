import pandas as pd
import os


def calculate_gender_ratio(csv_path=None):
    if csv_path is None:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        csv_path = os.path.join(base, 'datasets', 'voter_opinion_survey_350.csv')
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
        csv_path = os.path.join(base, 'datasets', 'voter_opinion_survey_350.csv')
    df = pd.read_csv(csv_path)
    age_group_counts = df['AgeGroup'].value_counts()
    total = age_group_counts.sum()
    return {
        'Under 25': age_group_counts.get('Under 25', 0) / total,
        '25-40': age_group_counts.get('25-40', 0) / total,
        '40+': age_group_counts.get('40+', 0) / total
    }