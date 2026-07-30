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
