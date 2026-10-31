export type ProviderMediaType = 'movie' | 'tv';

export interface BuildVidSrcUrlOptions {
  mediaType: ProviderMediaType;
  id?: string | number | null;
  season?: number;
  episode?: number;
}

export function getVidSrcEmbedUrl({
  mediaType,
  id,
  season,
  episode,
}: BuildVidSrcUrlOptions): string | null {
  if (id === undefined || id === null || String(id).trim() === '') {
    return null;
  }

  const normalizedId = String(id).trim();

  if (mediaType === 'tv') {
    const baseUrl = `https://vidsrc.to/embed/tv/${encodeURIComponent(normalizedId)}`;

    if (season && Number.isFinite(Number(season))) {
      const seasonNumber = Number(season);
      if (episode && Number.isFinite(Number(episode))) {
        return `${baseUrl}/${seasonNumber}/${Number(episode)}`;
      }
      return `${baseUrl}/${seasonNumber}`;
    }

    return baseUrl;
  }

  return `https://vidsrc.to/embed/movie/${encodeURIComponent(normalizedId)}`;
}
