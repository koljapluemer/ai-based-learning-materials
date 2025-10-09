import type { MaterialRecord, PromptRecord } from '../../entities/app-db'
import type { SettingsRecord } from '../../entities/settings/settings'
import { getOutputShapeDefinition } from './output-shapes'

export interface GenerateParams {
  apiKey: string
  prompt: PromptRecord
  materials: MaterialRecord[]
  model?: string
}

export interface GenerateResult {
  json: unknown
  rawText: string
}

const DEFAULT_MODEL = 'gpt-4.1-mini'

const decodeDataUrl = (dataUrl: string) => {
  const [, base64] = dataUrl.split(',')
  if (!base64) {
    return ''
  }
  try {
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  } catch {
    return ''
  }
}

const summariseMaterial = (material: MaterialRecord) => {
  if (material.mimeType.startsWith('text/') || material.mimeType.includes('json')) {
    const text = decodeDataUrl(material.dataUrl).slice(0, 6000)
    return `File: ${material.name}\nType: ${material.mimeType}\nContent:\n${text}`
  }
  return `File: ${material.name}\nType: ${material.mimeType}\nThis file is not textual. Provide concise flashcards based on its description or filename if possible.`
}

const buildMessages = (prompt: PromptRecord, materials: MaterialRecord[]) => [
  {
    role: 'system',
    content:
      'You are an assistant that creates learning materials from provided user documents. Always follow the requested output shape strictly.'
  },
  {
    role: 'user',
    content: [
      prompt.content,
      '',
      'Materials:',
      materials.map((material) => summariseMaterial(material)).join('\n\n')
    ].join('\n')
  }
]

export const generateLearningMaterials = async ({
  apiKey,
  prompt,
  materials,
  model = DEFAULT_MODEL
}: GenerateParams): Promise<GenerateResult> => {
  if (!apiKey) {
    throw new Error('Missing API key')
  }
  if (!materials.length) {
    throw new Error('Select at least one material')
  }
  const outputShapeDefinition = getOutputShapeDefinition(prompt.outputShape)
  if (!outputShapeDefinition) {
    throw new Error('Unsupported output shape')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: buildMessages(prompt, materials),
      response_format: {
        type: 'json_schema',
        json_schema: outputShapeDefinition.jsonSchema
      }
    })
  })

  if (!response.ok) {
    const errorPayload = await response.text()
    throw new Error(`OpenAI request failed: ${response.status} ${errorPayload}`)
  }

  const payload = await response.json()
  const rawText: string | undefined = payload?.choices?.[0]?.message?.content
  if (!rawText) {
    throw new Error('OpenAI returned an empty response')
  }

  try {
    const json = JSON.parse(rawText)
    return { json, rawText }
  } catch (err) {
    throw new Error(`Failed to parse OpenAI response: ${(err as Error).message}`)
  }
}

export const canGenerate = (settings: SettingsRecord | undefined) =>
  Boolean(settings?.openAIApiKey)
