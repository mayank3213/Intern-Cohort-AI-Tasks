use std::process::Command;

use chrono::{TimeZone, Utc};
use fraud_scorer::{score_from_json, RiskScoreResult, TransactionInput};

#[test]
fn cli_scores_transaction_from_file() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let input = format!(
        "{manifest_dir}/../tests/fixtures/high_risk.json"
    );

    let output = Command::new(env!("CARGO_BIN_EXE_fraud-scorer"))
        .arg("score")
        .arg("--file")
        .arg(&input)
        .output()
        .expect("failed to run fraud-scorer");

    assert!(
        output.status.success(),
        "stderr: {}",
        String::from_utf8_lossy(&output.stderr)
    );

    let body = String::from_utf8(output.stdout).expect("stdout utf8");
    let parsed: RiskScoreResult = serde_json::from_str(&body).expect("valid score json");

    assert_eq!(parsed.transaction_id, "tx-cli-001");
    assert_eq!(parsed.risk_level, fraud_scorer::RiskLevel::High);
    assert!(parsed.risk_score >= 60);
}

#[test]
fn library_and_cli_agree_on_fixture() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let raw = std::fs::read_to_string(format!("{manifest_dir}/../tests/fixtures/high_risk.json"))
        .expect("read fixture");
    let now = Utc.with_ymd_and_hms(2025, 6, 17, 2, 0, 5).unwrap();

    let library_score = score_from_json(&raw, now).expect("library score");
    let tx: TransactionInput = serde_json::from_str(&raw).expect("parse tx");
    let direct_score = fraud_scorer::score_transaction(&tx, now);

    assert_eq!(library_score.risk_score, direct_score.risk_score);
    assert_eq!(library_score.risk_level, direct_score.risk_level);
}
