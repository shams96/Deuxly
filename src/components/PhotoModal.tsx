"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function PhotoModal({ photoId, onClose, onUpdated, onDeleted }: Props) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!photoId) return;
    let alive = true;
    fetch(`/api/photos/${photoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setPhoto(data);
        setLabel(data.label || "");
        setNotes(data.notes || "");
      })
      .catch(() => onClose());
    return () => {
      alive = false;
    };
  }, [photoId, onClose]);

  const open = photoId !== null && photo !== null;

  // Focus trap + Escape while open.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const handleSave = useCallback(async () => {
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
      onUpdated(await res.json());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }, [photo, label, notes, onUpdated, onClose]);

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

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-modal-title"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface shadow-lg"
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 id="photo-modal-title" className="text-lg font-semibold text-ink">
                  Edit photo
                </h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2"
                >
                  <span aria-hidden>✕</span>
                </button>
              </div>

              <div className="relative mb-4 aspect-[3/4] w-full overflow-hidden rounded-2xl bg-bg">
                <Image
                  src={photo.storageUrl}
                  alt={photo.label || "Captured photo"}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="pm-label" className="mb-1 block text-sm font-medium text-ink">
                    Label
                  </label>
                  <input
                    id="pm-label"
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="pm-notes" className="mb-1 block text-sm font-medium text-ink">
                    Notes
                  </label>
                  <textarea
                    id="pm-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink"
                  />
                </div>
                {error && (
                  <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger-ink" role="alert">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-xl border border-danger/30 px-4 py-3 font-medium text-danger-ink transition-colors hover:bg-danger/10 disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-line px-4 py-3 font-medium text-ink transition-colors hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-accent px-4 py-3 font-medium text-on-fill transition-colors hover:bg-accent-strong disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
