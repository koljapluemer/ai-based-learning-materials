import type { OutputShapeType } from '../../entities/app-db'

export interface OutputShapeDefinition {
  id: OutputShapeType
  label: string
  description: string
  jsonSchema: {
    name: string
    strict?: boolean
    schema: unknown
  }
  guidance: string
  createJsonSchema?: (minItems: number) => { name: string; strict?: boolean; schema: unknown }
  canBeDownloadedAsCsv: boolean
  convertToCsv?: (data: unknown) => string
}

const escapeCsvValue = (value: string) => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
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
      return `${escapeCsvValue(flashcard.front)},${escapeCsvValue(flashcard.back)}`
    })

    return ['front,back', ...rows].join('\n')
  }
}

const memorizationCafeFlashcards: OutputShapeDefinition = {
  id: 'memorization-cafe-flashcards',
  label: 'Memorization Cafe Flashcards',
  description:
    'Creates flashcards with practice metadata for prompts and reverse recall.',
  jsonSchema: {
    name: 'MemorizationCafeFlashcards',
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
            required: [
              'front',
              'back',
              'practiceAsFlashcard',
              'practiceAsPrompt',
              'practiceReverse'
            ],
            properties: {
              front: { type: 'string', description: 'Question or cue shown to the learner' },
              back: { type: 'string', description: 'Expected answer or explanation' },
              practiceAsFlashcard: {
                type: 'boolean',
                const: true,
                description: 'Always true. Marks the card as usable for flashcard drilling.'
              },
              practiceAsPrompt: {
                type: 'boolean',
                description:
                  'True only when the learner should type out a free-form answer for practice.'
              },
              practiceReverse: {
                type: 'boolean',
                description:
                  'True only when it makes sense to study the card from back to front as well.'
              }
            }
          }
        }
      }
    }
  },
  guidance:
    'Produce flashcards suited for Memorization Cafe practice. Always include front and back text plus three booleans: practiceAsFlashcard (always true), practiceAsPrompt (true only when a typed answer is valuable), and practiceReverse (true only when reverse recall is useful, such as vocabulary translation pairs). Respond with a JSON object containing a "flashcards" array.',
  createJsonSchema: (minItems: number) => ({
    name: 'MemorizationCafeFlashcards',
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
            required: [
              'front',
              'back',
              'practiceAsFlashcard',
              'practiceAsPrompt',
              'practiceReverse'
            ],
            properties: {
              front: { type: 'string', description: 'Question or cue shown to the learner' },
              back: { type: 'string', description: 'Expected answer or explanation' },
              practiceAsFlashcard: {
                type: 'boolean',
                const: true,
                description: 'Always true. Marks the card as usable for flashcard drilling.'
              },
              practiceAsPrompt: {
                type: 'boolean',
                description:
                  'True only when the learner should type out a free-form answer for practice.'
              },
              practiceReverse: {
                type: 'boolean',
                description:
                  'True only when it makes sense to study the card from back to front as well.'
              }
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
      const flashcard = item as {
        front: string
        back: string
        practiceAsFlashcard: boolean
        practiceAsPrompt: boolean
        practiceReverse: boolean
      }
      const boolToString = (value: boolean | undefined) => (value ? 'true' : 'false')
      return [
        escapeCsvValue(flashcard.front),
        escapeCsvValue(flashcard.back),
        boolToString(flashcard.practiceAsFlashcard),
        boolToString(flashcard.practiceAsPrompt),
        boolToString(flashcard.practiceReverse)
      ].join(',')
    })

    return [
      'front,back,practiceAsFlashcard,practiceAsPrompt,practiceReverse',
      ...rows
    ].join('\n')
  }
}

export const outputShapes: Record<OutputShapeType, OutputShapeDefinition> = {
  'simple-flashcards': simpleFlashcards,
  'memorization-cafe-flashcards': memorizationCafeFlashcards
}

export const getOutputShapeDefinition = (shape: OutputShapeType) => outputShapes[shape]
