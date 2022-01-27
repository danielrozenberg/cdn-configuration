---
title: 'Workflow failed: {{ env.WORKFLOW_NAME }}'
---

The workflow `{{ env.WORKFLOW_NAME }}` failed. See logs:
https://github.com/{{ env.REPO_SLUG }}/actions/runs/{{ env.RUN_ID }}

// cc: {{ env.MENTION }}
