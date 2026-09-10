/**
 * Map a stored photo to the authenticated same-origin URLs clients use as
 * `<img src>`. The DB holds opaque storage keys; these routes gate on session +
 * ownership. Field names match what the UI already consumes.
 */
export function withPhotoUrls<T extends { id: string; thumbnailUrl: string | null }>(
  photo: T,
): Omit<T, "thumbnailUrl"> & { storageUrl: string; thumbnailUrl: string | null } {
  const { thumbnailUrl, ...rest } = photo;
  return {
    ...rest,
    storageUrl: `/api/photos/${photo.id}/file`,
    thumbnailUrl: thumbnailUrl ? `/api/photos/${photo.id}/file?variant=thumb` : null,
  };
}
