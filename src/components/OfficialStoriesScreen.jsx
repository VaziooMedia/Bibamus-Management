import React, { useState, useEffect, useRef } from "react";
import { uploadOfficialStoryMedia, createOfficialStory, loadOfficialStoriesAdmin, deleteOfficialStory } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

export function OfficialStoriesScreen({ myUserId }) {
  const [stories, setStories] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const refresh = () => loadOfficialStoriesAdmin().then(setStories);
  useEffect(() => {
    refresh();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const uploadResult = await uploadOfficialStoryMedia(myUserId, file);
    if (uploadResult.error) {
      setError(uploadResult.error);
      setUploading(false);
      return;
    }
    const createResult = await createOfficialStory(uploadResult.url, caption.trim(), myUserId);
    setUploading(false);
    if (createResult.error) {
      setError(createResult.error);
      return;
    }
    setCaption("");
    refresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette Story officielle ?")) return;
    setStories((prev) => prev.filter((s) => s.id !== id));
    await deleteOfficialStory(id);
  };

  return (
    <div>
      <PageTitle>Stories officielles</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px", maxWidth: "560px" }}>
        Visibles par tous les utilisateurs dans l'app, en premier dans la barre de Stories (contour bleu, pas rose). Durée de vie de 24h, comme les Stories classiques.
      </p>

      <div style={{ background: "#16273D", borderRadius: "10px", padding: "18px", maxWidth: "480px", marginBottom: "24px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#8792A6", marginBottom: "6px", display: "block" }}>Légende (optionnelle)</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Un petit mot pour accompagner l'image..."
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", background: "#0D1B2A", color: "#F2F2E8", fontSize: "13.5px", marginBottom: "14px" }}
        />
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} disabled={uploading} />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ width: "100%", background: "#39FF66", border: "none", borderRadius: "8px", padding: "11px", fontWeight: 700, fontSize: "13.5px", color: "#0D1B2A", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? "Envoi en cours..." : "+ Déposer une image"}
        </button>
        {error && <p style={{ fontSize: "12px", color: "#FF3B4E", marginTop: "10px" }}>{error}</p>}
      </div>

      {stories === null ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : stories.length === 0 ? (
        <p style={{ color: "#8792A6" }}>Aucune Story officielle pour l'instant.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
          {stories.map((s) => (
            <div key={s.id} style={{ width: "160px", background: "#16273D", borderRadius: "10px", overflow: "hidden" }}>
              <img src={s.mediaUrl} alt="" style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} />
              <div style={{ padding: "10px" }}>
                {s.caption && <p style={{ fontSize: "12px", color: "#F2F2E8", margin: "0 0 6px 0" }}>{s.caption}</p>}
                <p style={{ fontSize: "11px", color: "#8792A6", margin: "0 0 8px 0" }}>{timeAgo(s.createdAt)}</p>
                <button
                  onClick={() => handleDelete(s.id)}
                  style={{ width: "100%", background: "none", border: "2px solid #FF3B4E", borderRadius: "6px", padding: "6px", fontSize: "11.5px", fontWeight: 700, color: "#FF3B4E", cursor: "pointer" }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
