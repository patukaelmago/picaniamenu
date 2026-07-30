"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const TranslationInputSchema = z.object({
  name: z.string(),
  description: z.string().optional().default(""),
});

const TranslationOutputSchema = z.object({
  nameEn: z.string(),
  descriptionEn: z.string(),
});

export type TranslationInput = z.infer<typeof TranslationInputSchema>;
export type TranslationOutput = z.infer<typeof TranslationOutputSchema>;

const prompt = ai.definePrompt({
  name: "translateMenuContentPrompt",
  input: { schema: TranslationInputSchema },
  output: { schema: TranslationOutputSchema },
  prompt: `Translate this restaurant menu content from Spanish into natural English.
Preserve proper names, culinary terminology, capitalization style and punctuation.
Do not add explanations or information that is not present.

Name: {{{name}}}
Description: {{{description}}}`,
});

const translateMenuContentFlow = ai.defineFlow(
  {
    name: "translateMenuContentFlow",
    inputSchema: TranslationInputSchema,
    outputSchema: TranslationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error("No se pudo generar la traducción.");
    return output;
  }
);

export async function translateMenuContent(
  input: TranslationInput
): Promise<TranslationOutput> {
  return translateMenuContentFlow(input);
}

const BatchTranslationInputSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional().default(""),
    })
  ),
});

const BatchTranslationOutputSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string(),
      nameEn: z.string(),
      descriptionEn: z.string(),
    })
  ),
});

export type BatchTranslationInput = z.infer<typeof BatchTranslationInputSchema>;
export type BatchTranslationOutput = z.infer<typeof BatchTranslationOutputSchema>;

const batchPrompt = ai.definePrompt({
  name: "translateMenuBatchPrompt",
  input: { schema: BatchTranslationInputSchema },
  output: { schema: BatchTranslationOutputSchema },
  prompt: `Translate every restaurant menu entry from Spanish into natural English.
Preserve each id exactly. Preserve proper names, culinary terminology and punctuation.
Do not add explanations or information.

{{#each entries}}
ID: {{{id}}}
Name: {{{name}}}
Description: {{{description}}}
---
{{/each}}`,
});

const translateMenuBatchFlow = ai.defineFlow(
  {
    name: "translateMenuBatchFlow",
    inputSchema: BatchTranslationInputSchema,
    outputSchema: BatchTranslationOutputSchema,
  },
  async (input) => {
    const { output } = await batchPrompt(input);
    if (!output) throw new Error("No se pudo generar la traducción.");
    return output;
  }
);

export async function translateMenuBatch(
  input: BatchTranslationInput
): Promise<BatchTranslationOutput> {
  return translateMenuBatchFlow(input);
}
