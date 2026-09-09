"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Photo = {
  id: string;
  label: string;
  notes?: string;
  capturedAt: string;
  storageUrl: string;
};

type Props = {
  photoId: string | null;
  onClose: () => void;
  onUpdated: (photo: Photo) => void;
  onDeleted: (id: string) => void;
};

export default function PhotoModal({ photoId, onClose, onUpdated, onDeleted }: Props) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) return;
    fetch(`/api/photos/${photoId}`)
      .then((r) => r.json())
      .then((data) => {
        setPhoto(data);
        setLabel(data.label || "");
        setNotes(data.notes || "");
      })
      .catch(() => onClose());
  }, [photoId, onClose]);

  const handleSave = async () => {
    if (!photo) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, notes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update");
      }
      const updated = await res.json();
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!photo) return;
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      onDeleted(photo.id);
      onClose();
    } catch {
      setError("Failed to delete photo");
    } finally {
      setDeleting(false);
    }
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,28,28,0.4)] p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1C1C1C]">Edit Photo</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F0EB] text-[#6B6560]"
            >
              ✕
            </button>
          </div>

          <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F9F7F4] mb-4 relative">
            <Image src={photo.storageUrl} alt={photo.label} fill className="object-cover" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-1">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E8E2DA] bg-white text-sm text-[#1C1C1C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1C1C] mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#E8E2DA] bg-white text-sm text-[#1C1C1C] resize-none"
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-[#B87A7A]/10 text-[#B87A7A] text-sm">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-3 rounded-xl border border-[#B87A7A]/30 text-[#B87A7A] font-medium hover:bg-[#B87A7A]/10 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl border border-[#E8E2DA] text-[#1C1C1C] font-medium hover:bg-[#F3F0EB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-3 rounded-xl bg-[#C6B8A4] text-white font-medium hover:bg-[#B8A892] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
