export type Playlist = { id: string; ownerId: string; tracks: string[] };
export type ShuffleVersion = { id: string; playlistId: string; order: string[]; createdAt: string };
export type MagicTop50 = { tracks: string[]; generatedAt: string };
export type UserAuth = { userId: string; email?: string; spotifyTokens?: any; lastfmTokens?: any };
