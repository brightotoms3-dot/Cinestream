export type ProviderMediaType = 'movie' | 'tv';

export interface BuildVidSrcUrlOptions {
  mediaType: ProviderMediaType;
  id?: string | number | null;
  season?: number;
  episode?: number;
  /** Index into VIDSRC_MIRRORS; defaults to the primary mirror. */
  mirror?: number;
}

/**
 * VidSrc entry domains that serve the same /embed/ path scheme.
 * vidsrc.sh is the direct backend (vidsrc.to wraps it in an ad-heavy page)
 * and relays MEDIA_NOT_FOUND postMessages up to the embedding page, so it is
 * tried first; vidsrc.to is the fallback mirror.
 */
export const VIDSRC_MIRRORS = ['https://vidsrc.sh', 'https://vidsrc.to'] as const;

export function getVidSrcEmbedUrl({
  mediaType,
  id,
  season,
  episode,
  mirror,
}: BuildVidSrcUrlOptions): string | null {
  if (id === undefined || id === null || String(id).trim() === '') {
    return null;
  }

  const normalizedId = String(id).trim();
  const base = VIDSRC_MIRRORS[mirror ?? 0] ?? VIDSRC_MIRRORS[0];

  if (mediaType === 'tv') {
    const baseUrl = `${base}/embed/tv/${encodeURIComponent(normalizedId)}`;

    if (season && Number.isFinite(Number(season))) {
      const seasonNumber = Number(season);
      if (episode && Number.isFinite(Number(episode))) {
        return `${baseUrl}/${seasonNumber}/${Number(episode)}`;
      }
      return `${baseUrl}/${seasonNumber}`;
    }

    return baseUrl;
  }

  return `${base}/embed/movie/${encodeURIComponent(normalizedId)}`;
}
