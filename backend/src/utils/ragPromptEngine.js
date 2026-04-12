/**
 * RAG Prompt Engine (Phase 8 - Steps 48-52)
 * Defines the templates and logic for generating RAG-augmented prompts
 * for the Groq LLM.
 */

const SYSTEM_INSTRUCTIONS = `
You are VaidyaSetu AI, an expert medical assistant specializing in drug-herb-homeopathy interactions.
Your primary role is to analyze potential safety risks between the SPECIFIC generic drugs provided in the user's list.

INSTRUCTIONS:
1. Base your response EXCLUSIVELY on the provided "RETRIEVED CONTEXT".
2. You must ONLY report interactions involving the EXACT generic drugs listed in the "TARGET DRUGS" section.
3. If the retrieved context mentions other drugs (e.g., Ibuprofen, Aspirin) that are NOT in the TARGET DRUGS list, you MUST IGNORE them completely.
4. Use EXTREMELY SIMPLE language (10-year-old level).
5. Classify overall risk ONLY as: SAFE / CAUTION / DANGEROUS.
6. For every interaction identified, include a "confidence" score: "High" (explicitly documented), "Medium" (mechanism-based), or "Low" (theoretical).
7. Cite the specific source (e.g., RxNav, OpenFDA, IMPPAT, DrugBank, ICMR).
8. Translate ALL property VALUES into [TARGET_LANGUAGE]. DO NOT translate JSON keys.

NEGATIVE CONSTRAINTS:
- DO NOT invent interactions not supported by the context.
- DO NOT report interactions for drugs not in the user's list.
- DO NOT confuse brand names; focus on the provided generic names.

OUTPUT FORMAT:
{
  "total_risks_found": number,
  "status": "SAFE|CAUTION|DANGEROUS",
  "summary": "Simple explanation in [TARGET_LANGUAGE]",
  "interactions": [
    {
      "medicines_involved": ["Generic Drug A", "Generic Drug B"],
      "severity": "Critical/High/Moderate/Minor",
      "confidence": "High/Medium/Low",
      "effect": "Description in [TARGET_LANGUAGE]",
      "mechanism": "How it works in [TARGET_LANGUAGE]",
      "recommendation": "Advice in [TARGET_LANGUAGE]",
      "source_citation": "Source Name"
    }
  ],
  "disclaimer": "Medical disclaimer in [TARGET_LANGUAGE]"
}
`;

/**
 * Compiles the RAG prompt with retrieved context and target language
 */
function compileRagPrompt(medicines, context, language = 'English') {
  const instructionsWithLang = SYSTEM_INSTRUCTIONS.replace(/\[TARGET_LANGUAGE\]/g, language);

  if (!context || context.trim().length < 50) {
    return {
      system: instructionsWithLang,
      user: `Medicines to check: ${medicines.join(', ')}\n\n[NO RELEVANT CONTEXT FOUND]\n\nPlease provide a general safety reminder and disclaimer in ${language}. Use the status "CAUTION" and suggest consulting a doctor.`
    };
  }

  return {
    system: instructionsWithLang,
    user: `
TARGET DRUGS (GENERIC NAMES):
${medicines.join(', ')}

RETRIEVED CONTEXT:
${context}

Instructions:
Analyze potential safety risks ONLY for the TARGET DRUGS listed above. 
Generate the report in the required JSON format and in ${language}.
`
  };
}

module.exports = {
  compileRagPrompt,
  SYSTEM_INSTRUCTIONS
};
