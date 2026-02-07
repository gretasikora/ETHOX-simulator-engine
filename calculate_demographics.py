import pandas as pd

def calculate_gender_ratio(csv_path='datasets/Amazon Customer Behavior Survey.csv'):

    df = pd.read_csv(csv_path)
    
    gender_counts = df[df['Gender'].isin(['Male', 'Female'])]['Gender'].value_counts()
    total_binary = gender_counts.sum()
    
    male_ratio = gender_counts.get('Male', 0) / total_binary
    female_ratio = gender_counts.get('Female', 0) / total_binary
    
    return {
        'male': male_ratio,
        'female': female_ratio
    }


def calculate_age_group_ratios(csv_path='datasets/Amazon Customer Behavior Survey.csv'):

    df = pd.read_csv(csv_path)
    
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    df_age = df.dropna(subset=['age'])
    
    # Count each age group (no upper limit on 40+)
    under_25 = (df_age['age'] < 25).sum()
    age_25_40 = ((df_age['age'] >= 25) & (df_age['age'] < 40)).sum()
    age_40_plus = (df_age['age'] >= 40).sum()
    
    total = len(df_age)
    
    return {
        'Under 25': under_25 / total,
        '25-40': age_25_40 / total,
        '40+': age_40_plus / total
    }


if __name__ == '__main__':
    print('=== GENDER RATIOS ===')
    gender_ratios = calculate_gender_ratio()
    print(f"Male: {gender_ratios['male']:.4f}")
    print(f"Female: {gender_ratios['female']:.4f}")
    print(f"Sum: {sum(gender_ratios.values()):.4f}")
    
    print('\n=== AGE GROUP RATIOS ===')
    age_ratios = calculate_age_group_ratios()
    print(f"Under 25: {age_ratios['Under 25']:.4f}")
    print(f"25-40: {age_ratios['25-40']:.4f}")
    print(f"40+: {age_ratios['40+']:.4f}")
    print(f"Sum: {sum(age_ratios.values()):.4f}")
    
    print('\n=== CODE SNIPPET FOR sampling.py ===')
    print(f"p_gender = {{'female': {gender_ratios['female']:.4f}, 'male': {gender_ratios['male']:.4f}}}")
    print(f"p_age = {{'Under 25': {age_ratios['Under 25']:.4f}, '25-40': {age_ratios['25-40']:.4f}, '40+': {age_ratios['40+']:.4f}}}")
