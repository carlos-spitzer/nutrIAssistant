// Adds is_purchased to grocery_items for devices that had the table before this column existed
export const migration002 = `
ALTER TABLE grocery_items ADD COLUMN is_purchased INTEGER NOT NULL DEFAULT 0;
`
