from typing import Dict, Any, List


def format_risk_factor_breakdown(breakdown: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Transforms internal breakdown dictionary into clean API factor list."""
    factors = []
    for key, data in breakdown.items():
        factors.append({
            "factor": key,
            "raw_value": data["raw_value"],
            "normalized_value": data["normalized_value"],
            "weight": data["weight"],
            "contribution": data["contribution"],
            "severity": data["severity"]
        })
    # Sort descending by contribution
    factors.sort(key=lambda x: x["contribution"], reverse=True)
    return factors


def generate_risk_narrative(
    asset_code: str,
    asset_type: str,
    risk_score: float,
    risk_level: str,
    failure_probability: float,
    factors: List[Dict[str, Any]],
    horizon_days: int
) -> str:
    """Generates a clear human-readable narrative explanation for control officers."""
    critical_factors = [f for f in factors if f["normalized_value"] >= 70.0]
    high_factors = [f for f in factors if 50.0 <= f["normalized_value"] < 70.0]

    reasons = []
    for cf in critical_factors:
        reasons.append(f"critical {cf['factor'].replace('_', ' ')} ({cf['normalized_value']}/100)")
    for hf in high_factors:
        reasons.append(f"elevated {hf['factor'].replace('_', ' ')} ({hf['normalized_value']}/100)")

    if reasons:
        reason_str = ", ".join(reasons[:4])
        return (
            f"Asset {asset_code} ({asset_type}) is evaluated at {risk_level} risk level "
            f"({risk_score:.1f}/100, failure probability {int(failure_probability * 100)}%) "
            f"within a {horizon_days}-day horizon due to {reason_str}."
        )

    return (
        f"Asset {asset_code} ({asset_type}) has a healthy operational profile with a {risk_level} risk score "
        f"({risk_score:.1f}/100) and an estimated {int(failure_probability * 100)}% failure likelihood over {horizon_days} days."
    )
