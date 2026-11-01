### Background

Many LLM-powered agents are built as teams: several agents work in parallel, debate, or report to an orchestrator that splits up the task. Choosing a setup is an architectural decision, with consequences for cost, speed and reliability, but there is little established knowledge to guide it. A recent study by Kim et al. concluded that which setup works best depends heavily on the task.

### Why we did it

If that's true, every new use case has to be tested from scratch. But that conclusion rested mainly on task success from a few runs, with every agent using the same model. We replicated the study at three levels to see whether stability, mixed-model teams and cost show patterns that do carry over.

### What was hard

* **LLM results are noisy.** One run can mislead, so we ran every configuration ten times and checked that the averages had settled. The orchestrator-based setups needed the most repetitions.
* **A large space.** Three benchmarks, seven models from four families, five architectures, plus teams that mix strong and weak models.
* **Where the model runs matters.** For the Gemma-4 models, hosted inference more than doubled the run-to-run variation compared with running them locally, so we ran both and recommend reporting the backend.
