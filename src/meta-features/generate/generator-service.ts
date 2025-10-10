import type { MaterialRecord, PromptRecord } from '../../entities/app-db'
import type { SettingsRecord } from '../../entities/settings/settings'
import { getOutputShapeDefinition } from './output-shapes'

type PdfJsModule = typeof import('pdfjs-dist')

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

const DEFAULT_MODEL = 'gpt-4o-mini'
const MAX_MATERIAL_LENGTH = 6000

let pdfjsPromise: Promise<PdfJsModule> | null = null

const loadPdfJs = async (): Promise<PdfJsModule> => {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist')
      if (typeof window !== 'undefined') {
        try {
          const workerSrcModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrcModule.default
        } catch {
          // ignore worker setup failure; pdfjs will fall back to fake worker
        }
      }
      return pdfjs
    })()
  }
  return pdfjsPromise
}

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

const dataUrlToUint8Array = (dataUrl: string) => {
  const [, base64] = dataUrl.split(',')
  if (!base64) {
    return new Uint8Array()
  }
  const binaryString = atob(base64)
  const length = binaryString.length
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

const truncateText = (text: string) =>
  text.length > MAX_MATERIAL_LENGTH ? `${text.slice(0, MAX_MATERIAL_LENGTH)}…` : text

const extractPdfText = async (dataUrl: string) => {
  try {
    const pdfjs = await loadPdfJs()
    const data = dataUrlToUint8Array(dataUrl)
    if (!data.length) {
      return ''
    }
    const loadingTask = pdfjs.getDocument({ data })
    const pdf = await loadingTask.promise
    let combined = ''
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const pageText = (textContent.items as Array<{ str?: string; text?: string }>)
        .map((item) => item.str ?? item.text ?? '')
        .join('')
      if (pageText) {
        combined += pageText + '\n\n'
      }
      if (combined.length >= MAX_MATERIAL_LENGTH) {
        break
      }
    }
    pdf.cleanup()
    await loadingTask.destroy()
    return truncateText(combined.trim())
  } catch {
    return ''
  }
}

const summariseMaterial = async (material: MaterialRecord) => {
  if (material.mimeType.startsWith('text/') || material.mimeType.includes('json')) {
    const text = decodeDataUrl(material.dataUrl)
    return `File: ${material.name}\nType: ${material.mimeType}\nContent:\n${truncateText(text)}`
  }
  if (material.mimeType === 'application/pdf') {
    const text = await extractPdfText(material.dataUrl)
    if (text) {
      return `File: ${material.name}\nType: ${material.mimeType}\nContent:\n${text}`
    }
    return `File: ${material.name}\nType: ${material.mimeType}\nUnable to extract text from this PDF.`
  }
  return `File: ${material.name}\nType: ${material.mimeType}\nThis file is not textual. Provide concise flashcards based on its description or filename if possible.`
}

const buildMessages = async (prompt: PromptRecord, materials: MaterialRecord[]) => {
  if (!materials.length) {
    return [
      {
        role: 'system',
        content:
          'You are an assistant that creates learning materials based on user prompts. Always follow the requested output shape strictly.'
      },
      {
        role: 'user',
        content: prompt.content
      }
    ]
  }

  const summaries = await Promise.all(materials.map((material) => summariseMaterial(material)))
  return [
    {
      role: 'system',
      content:
        'You are an assistant that creates learning materials from provided user documents. Always follow the requested output shape strictly.'
    },
    {
      role: 'user',
      content: [prompt.content, '', 'Materials:', summaries.join('\n\n')].join('\n')
    }
  ]
}

export const generateLearningMaterials = async ({
  apiKey,
  prompt,
  materials,
  model = DEFAULT_MODEL
}: GenerateParams): Promise<GenerateResult> => {
  if (!apiKey) {
    throw new Error('Missing API key')
  }
  const outputShapeDefinition = getOutputShapeDefinition(prompt.outputShape)
  if (!outputShapeDefinition) {
    throw new Error('Unsupported output shape')
  }

  const messages = await buildMessages(prompt, materials)

  // Use dynamic schema if available, otherwise fall back to static schema
  const jsonSchema =
    outputShapeDefinition.createJsonSchema && prompt.minFlashcards
      ? outputShapeDefinition.createJsonSchema(prompt.minFlashcards)
      : outputShapeDefinition.jsonSchema

  console.log('🔍 DEBUG: prompt.minFlashcards =', prompt.minFlashcards)
  console.log('🔍 DEBUG: jsonSchema =', JSON.stringify(jsonSchema, null, 2))

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: jsonSchema
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

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch (err) {
    throw new Error(`Failed to parse OpenAI response: ${(err as Error).message}`)
  }

  let normalized: unknown
  if (Array.isArray(parsed)) {
    normalized = parsed
  } else if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as { flashcards?: unknown }).flashcards)
  ) {
    normalized = (parsed as { flashcards: unknown[] }).flashcards
  } else {
    throw new Error('OpenAI response missing flashcards array')
  }

  return { json: normalized, rawText }
}

export const canGenerate = (settings: SettingsRecord | undefined) =>
  Boolean(settings?.openAIApiKey)
