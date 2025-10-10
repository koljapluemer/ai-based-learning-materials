import type { OutputShapeType } from '../../entities/app-db'

export interface OutputShapeDefinition {
  id: OutputShapeType
  label: string
  description: string
  jsonSchema: {
    name: string
    schema: unknown
  }
  guidance: string
  createJsonSchema?: (minItems: number) => { name: string; schema: unknown }
  canBeDownloadedAsCsv: boolean
  convertToCsv?: (data: unknown) => string
}

const simpleFlashcards: OutputShapeDefinition = {
  id: 'simple-flashcards',
  label: 'Simple Flashcards',
  description: 'Creates a list of concise flashcards with front/back text.',
  jsonSchema: {
    name: 'SimpleFlashcards',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['flashcards'],
      properties: {
        flashcards: {
          type: 'array',
          minItems: 5,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['front', 'back'],
            properties: {
              front: { type: 'string', description: 'Question or prompt' },
              back: { type: 'string', description: 'Answer or explanation' }
            }
          }
        }
      }
    }
  },
  guidance:
    'Produce concise Q/A flashcards that cover the most important facts. Each flashcard should have a descriptive front and an informative back. Respond with a JSON object containing a "flashcards" array.',
  createJsonSchema: (minItems: number) => ({
    name: 'SimpleFlashcards',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['flashcards'],
      properties: {
        flashcards: {
          type: 'array',
          minItems,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['front', 'back'],
            properties: {
              front: { type: 'string', description: 'Question or prompt' },
              back: { type: 'string', description: 'Answer or explanation' }
            }
          }
        }
      }
    }
  }),
  canBeDownloadedAsCsv: true,
  convertToCsv: (data: unknown) => {
    if (!Array.isArray(data)) {
      throw new Error('Invalid flashcard data')
    }

    const rows = data.map((item) => {
      const flashcard = item as { front: string; back: string }
      const escapeCsv = (str: string) => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      return `${escapeCsv(flashcard.front)},${escapeCsv(flashcard.back)}`
    })

    return ['Front,Back', ...rows].join('\n')
  }
}

export const outputShapes: Record<OutputShapeType, OutputShapeDefinition> = {
  'simple-flashcards': simpleFlashcards
}

export const getOutputShapeDefinition = (shape: OutputShapeType) => outputShapes[shape]
