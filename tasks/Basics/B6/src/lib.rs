use std::fs;
use std::io;
use std::path::Path;

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct LogCounts {
    pub info: u32,
    pub warn: u32,
    pub error: u32,
}

#[derive(Debug, PartialEq, Eq)]
pub enum CountError {
    MissingFile { path: String },
    ReadFailed { path: String, source: io::Error },
}

impl std::fmt::Display for CountError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::MissingFile { path } => write!(f, "file not found: {path}"),
            Self::ReadFailed { path, source } => {
                write!(f, "failed to read {path}: {source}")
            }
        }
    }
}

impl std::error::Error for CountError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::ReadFailed { source, .. } => Some(source),
            Self::MissingFile { .. } => None,
        }
    }
}

/// Count INFO, WARN, and ERROR entries in log text.
/// Each line is classified at most once; ERROR takes precedence over WARN over INFO.
pub fn count_log_levels(content: &str) -> LogCounts {
    let mut counts = LogCounts::default();

    for line in content.lines() {
        match classify_line(line) {
            Some(Level::Info) => counts.info += 1,
            Some(Level::Warn) => counts.warn += 1,
            Some(Level::Error) => counts.error += 1,
            None => {}
        }
    }

    counts
}

/// Read a file from disk and count log levels.
pub fn count_log_file<P: AsRef<Path>>(path: P) -> Result<LogCounts, CountError> {
    let path = path.as_ref();
    let path_display = path.display().to_string();

    if !path.exists() {
        return Err(CountError::MissingFile {
            path: path_display,
        });
    }

    let content = fs::read_to_string(path).map_err(|source| CountError::ReadFailed {
        path: path_display,
        source,
    })?;

    Ok(count_log_levels(&content))
}

pub fn format_counts(counts: &LogCounts) -> String {
    format!(
        "INFO: {}\nWARN: {}\nERROR: {}",
        counts.info, counts.warn, counts.error
    )
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Level {
    Info,
    Warn,
    Error,
}

fn classify_line(line: &str) -> Option<Level> {
    let upper = line.to_uppercase();

    if line_has_level(&upper, "ERROR") {
        Some(Level::Error)
    } else if line_has_level(&upper, "WARN") {
        Some(Level::Warn)
    } else if line_has_level(&upper, "INFO") {
        Some(Level::Info)
    } else {
        None
    }
}

fn line_has_level(line: &str, level: &str) -> bool {
    line.contains(&format!(" {level} "))
        || line.contains(&format!("[{level}]"))
        || line.starts_with(level)
        || line.contains(&format!("{level}:"))
        || line.contains(&format!("\t{level}\t"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_mixed_levels() {
        let input = "\
2024-06-16 10:00:00 INFO User logged in
2024-06-16 10:00:01 WARN Disk space low
2024-06-16 10:00:02 ERROR Connection failed
[INFO] cache warmed
[WARN] retry scheduled
";

        let counts = count_log_levels(input);
        assert_eq!(counts.info, 2);
        assert_eq!(counts.warn, 2);
        assert_eq!(counts.error, 1);
    }

    #[test]
    fn ignores_lines_without_levels() {
        let input = "plain text\nDEBUG trace\n";
        let counts = count_log_levels(input);
        assert_eq!(counts, LogCounts::default());
    }

    #[test]
    fn error_takes_precedence_over_info_on_same_line() {
        let input = "ERROR while handling INFO request\n";
        let counts = count_log_levels(input);
        assert_eq!(counts.info, 0);
        assert_eq!(counts.warn, 0);
        assert_eq!(counts.error, 1);
    }

    #[test]
    fn count_missing_file_returns_error() {
        let result = count_log_file("/no/such/log-file.log");
        assert!(matches!(result, Err(CountError::MissingFile { .. })));
    }

    #[test]
    fn format_counts_output() {
        let output = format_counts(&LogCounts {
            info: 3,
            warn: 1,
            error: 2,
        });
        assert_eq!(output, "INFO: 3\nWARN: 1\nERROR: 2");
    }
}
