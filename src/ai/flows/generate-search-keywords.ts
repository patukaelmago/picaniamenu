'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating search keywords for menu items.
 *
 * The flow takes a menu item's name, tags, and category as input and returns a list of search keywords.
 *
 * @exported
 * - `generateSearchKeywords`: A function that triggers the search keyword generation flow.
 * - `GenerateSearchKeywordsInput`: The input type for the generateSearchKeywords function.
 * - `GenerateSearchKeywordsOutput`: The return type for the generateSearchKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSearchKeywordsInputSchema = z.object({
  name: z.string().describe('The name of the menu item.'),
  tags: z.array(z.string()).describe('The tags associated with the menu item.'),
  category: z.string().describe('The category of the menu item.'),
});

export type GenerateSearchKeywordsInput = z.infer<
  typeof GenerateSearchKeywordsInputSchema
>;

const GenerateSearchKeywordsOutputSchema = z.object({
  searchKeywords: z
    .array(z.string())
    .describe('The generated search keywords for the menu item.'),
});

export type GenerateSearchKeywordsOutput = z.infer<
  typeof GenerateSearchKeywordsOutputSchema
>;

export async function generateSearchKeywords(
  input: GenerateSearchKeywordsInput
): Promise<GenerateSearchKeywordsOutput> {
  return generateSearchKeywordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSearchKeywordsPrompt',
  input: {schema: GenerateSearchKeywordsInputSchema},
  output: {schema: GenerateSearchKeywordsOutputSchema},
  prompt: `You are an expert in generating search keywords for menu items in a restaurant.

  Given the name, tags, and category of a menu item, generate a list of relevant search keywords that customers might use to find the item.

  Name: {{{name}}}
  Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Category: {{{category}}}

  Consider synonyms, related terms, and common misspellings.

  Return the search keywords as an array of strings.
  Make sure the generated keywords are lowercase.
  Example:
  {
    "searchKeywords": ["steak", "grilled meat", "parrilla", "meat", "grilled"]
  }`,
});

const generateSearchKeywordsFlow = ai.defineFlow(
  {
    name: 'generateSearchKeywordsFlow',
    inputSchema: GenerateSearchKeywordsInputSchema,
    outputSchema: GenerateSearchKeywordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
