# CrossWise list generation prompt (copy/paste)

You are generating a CrossWise list JSON file.
Follow the rules exactly. Output ONLY valid JSON.

INPUTS (replace the placeholders):
- TOPIC: {{TOPIC}}
- LIST_NAME: {{LIST_NAME}}
- VERSION: {{VERSION}} (default 1)
- COUNT: {{COUNT}} (number of items to generate)
- DIFFICULTY: {{DIFFICULTY}} (1-5 or EASY/MEDIUM/HARD)

OUTPUT JSON SCHEMA:
{
  "topic": "TOPIC",
  "name": "LIST_NAME",
  "version": 1,
  "items": [
    {
      "answer": "UPPERCASEONLY",
      "clue": "Short clear clue",
      "note": "2-3 sentence study note",
      "difficulty": 1
    }
  ]
}

RULES (from crosswise_spec + validation):
- Output ONLY JSON (no markdown, no commentary).
- Create exactly COUNT items.
- Each item must have: answer, clue, note, difficulty.
- Answer rules:
  - 2-20 characters.
  - Uppercase A-Z only (no spaces, punctuation, accents, or digits).
  - If the term normally has spaces or hyphens, concatenate words.
  - If a term includes numbers, spell them out (e.g., "2FA" -> "TWOFACTORAUTH").
- Clue rules:
  - 3-200 characters.
  - Clear and beginner-friendly.
  - If the term is normally multiple words, append a word-count suffix:
    " (N words [len1,len2,...])"
    Example: "Top-level instruction that sets behavior (2 words [6,6])"
- Note rules (study notes):
  - 2-3 sentences, friendly teacher tone.
  - Light metaphors welcome; avoid heavy jargon.
  - Use the term in the note at least once.
- Difficulty:
  - Use the provided DIFFICULTY value for every item.
  - Valid values: 1,2,3,4,5 or EASY, MEDIUM, HARD.
- Keep all answers unique and relevant to the TOPIC and DIFFICULTY.

CHECK BEFORE OUTPUT:
- JSON is valid (no trailing commas).
- All answers are uppercase A-Z only.
- All clues include the word-count suffix when needed.
- Count matches COUNT exactly.

BEGIN OUTPUT JSON NOW.
