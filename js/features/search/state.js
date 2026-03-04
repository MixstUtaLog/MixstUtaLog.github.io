export const state = {
  currentData: [],
  originalData: [],
  currentPage: 1,
  pageSize: 100,

  selectedSong: null,
  selectedArtist: null,
  selectedVtuber: null,

  vtuberCountsForSelectedSong: new Map(),
  hasUserRefined: false
};