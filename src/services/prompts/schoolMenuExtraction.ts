export const SCHOOL_MENU_EXTRACTION_PROMPT = `You are a nutrition data extraction specialist. Analyze the attached school lunch menu PDF.

Extract ALL school days and their corresponding lunch menus for the entire document period (typically one month).

For each day, return:
- date (YYYY-MM-DD format)
- meal description (original text from PDF)
- extracted main ingredients (array of strings)
- detected allergens from EU 14 list: gluten, dairy, eggs, peanuts, tree nuts, soy, fish, shellfish, sesame, celery, mustard, lupin, mollusks, sulfites (array of strings)
- estimated nutritional values: calories (kcal), protein (g), carbs (g), fat (g)

Return ONLY valid JSON array. No commentary.
Schema: Array of { "id": string, "date": string, "childId": string, "meal": "lunch", "description": string, "extractedIngredients": string[], "extractedAllergens": string[], "nutritionalEstimate": { "calories": number, "protein": number, "carbs": number, "fat": number } }

Use "child-placeholder" for childId — it will be replaced by the app.`
