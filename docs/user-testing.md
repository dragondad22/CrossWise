# CrossWise User Testing Guide

This guide is written for non-technical testers who want to help improve CrossWise. It explains what the product does, how to run through the main workflows, how to capture feedback, and how to log GitHub issues.

---

## 1. What Is CrossWise?
CrossWise turns curated word & clue lists into playable crossword puzzles grouped by topic. Testers will help verify that:
- Topics and lists can be managed easily.
- Puzzles generate correctly from those lists.
- The solving experience (keyboard, autosave, win screen) works and feels smooth.

### What You’ll Need
- A desktop or laptop with a modern browser (Chrome, Edge, Safari, Firefox).  
- A GitHub account (free) for tracking issues.  
- Optional: your own word lists for extra testing.

---

## 2. How To Access The Test Build
Your organizer will provide one of these options:

| Option | Steps |
| --- | --- |
| Hosted link | Click the shared website link, log in with provided test credentials. |
| Local build | Follow the `docs/setup.md` instructions (requires Node.js). Use `npm run dev` and open `http://localhost:3000`. |

If you hit problems during setup, note what happened and continue with the parts you can access.

---

## 3. Test Workflow Checklist
Work through the tasks in order. Capture notes or screenshots whenever something feels confusing, slow, incorrect, or delightful.

### A. Explore Topics & Lists
1. Visit the Topics page.  
2. Create a new topic (e.g., “Animals”) with a color/icon.  
3. Edit the topic name or icon – does it update quickly?  
4. Delete a topic you no longer need (unless asked to keep it).

### B. Import a Word List
1. Open a topic and choose “Import List.”  
2. Use the provided sample JSON or CSV, or import your own.  
3. Confirm clues/answers appear as expected.  
4. Try adding a single new clue manually.  
5. If something fails, copy the error message and continue.

### C. Generate a Puzzle
1. From a list, click “Generate Puzzle.”  
2. Choose default settings first.  
3. Note how long generation takes.  
4. If it fails, record the message and the list you were using.

### D. Solve the Puzzle
1. Click a cell and type letter answers.  
2. Use arrow keys and Tab to move around.  
3. Note that checking is automatic — there are no “Check letter/word” buttons; correct entries are confirmed for you as you type.  
4. Fill in a full word and confirm it highlights in green, locks to prevent accidental edits, and focus jumps to the next clue automatically.  
5. Close the page or refresh—autosave should restore progress.  
6. Solve the whole puzzle and confirm you see a win state.

### E. Export & Logout
1. Export puzzle state or list as JSON/CSV.  
2. Verify the download works and note the filename.  
3. Log out and confirm you’re redirected properly.

---

## 4. Recording Feedback
As you work, gather:
- **What you did:** include page, button, and any settings used.  
- **What you expected:** describe what you thought would happen.  
- **What happened:** note error messages, unexpected behavior, or design issues.  
- **Context:** browser name/version, operating system, screenshots or screen recordings.

Use a shared document or spreadsheet if provided. Otherwise, log issues directly in GitHub (see below).

---

## 5. Logging Issues On GitHub

### Create a GitHub Account (if needed)
Visit [github.com](https://github.com) and sign up. Verify by email.

### Open a New Issue
1. Go to the CrossWise repository page (link provided by the team).  
2. Click the **Issues** tab, then **New issue**.  
3. Use the following template:

```
Title: Short description (e.g., “Autosave did not restore puzzle”)

Describe the issue:
- What I was doing:
- What I expected:
- What happened instead:
- Browser & device:
- Screenshots / screen recording: (attach if possible)
- Additional notes:
```

4. Add any labels suggested by the team (e.g., `bug`, `UI/UX`).  
5. Click **Submit new issue**.

### Track Progress
- Watch the repository (top-right **Watch** button) to get updates.  
- Check back on your issue for developer questions or status changes.  
- Mark your local notes as “logged” once an issue is in GitHub.

---

## 6. After Testing
1. Make sure every finding is either in GitHub or captured in the shared notes.  
2. Share any positive feedback or suggestions, not just bugs.  
3. Provide overall impressions: Was anything confusing? What would you improve first?  
4. Log out and close all windows.

---

## 7. Need Help?
- Contact the CrossWise team lead or QA coordinator through the channel they provided (email, Slack, etc.).  
- If GitHub is confusing, let the team know; they can log an issue on your behalf.  
- Feel free to repeat sections (for example, try a second puzzle) to uncover more insights.

Thank you for helping make CrossWise better! Your feedback directly shapes the improvements we build next. 🎉
