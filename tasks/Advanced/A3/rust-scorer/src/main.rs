use std::fs;
use std::io::{self, Read};
use std::process::ExitCode;

use chrono::Utc;
use clap::{Parser, Subcommand};
use fraud_scorer::{score_from_json, score_transaction, TransactionInput};

#[derive(Parser)]
#[command(name = "fraud-scorer", about = "Compute fraud risk scores for transactions")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Score a transaction from stdin, a file, or inline JSON
    Score {
        /// Path to a JSON file containing a TransactionInput payload
        #[arg(long)]
        file: Option<String>,
        /// Inline JSON string (alternative to stdin/file)
        #[arg(long)]
        json: Option<String>,
    },
}

fn read_input(file: Option<&str>, inline: Option<&str>) -> Result<String, String> {
    if let Some(path) = file {
        fs::read_to_string(path).map_err(|err| format!("failed to read {path}: {err}"))
    } else if let Some(raw) = inline {
        Ok(raw.to_string())
    } else {
        let mut buffer = String::new();
        io::stdin()
            .read_to_string(&mut buffer)
            .map_err(|err| format!("failed to read stdin: {err}"))?;
        if buffer.trim().is_empty() {
            Err("no input provided; pass --file, --json, or pipe JSON on stdin".to_string())
        } else {
            Ok(buffer)
        }
    }
}

fn main() -> ExitCode {
    let cli = Cli::parse();

    match cli.command {
        Commands::Score { file, json } => match run_score(file.as_deref(), json.as_deref()) {
            Ok(output) => {
                println!("{output}");
                ExitCode::SUCCESS
            }
            Err(message) => {
                eprintln!("error: {message}");
                ExitCode::FAILURE
            }
        },
    }
}

fn run_score(file: Option<&str>, inline: Option<&str>) -> Result<String, String> {
    let raw = read_input(file, inline)?;
    let now = Utc::now();

    let result = if let Ok(tx) = serde_json::from_str::<TransactionInput>(&raw) {
        score_transaction(&tx, now)
    } else {
        score_from_json(&raw, now)?
    };

    result
        .to_json()
        .map_err(|err| format!("failed to serialize score: {err}"))
}
