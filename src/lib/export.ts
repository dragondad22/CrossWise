import { ListWithItemsAndTopic } from '@/types/database'
import { CrosswordGrid, CrosswordNumbering, SolveState } from '@/types/crossword'

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
    items: list.items.map(item => ({
      answer: item.answer,
      clue: item.clue,
      ...(item.note && { note: item.note }),
      ...(item.difficulty && { 
        difficulty: item.difficulty === 'EASY' ? 1 : 
                   item.difficulty === 'MEDIUM' ? 2 : 3 
      })
    }))
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
      item.note ? `"${item.note.replace(/"/g, '""')}"` : ''
    ]
    csvLines.push(row.join(','))
  }
  
  return csvLines.join('\n')
}

export function exportPuzzleState(
  puzzleId: string,
  grid: CrosswordGrid,
  numbering: CrosswordNumbering,
  solveState: SolveState
): string {
  const exportData = {
    puzzleId,
    exportedAt: new Date().toISOString(),
    grid: {
      size: grid.size,
      // Only export the structure, not the answers
      cells: grid.cells.map(row => 
        row.map(cell => ({
          row: cell.row,
          col: cell.col,
          type: cell.type,
          number: cell.number
        }))
      )
    },
    clues: {
      across: numbering.across.map(clue => ({
        number: clue.number,
        clue: clue.clue,
        length: clue.length,
        row: clue.row,
        col: clue.col
      })),
      down: numbering.down.map(clue => ({
        number: clue.number,
        clue: clue.clue,
        length: clue.length,
        row: clue.row,
        col: clue.col
      }))
    },
    solveState: {
      filledCells: solveState.filledCells,
      startTime: solveState.startTime,
      endTime: solveState.endTime,
      completedAt: solveState.endTime ? solveState.endTime : null
    }
  }
  
  return JSON.stringify(exportData, null, 2)
}

export function downloadFile(content: string, filename: string, contentType: string = 'application/json') {
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

export function generateFilename(baseName: string, extension: string, includeTimestamp: boolean = true): string {
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
        items: data.items.map((item: any) => ({
          answer: String(item.answer).toUpperCase().replace(/[^A-Z]/g, ''),
          clue: String(item.clue),
          note: item.note ? String(item.note) : undefined,
          difficulty: item.difficulty ? Number(item.difficulty) : undefined
        }))
      }
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
    
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
    const answerIndex = headers.findIndex(h => h.includes('answer'))
    const clueIndex = headers.findIndex(h => h.includes('clue'))
    
    if (answerIndex === -1 || clueIndex === -1) {
      throw new Error('CSV must contain "answer" and "clue" columns')
    }
    
    const items = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      
      if (values[answerIndex] && values[clueIndex]) {
        items.push({
          answer: values[answerIndex].toUpperCase().replace(/[^A-Z]/g, ''),
          clue: values[clueIndex],
          note: undefined,
          difficulty: undefined
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
        items
      }
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