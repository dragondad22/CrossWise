import { ListWithItemsAndTopic } from '@/types/database'
import { CrosswordGrid, CrosswordNumbering, SolveState } from '@/types/crossword'

type RawImportItem = {
  answer?: unknown
  clue?: unknown
  note?: unknown
  difficulty?: unknown
}

export interface ExportFormat {
  json: 'json'
  csv: 'csv'
  pdf: 'pdf' // stretch goal
  png: 'png' // stretch goal
}

export function exportListAsJSON(list: ListWithItemsAndTopic): string {
  const exportData = {
    topic: list.topic.name,
    name: list.name,
    version: list.version,
    items: list.items.map((item) => ({
      answer: item.answer,
      clue: item.clue,
      ...(item.note && { note: item.note }),
      ...(item.difficulty && {
        difficulty: item.difficulty === 'EASY' ? 1 : item.difficulty === 'MEDIUM' ? 2 : 3,
      }),
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

export function exportListAsCSV(list: ListWithItemsAndTopic): string {
  const headers = ['answer', 'clue', 'difficulty', 'note']
  const csvLines = [headers.join(',')]

  for (const item of list.items) {
    const row = [
      `"${item.answer}"`,
      `"${item.clue.replace(/"/g, '""')}"`,
      item.difficulty || 'MEDIUM',
      item.note ? `"${item.note.replace(/"/g, '""')}"` : '',
    ]
    csvLines.push(row.join(','))
  }

  return csvLines.join('\n')
}

export function exportPuzzleState(
  puzzleId: string,
  grid: CrosswordGrid,
  numbering: CrosswordNumbering,
  solveState: SolveState,
): string {
  const exportData = {
    puzzleId,
    exportedAt: new Date().toISOString(),
    grid: {
      size: grid.size,
      // Only export the structure, not the answers
      cells: grid.cells.map((row) =>
        row.map((cell) => ({
          row: cell.row,
          col: cell.col,
          type: cell.type,
          number: cell.number,
        })),
      ),
    },
    clues: {
      across: numbering.across.map((clue) => ({
        number: clue.number,
        clue: clue.clue,
        length: clue.length,
        row: clue.row,
        col: clue.col,
      })),
      down: numbering.down.map((clue) => ({
        number: clue.number,
        clue: clue.clue,
        length: clue.length,
        row: clue.row,
        col: clue.col,
      })),
    },
    solveState: {
      filledCells: solveState.filledCells,
      startTime: solveState.startTime,
      endTime: solveState.endTime,
      completedAt: solveState.endTime ? solveState.endTime : null,
    },
  }

  return JSON.stringify(exportData, null, 2)
}

// Escape user-provided text (list names, clues) so markup or scripts inside it
// render as inert text in the printable document.
function escapeHTML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Build a fully self-contained printable HTML document for a blank crossword:
 * an empty numbered grid plus across/down clue lists. Mirrors the
 * structure-only discipline of `exportPuzzleState` — no answer letters are
 * ever written to the output (#2).
 */
export function buildPrintableCrosswordHTML(
  listName: string,
  grid: CrosswordGrid,
  numbering: CrosswordNumbering,
): string {
  // Start-of-word numbers, mirroring CrosswordGrid's getCellNumber
  // (across preferred when both directions start on the same cell).
  const cellNumbers = new Map<string, number>()
  for (const clue of numbering.down) {
    cellNumbers.set(`${clue.row},${clue.col}`, clue.number)
  }
  for (const clue of numbering.across) {
    cellNumbers.set(`${clue.row},${clue.col}`, clue.number)
  }

  // Size cells so grids up to 19x19 fit the printable width of A4/Letter
  // (~180mm inside the @page margins), capped at 10mm for small grids.
  const maxDimension = Math.max(grid.size.rows, grid.size.cols, 1)
  const cellMm = Math.min(10, Math.round((180 / maxDimension) * 10) / 10)

  const rowsHtml = grid.cells
    .map((row) => {
      const cells = row
        .map((cell) => {
          if (cell.type === 'block') {
            return '<td class="block"></td>'
          }
          const number = cellNumbers.get(`${cell.row},${cell.col}`)
          return `<td class="cell">${number ? `<span class="num">${number}</span>` : ''}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('\n')

  const clueItems = (clues: CrosswordNumbering['across']) =>
    clues
      .map((clue) => `<li value="${clue.number}">${escapeHTML(clue.clue)}</li>`)
      .join('\n')

  const safeName = escapeHTML(listName)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeName} — crossword</title>
<style>
  @page { margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #111;
    padding: 8mm;
  }
  h1 { font-size: 7mm; margin-bottom: 6mm; }
  h2 { font-size: 5mm; margin-bottom: 2.5mm; }
  table.grid { border-collapse: collapse; margin-bottom: 8mm; }
  table.grid td {
    width: ${cellMm}mm;
    height: ${cellMm}mm;
    border: 0.35mm solid #333;
    position: relative;
    padding: 0;
  }
  td.block {
    background: #1a1a1a;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  td.cell { background: #fff; }
  td.cell .num {
    position: absolute;
    top: 0.5mm;
    left: 0.7mm;
    font-size: ${Math.max(2.2, cellMm * 0.3).toFixed(1)}mm;
    line-height: 1;
    color: #444;
  }
  .clues { display: flex; gap: 12mm; align-items: flex-start; }
  .clues > section { flex: 1; }
  .clues ol { list-style-position: inside; font-size: 3.6mm; line-height: 1.6; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
<h1>${safeName}</h1>
<table class="grid" aria-hidden="true">
${rowsHtml}
</table>
<div class="clues">
<section>
<h2>Across</h2>
<ol>
${clueItems(numbering.across)}
</ol>
</section>
<section>
<h2>Down</h2>
<ol>
${clueItems(numbering.down)}
</ol>
</section>
</div>
</body>
</html>
`
}

/**
 * Open the printable crossword in a new tab and trigger the print dialog.
 * If the popup is blocked, fall back to downloading the HTML file so the
 * user can open and print it manually.
 */
export function openPrintableCrossword(html: string, fallbackFilename: string) {
  if (typeof window === 'undefined') return

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    downloadFile(html, fallbackFilename, 'text/html')
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export function downloadFile(
  content: string,
  filename: string,
  contentType: string = 'application/json',
) {
  if (typeof window === 'undefined') return

  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateFilename(
  baseName: string,
  extension: string,
  includeTimestamp: boolean = true,
): string {
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_')
  const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : ''
  return `${sanitizedName}${timestamp}.${extension}`
}

// Import functionality
export function parseImportFile(content: string, filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'json':
      return parseJSONImport(content)
    case 'csv':
      return parseCSVImport(content)
    default:
      throw new Error(`Unsupported file format: ${extension}`)
  }
}

function parseJSONImport(content: string) {
  try {
    const data = JSON.parse(content)

    // Validate required fields
    if (!data.topic || !data.name || !Array.isArray(data.items)) {
      throw new Error('Invalid JSON format: missing required fields (topic, name, items)')
    }

    if (data.items.length === 0) {
      throw new Error('List must contain at least one item')
    }

    // Validate items
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i]
      if (!item.answer || !item.clue) {
        throw new Error(`Item ${i + 1}: missing answer or clue`)
      }
    }

    return {
      format: 'json' as const,
      data: {
        topic: String(data.topic),
        name: String(data.name),
        version: Number(data.version) || 1,
        items: data.items.map((item: RawImportItem) => ({
          // Uppercase only — disallowed characters must survive to validation so
          // the import is denied with an error naming the word, not silently
          // stripped (#17).
          answer: String(item.answer).toUpperCase(),
          clue: String(item.clue),
          note: item.note ? String(item.note) : undefined,
          difficulty: item.difficulty ? Number(item.difficulty) : undefined,
        })),
      },
    }
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function parseCSVImport(content: string) {
  try {
    const lines = content.trim().split('\n')

    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0]
      .toLowerCase()
      .split(',')
      .map((h) => h.trim().replace(/"/g, ''))
    const answerIndex = headers.findIndex((h) => h.includes('answer'))
    const clueIndex = headers.findIndex((h) => h.includes('clue'))

    if (answerIndex === -1 || clueIndex === -1) {
      throw new Error('CSV must contain "answer" and "clue" columns')
    }

    const items: Array<{
      answer: string
      clue: string
      note?: string
      difficulty?: number
    }> = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])

      if (values[answerIndex] && values[clueIndex]) {
        items.push({
          // Uppercase only — see parseJSONImport (#17).
          answer: values[answerIndex].toUpperCase(),
          clue: values[clueIndex],
          note: undefined,
          difficulty: undefined,
        })
      }
    }

    if (items.length === 0) {
      throw new Error('No valid items found in CSV')
    }

    return {
      format: 'csv' as const,
      data: {
        topic: 'Imported from CSV',
        name: 'CSV Import',
        version: 1,
        items,
      },
    }
  } catch (error) {
    throw new Error(`Invalid CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip the next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}
