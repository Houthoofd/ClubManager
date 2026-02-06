const { z } = require('zod');

const modifierStatutProfesseurSchema = z.object({
  id: z.number().int().positive(),
  status_id: z.number().int().positive().min(1).max(10),
});

// Test avec les valeurs du test
for (let status_id = 1; status_id <= 10; status_id++) {
  const data = { id: 1, status_id };
  try {
    const result = modifierStatutProfesseurSchema.parse(data);
    console.log(`✓ status_id=${status_id} valid:`, result);
  } catch (err) {
    console.log(`✗ status_id=${status_id} invalid:`, err.errors);
  }
}
