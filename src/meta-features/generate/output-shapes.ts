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
}

const simpleFlashcards: OutputShapeDefinition = {
  id: 'simple-flashcards',
  label: 'Simple Flashcards',
  description: 'Creates concise flashcards with front/back text.',
  jsonSchema: {
    name: 'SimpleFlashcards',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        flashcards: {
          type: 'array',
          minItems: 1,
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
      },
      required: ['flashcards']
    }
  },
  guidance:
    'Produce concise Q/A flashcards that cover the most important facts. Each flashcard should have a descriptive front and an informative back.'
}

export const outputShapes: Record<OutputShapeType, OutputShapeDefinition> = {
  'simple-flashcards': simpleFlashcards
}

export const getOutputShapeDefinition = (shape: OutputShapeType) => outputShapes[shape]
