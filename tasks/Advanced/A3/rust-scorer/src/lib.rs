use chrono::{DateTime, Timelike, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct TransactionInput {
    pub transaction_id: String,
    pub amount: f64,
    pub currency: String,
    pub merchant_category: String,
    pub country: String,
    pub device_id: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

impl RiskLevel {
    pub fn as_str(&self) -> &'static str {
        match self {
            RiskLevel::Low => "LOW",
            RiskLevel::Medium => "MEDIUM",
            RiskLevel::High => "HIGH",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RiskScoreResult {
    pub transaction_id: String,
    pub risk_score: u8,
    pub risk_level: RiskLevel,
    pub reasons: Vec<String>,
    pub computed_at: DateTime<Utc>,
}

impl RiskScoreResult {
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        #[derive(Serialize)]
        struct Wire<'a> {
            transaction_id: &'a str,
            risk_score: u8,
            risk_level: &'static str,
            reasons: &'a [String],
            computed_at: DateTime<Utc>,
        }

        serde_json::to_string_pretty(&Wire {
            transaction_id: &self.transaction_id,
            risk_score: self.risk_score,
            risk_level: self.risk_level.as_str(),
            reasons: &self.reasons,
            computed_at: self.computed_at,
        })
    }
}

const RISKY_CATEGORIES: &[&str] = &["gambling", "crypto", "wire_transfer"];

pub fn score_transaction(tx: &TransactionInput, now: DateTime<Utc>) -> RiskScoreResult {
    let mut score: u16 = 0;
    let mut reasons = Vec::new();

    if tx.amount >= 5000.0 {
        score += 35;
        reasons.push("high_amount_tier2".to_string());
    } else if tx.amount >= 1000.0 {
        score += 20;
        reasons.push("high_amount_tier1".to_string());
    }

    if tx.amount >= 10000.0 {
        score += 15;
        reasons.push("high_amount_tier3".to_string());
    }

    if tx.country.to_uppercase() != "US" {
        score += 15;
        reasons.push("foreign_country".to_string());
    }

    let category = tx.merchant_category.to_lowercase();
    if RISKY_CATEGORIES.contains(&category.as_str()) {
        score += 30;
        reasons.push("risky_merchant_category".to_string());
    }

    let hour = tx.timestamp.hour();
    if (0..6).contains(&hour) {
        score += 10;
        reasons.push("night_transaction".to_string());
    }

    let risk_score = score.min(100) as u8;
    let risk_level = match risk_score {
        0..=29 => RiskLevel::Low,
        30..=59 => RiskLevel::Medium,
        _ => RiskLevel::High,
    };

    RiskScoreResult {
        transaction_id: tx.transaction_id.clone(),
        risk_score,
        risk_level,
        reasons,
        computed_at: now,
    }
}

pub fn score_from_json(input: &str, now: DateTime<Utc>) -> Result<RiskScoreResult, String> {
    let tx: TransactionInput =
        serde_json::from_str(input).map_err(|err| format!("invalid transaction json: {err}"))?;
    Ok(score_transaction(&tx, now))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn sample_tx(amount: f64, country: &str, category: &str, hour: u32) -> TransactionInput {
        TransactionInput {
            transaction_id: "tx-test".to_string(),
            amount,
            currency: "USD".to_string(),
            merchant_category: category.to_string(),
            country: country.to_string(),
            device_id: "device-1".to_string(),
            timestamp: Utc.with_ymd_and_hms(2025, 6, 17, hour, 0, 0).unwrap(),
        }
    }

    #[test]
    fn low_risk_domestic_retail_purchase() {
        let tx = sample_tx(50.0, "US", "retail", 14);
        let result = score_transaction(&tx, Utc.with_ymd_and_hms(2025, 6, 17, 14, 0, 1).unwrap());

        assert_eq!(result.risk_score, 0);
        assert_eq!(result.risk_level, RiskLevel::Low);
        assert!(result.reasons.is_empty());
    }

    #[test]
    fn medium_risk_foreign_mid_amount() {
        let tx = sample_tx(1500.0, "GB", "retail", 12);
        let result = score_transaction(&tx, Utc.with_ymd_and_hms(2025, 6, 17, 12, 0, 1).unwrap());

        assert_eq!(result.risk_score, 35);
        assert_eq!(result.risk_level, RiskLevel::Medium);
        assert_eq!(result.reasons, vec!["high_amount_tier1", "foreign_country"]);
    }

    #[test]
    fn high_risk_crypto_night_large_amount() {
        let tx = sample_tx(6000.0, "US", "crypto", 2);
        let result = score_transaction(&tx, Utc.with_ymd_and_hms(2025, 6, 17, 2, 0, 1).unwrap());

        assert_eq!(result.risk_score, 75);
        assert_eq!(result.risk_level, RiskLevel::High);
        assert!(result.reasons.contains(&"high_amount_tier2".to_string()));
        assert!(result.reasons.contains(&"risky_merchant_category".to_string()));
        assert!(result.reasons.contains(&"night_transaction".to_string()));
    }

    #[test]
    fn high_risk_foreign_gambling_night_combined() {
        let tx = sample_tx(9000.0, "DE", "gambling", 1);
        let result = score_transaction(&tx, Utc.with_ymd_and_hms(2025, 6, 17, 1, 0, 1).unwrap());

        assert_eq!(result.risk_score, 90);
        assert_eq!(result.risk_level, RiskLevel::High);
        assert_eq!(
            result.reasons,
            vec![
                "high_amount_tier2".to_string(),
                "foreign_country".to_string(),
                "risky_merchant_category".to_string(),
                "night_transaction".to_string(),
            ]
        );
    }

    #[test]
    fn score_caps_at_one_hundred() {
        let tx = sample_tx(12000.0, "DE", "gambling", 1);
        let result = score_transaction(&tx, Utc.with_ymd_and_hms(2025, 6, 17, 1, 0, 1).unwrap());

        // tier2 (35) + tier3 (15) + foreign (15) + risky category (30) + night (10) = 105 → capped at 100
        assert_eq!(result.risk_score, 100);
        assert_eq!(result.risk_level, RiskLevel::High);
        assert!(result.reasons.contains(&"high_amount_tier3".to_string()));
    }
}
