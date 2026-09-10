"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PhotoTimeline from "@/components/PhotoTimeline";
import PhotoModal from "@/components/PhotoModal";

type Photo = {
  id: string;
  storageUrl: string;
  label: string;
  capturedAt: string;
  notes?: string;
};

export default function HistoryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPhotoId, setEditPhotoId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/photos")
      .then((r) => r.json())
      .then((data) => {
        setPhotos(data.photos ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)
    );
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleUpdated = (updated: Photo) => {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink mb-1">History</h1>
          <p className="text-sm text-ink-2">
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {selectedIds.length === 2 && (
          <Link
            href={`/dashboard/compare?a=${selectedIds[0]}&b=${selectedIds[1]}`}
            className="px-4 py-2 rounded-xl bg-accent text-on-fill text-sm font-medium hover:bg-accent-strong transition-colors"
          >
            Compare
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center text-ink-2 py-12">Loading...</div>
      ) : (
        <PhotoTimeline
          photos={photos}
          selectedIds={selectedIds}
          onSelect={toggleSelect}
          onDelete={handleDelete}
          onEdit={setEditPhotoId}
        />
      )}

      <PhotoModal
        photoId={editPhotoId}
        onClose={() => setEditPhotoId(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDelete}
      />
    </div>
  );
}
