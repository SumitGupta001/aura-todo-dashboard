# Execution Scripts (`execution/`)

This directory contains deterministic Python scripts that perform the actual work (Layer 3 of the architecture).

## Best Practices

1. **Deterministic & Testable**: Scripts should do one thing well, take command-line arguments or configuration inputs, and run predictably.
2. **Environment Variables**: Load secrets (API keys, credentials) from `.env` using libraries like `python-dotenv`. Do not hardcode secrets.
3. **Google API / OAuth**: Use `credentials.json` and `token.json` (stored in the root, excluded from Git) for authentication.
4. **Intermediate Files**: Write temporary outputs or cache files to `.tmp/` at the project root.
5. **Robust Error Handling**: Handle API rate limits, timeouts, and missing files gracefully, printing clear logs.
6. **No CD Commands**: Always run scripts from the project root.
