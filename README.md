# Project Workspace

This workspace is set up using a **3-layer architecture** designed to separate concerns, maximize reliability, and combine probabilistic LLM decision-making with deterministic execution.

## Directory Structure

- **`directives/`**: Contains Standard Operating Procedures (SOPs) written in Markdown (Layer 1: What to do).
- **`execution/`**: Contains deterministic Python scripts that perform the actual work (Layer 3: Doing the work).
- **`.tmp/`**: Holds intermediate processing files (dossiers, scraped data, logs). This directory is kept in Git via `.gitkeep`, but its contents are ignored.
- **`.env`**: Holds local environment variables, API tokens, and secrets (ignored by Git).
- **`gemini.md`**: Outlines the architectural rules and principles.

## Workflow

1. **Directive**: Write or select a directive SOP in `directives/` (e.g. `directives/my_task.md`).
2. **Orchestration**: The AI agent (Layer 2) reads the directive and plans the routing.
3. **Execution**: The AI agent calls the deterministic Python scripts in `execution/` to fulfill the directive step-by-step.
4. **Learn & Improve**: Update the directives with edge cases, learnings, and optimizations discovered during execution.
