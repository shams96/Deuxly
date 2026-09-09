"use client";

import { useState } from "react";
import Image from "next/image";

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
        <svg className="w-16 h-16 text-[#E8E2DA] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18.75 6.75h.008v.008h-.008V6.75zm-3.75 0h.008v.008h-.008V6.75zm-3.75 0h.008v.008h-.008V6.75z" />
        </svg>
        <h3 className="text-lg font-medium text-[#1C1C1C] mb-2">No photos yet</h3>
        <p className="text-sm text-[#6B6560]">Start documenting your skincare journey</p>
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
                ? "ring-2 ring-[#C6B8A4] ring-offset-2"
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
                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center text-white/70 hover:text-white"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {selectedIds.includes(photo.id) && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C6B8A4] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {onEdit && !selectedIds.includes(photo.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(photo.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center text-white/70 hover:text-white"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,28,28,0.4)]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">Delete photo?</h3>
            <p className="text-sm text-[#6B6560] mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-[#E8E2DA] text-[#1C1C1C] font-medium hover:bg-[#F3F0EB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 py-3 rounded-xl bg-[#B87A7A] text-white font-medium hover:bg-[#A86A6A] transition-colors"
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
