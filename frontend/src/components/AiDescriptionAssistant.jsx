import { Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import api from "../api/api";

export default function AiDescriptionAssistant({
  title,
  category,
  condition,
  price,
  notes,
  onNotesChange,
  onDescriptionGenerated,
}) {
  const [generating, setGenerating] = useState(false);

  async function generateDescription() {
    if (!title.trim()) {
      toast.error("Add a listing title before generating a description.");
      return;
    }

    if (price === "" || !Number.isFinite(Number(price)) || Number(price) < 0) {
      toast.error("Add a valid price before generating a description.");
      return;
    }

    try {
      setGenerating(true);

      const response = await api.post("/ai/generate-description", {
        title: title.trim(),
        category,
        condition,
        price: Number(price),
        notes: notes.trim(),
      });

      const generatedDescription = response.data?.description?.trim();

      if (!generatedDescription) {
        throw new Error("The AI service returned an empty description.");
      }

      onDescriptionGenerated(generatedDescription);
      toast.success("AI description generated. Review it before publishing.");
    } catch (error) {
      console.error("Generate description error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to generate a description."
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="ai-description-box" aria-labelledby="ai-notes-label">
      <label>
        <span id="ai-notes-label">Quick notes for AI (optional)</span>
        <textarea
          name="notes"
          rows="3"
          maxLength="300"
          placeholder="Example: Some highlighting, no missing pages, used for one semester."
          value={notes}
          onChange={onNotesChange}
        />
      </label>

      <p className="field-hint">
        Add rough highlights about the item. CampusCart AI will turn them into a
        polished, unique product description that you can review and edit.
      </p>

      <button
        className="ai-generate-button"
        type="button"
        disabled={generating}
        onClick={generateDescription}
      >
        <Sparkles size={18} />
        {generating ? "Generating description..." : "Generate AI Description"}
      </button>

      <small className="ai-disclaimer">
        AI creates a draft from your listing details and notes. Check the result
        for accuracy before publishing.
      </small>
    </section>
  );
}
