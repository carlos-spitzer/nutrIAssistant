// Adds the notes column to grocery_items for devices whose table was created
// before this column existed in the schema.
export const migration003 = `
ALTER TABLE grocery_items ADD COLUMN notes TEXT;
`
