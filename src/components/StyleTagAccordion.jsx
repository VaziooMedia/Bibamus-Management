import React, { useState } from "react";

// groups: [{ title, tags: [...] }] — un seul groupe déplié à la fois, pour ne pas noyer la vue
// avec des centaines de tags d'un coup. Le nombre de tags déjà sélectionnés dans un groupe
// replié reste visible, pour ne pas perdre le fil.
export function StyleTagAccordion({ groups, selected, onToggle }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {groups.map((group, i) => {
        const isOpen = openIndex === i;
        const selectedInGroup = group.tags.filter((t) => selected.includes(t)).length;
        return (
          <div key={group.title} style={{ border: "2px solid #28405C", borderRadius: "8px", overflow: "hidden" }}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                background: "#16273D",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#F2F2E8" }}>
                {group.title}
                {selectedInGroup > 0 && <span style={{ color: "#39FF66", fontWeight: 800 }}> ({selectedInGroup})</span>}
              </span>
              <span style={{ color: "#39FF66", fontSize: "11px" }}>{isOpen ? "▼" : "▶"}</span>
            </button>
            {isOpen && (
              <div style={{ padding: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {group.tags.map((tag) => {
                  const checked = selected.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onToggle(tag)}
                      style={{
                        background: checked ? "#39FF66" : "none",
                        border: `2px solid ${checked ? "#39FF66" : "#28405C"}`,
                        borderRadius: "999px",
                        padding: "5px 11px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        color: checked ? "#0D1B2A" : "#F2F2E8",
                        cursor: "pointer",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
