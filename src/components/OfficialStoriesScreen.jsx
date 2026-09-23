import React, { useState, useEffect, useRef } from "react";
import {
  uploadOfficialStoryMedia,
  createOfficialStory,
  loadOfficialStoriesAdmin,
  deleteOfficialStory,
  loadPublicVenues,
  loadDrinksDirectory,
  loadBrandsDirectory,
  loadBreweriesDirectory,
} from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { ImageEditor } from "./ImageEditor.jsx";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

// Vrai tag "recherche + sélection unique" réutilisé pour les 4 vrais répertoires — le vrai
// choix courant s'affiche comme une vraie pastille retirable, sinon un vrai champ de recherche
// avec ses vrais résultats en-dessous.
function TagPicker({ label, items, selectedId, onSelect }) {
  const [query, setQuery] = useState("");
  const selected = items.find((i) => i.id === selectedId);
  const results = query.trim() ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) : [];

  return (
    <div>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#8792A6", marginBottom: "6px", display: "block" }}>{label}</label>
      {selected ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#28405C", borderRadius: "999px", padding: "6px 6px 6px 12px" }}>
          <span style={{ fontSize: "12.5px", color: "#F2F2E8" }}>{selected.name}</span>
          <button
            onClick={() => onSelect(null)}
            style={{ width: "18px", height: "18px", borderRadius: "50%", border: "none", background: "#0D1B2A", color: "#8792A6", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Rechercher ${label.toLowerCase()}...`}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: "8px", border: "2px solid #28405C", background: "#0D1B2A", color: "#F2F2E8", fontSize: "13px" }}
          />
          {results.length > 0 && (
            <div style={{ marginTop: "4px", background: "#0D1B2A", borderRadius: "8px", border: "1px solid #28405C", overflow: "hidden" }}>
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onSelect(r.id);
                    setQuery("");
                  }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "#F2F2E8", fontSize: "13px", cursor: "pointer" }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Vrai modal de création en 2 vraies étapes : cadrage/position/zoom/rotation de l'image, puis
// légende + taguage (lieu indiqué en texte libre, tag lieu/produit/marque/producteur).
function CreateStoryModal({ file, onClose, onPublished, myUserId }) {
  const [step, setStep] = useState("edit");
  const [caption, setCaption] = useState("");
  const [locationText, setLocationText] = useState("");
  const [taggedVenueId, setTaggedVenueId] = useState(null);
  const [taggedDrinkId, setTaggedDrinkId] = useState(null);
  const [taggedBrandId, setTaggedBrandId] = useState(null);
  const [taggedProducerId, setTaggedProducerId] = useState(null);
  const [venues, setVenues] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [brands, setBrands] = useState([]);
  const [producers, setProducers] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const editorRef = useRef(null);

  useEffect(() => {
    loadPublicVenues().then(setVenues);
    loadDrinksDirectory().then(setDrinks);
    loadBrandsDirectory().then(setBrands);
    loadBreweriesDirectory().then(setProducers);
  }, []);

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const blob = await editorRef.current.getFinalBlob();
      if (!blob) {
        setError("Impossible de préparer l'image.");
        return;
      }
      const uploadResult = await uploadOfficialStoryMedia(myUserId, blob);
      if (uploadResult.error) {
        setError(uploadResult.error);
        return;
      }
      const createResult = await createOfficialStory(uploadResult.url, caption.trim(), myUserId, {
        locationText: locationText.trim() || null,
        taggedVenueId,
        taggedDrinkId,
        taggedBrandId,
        taggedProducerId,
      });
      if (createResult.error) {
        setError(createResult.error);
        return;
      }
      onPublished();
    } catch (e) {
      console.error("handlePublish:", e);
      setError("Erreur : " + (e?.message || String(e)));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
      <div style={{ background: "#16273D", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "460px", maxHeight: "88vh", overflowY: "auto" }}>
        <h3 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "18px", margin: "0 0 18px" }}>{step === "edit" ? "Cadrer l'image" : "Légende & taguage"}</h3>

        {step === "edit" ? (
          <>
            <ImageEditor ref={editorRef} file={file} />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "2px solid #28405C", background: "none", color: "#F2F2E8", fontWeight: 700, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={() => setStep("tags")} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: "#39FF66", color: "#0D1B2A", fontWeight: 800, cursor: "pointer" }}>
                Continuer
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#8792A6", marginBottom: "6px", display: "block" }}>Légende (optionnelle)</label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Un petit mot pour accompagner l'image..."
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", background: "#0D1B2A", color: "#F2F2E8", fontSize: "13.5px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#8792A6", marginBottom: "6px", display: "block" }}>Indiquer un lieu (texte libre)</label>
                <input
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Ex. Robertville, Belgique..."
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", background: "#0D1B2A", color: "#F2F2E8", fontSize: "13.5px" }}
                />
              </div>
              <TagPicker label="Taguer un lieu" items={venues} selectedId={taggedVenueId} onSelect={setTaggedVenueId} />
              <TagPicker label="Taguer un produit" items={drinks} selectedId={taggedDrinkId} onSelect={setTaggedDrinkId} />
              <TagPicker label="Taguer une marque" items={brands} selectedId={taggedBrandId} onSelect={setTaggedBrandId} />
              <TagPicker label="Taguer un producteur" items={producers} selectedId={taggedProducerId} onSelect={setTaggedProducerId} />
            </div>

            {error && <p style={{ fontSize: "12px", color: "#FF3B4E", marginTop: "14px" }}>{error}</p>}

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setStep("edit")} disabled={publishing} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "2px solid #28405C", background: "none", color: "#F2F2E8", fontWeight: 700, cursor: "pointer" }}>
                Retour
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: "#39FF66", color: "#0D1B2A", fontWeight: 800, cursor: "pointer", opacity: publishing ? 0.6 : 1 }}
              >
                {publishing ? "Publication..." : "Publier"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function OfficialStoriesScreen({ myUserId }) {
  const [stories, setStories] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const inputRef = useRef(null);

  const refresh = () => loadOfficialStoriesAdmin().then(setStories);
  useEffect(() => {
    refresh();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette Story officielle ?")) return;
    const result = await deleteOfficialStory(id);
    if (result.error) {
      alert("Erreur : " + result.error);
      return;
    }
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <PageTitle>Stories officielles</PageTitle>
        <button
          onClick={() => inputRef.current?.click()}
          title="Nouvelle Story"
          style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "10px 16px", color: "#0D1B2A", cursor: "pointer", fontSize: "14px", fontWeight: 800 }}
        >
          +
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
      </div>
      <p style={{ fontSize: "12.5px", color: "#8792A6", margin: "8px 0 20px", maxWidth: "560px" }}>
        Visibles par tous les utilisateurs dans l'app, en premier dans la barre de Stories (contour bleu, pas rose). Durée de vie de 24h, comme les Stories classiques.
      </p>

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
                {s.locationText && <p style={{ fontSize: "11px", color: "#8792A6", margin: "0 0 6px 0" }}>📍 {s.locationText}</p>}
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

      {pendingFile && (
        <CreateStoryModal
          file={pendingFile}
          myUserId={myUserId}
          onClose={() => setPendingFile(null)}
          onPublished={() => {
            setPendingFile(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
