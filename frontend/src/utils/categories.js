export const categories = [
  { label: "Textbooks", value: "textbooks" },
  { label: "Electronics", value: "electronics" },
  { label: "Furniture", value: "furniture" },
  { label: "Room Essentials", value: "room-essentials" },
  { label: "Clothing", value: "clothing" },
  { label: "School Supplies", value: "school supplies" },
];

export const categoriesWithAll = [
  { label: "All Categories", value: "" },
  ...categories,
];

export const conditions = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like-new" },
  { label: "Used", value: "used" },
  { label: "Good", value: "good" },
];

export const conditionsWithAll = [
  { label: "Any Condition", value: "" },
  ...conditions,
];

export function formatLabel(value) {
  if (!value) return "Not listed";

  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}