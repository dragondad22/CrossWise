Save a checkpoint of current work state to memory for session continuity.

1. Summarize what was accomplished in this session.
2. Identify any work still in progress.
3. List open decisions, blockers, or questions.
4. Note what should be done next.
5. Save this as a project memory file with:
   - name: `checkpoint_<date>`
   - type: project
   - description: Session checkpoint — <brief summary>
6. Update the memory index (`MEMORY.md`) with a pointer to the new checkpoint.
7. If a previous checkpoint memory exists, update it rather than creating a duplicate.

> Note: this uses Claude Code's persistent memory. If memory isn't set up for this
> project, save the checkpoint to `docs/runbooks/` or the decision log instead.
