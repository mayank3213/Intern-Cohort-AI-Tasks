use log_counter::{count_log_file, format_counts, CountError};
use std::env;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() != 2 {
        eprintln!("usage: {} <log-file>", args[0]);
        process::exit(1);
    }

    let path = &args[1];

    match count_log_file(path) {
        Ok(counts) => println!("{}", format_counts(&counts)),
        Err(CountError::MissingFile { path }) => {
            eprintln!("error: file not found: {path}");
            process::exit(1);
        }
        Err(CountError::ReadFailed { path, source }) => {
            eprintln!("error: failed to read {path}: {source}");
            process::exit(1);
        }
    }
}
