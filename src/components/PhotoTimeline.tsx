"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Pencil, Check, ImageOff } from "lucide-react";

type Photo = {
  id: string;
  storageUrl: string;
  label: string;
  capturedAt: string;
  notes?: string;
};

type Props = {
  photos: Photo[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
};

export default function PhotoTimeline({ photos, selectedIds, onSelect, onDelete, onEdit }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageOff size={48} className="mb-4 text-line" aria-hidden />
        <h3 className="text-lg font-medium text-ink mb-2">No photos yet</h3>
        <p className="text-sm text-ink-2">Start documenting your skincare journey</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all ${
              selectedIds.includes(photo.id)
                ? "ring-2 ring-accent ring-offset-2"
                : "hover:opacity-80"
            }`}
            onClick={() => onSelect(photo.id)}
          >
            <Image
              src={photo.storageUrl}
              alt={photo.label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-xs font-medium text-white truncate">{photo.label || "Unlabeled"}</p>
              <p className="text-[10px] text-white/70">
                {new Date(photo.capturedAt).toLocaleDateString()}
              </p>
            </div>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(photo.id);
                }}
                aria-label={`Delete ${photo.label || "photo"}`}
                className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
              >
                <X size={14} aria-hidden />
              </button>
            )}
            {selectedIds.includes(photo.id) && (
              <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-on-fill">
                <Check size={16} aria-hidden />
              </div>
            )}
            {onEdit && !selectedIds.includes(photo.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(photo.id);
                }}
                aria-label={`Edit ${photo.label || "photo"}`}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
              >
                <Pencil size={13} aria-hidden />
              </button>
            )}
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-ink mb-2">Delete photo?</h3>
            <p className="text-sm text-ink-2 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-line text-ink font-medium hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 py-3 rounded-xl bg-danger text-on-fill font-medium hover:bg-danger-strong transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
