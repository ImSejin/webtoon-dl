export interface Episode {
  comicId: string,
  comicIdx: number,
  episodeId: number,
  episodeIdx: number,
  episodeDisplayName: string,
  act: 'rent' | 'paid',
  url: string | URL,
  images: Array<string | URL>,
}
