# Log Counter (Rust CLI)

Small command-line tool that reads a log file and counts lines containing **INFO**, **WARN**, or **ERROR** log levels.

## Usage

```bash
cargo run -- sample.log
```

Example output:

```text
INFO: 2
WARN: 1
ERROR: 1
```

Built binary:

```bash
cargo build --release
./target/release/log-counter sample.log
```

## Supported log patterns

Each line is counted at most once. Matching is case-insensitive and recognizes common formats such as:

- `2024-06-16 10:00:00 INFO message`
- `[WARN] message`
- `ERROR: connection failed`

If a line could match multiple levels, **ERROR** wins over **WARN**, which wins over **INFO**.

## Missing files

If the path does not exist, the CLI prints a clear error to stderr and exits with code `1` (no panic):

```bash
cargo run -- missing.log
# error: file not found: missing.log
```

## Commands

From this folder (`tasks/Basics/B6`):

| Command | Description |
|---------|-------------|
| `cargo build` | Compile debug binary |
| `cargo build --release` | Compile optimized binary |
| `cargo run -- <file>` | Run the CLI against a log file |
| `cargo test` | Run unit tests |
| `cargo test -- --nocapture` | Run tests with stdout visible |
| `cargo check` | Fast compile check without producing a binary |

## Sample log

`sample.log` is included for manual testing:

```bash
cargo run -- sample.log
```
