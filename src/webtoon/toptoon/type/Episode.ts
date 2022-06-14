export interface Episode {
  comicId: string,
  comicIdx: number,
  episodeId: number,
  episodeIdx: number,
  act: 'rent' | 'paid',
  url: string | URL,
  images: Array<string | URL>,
}
