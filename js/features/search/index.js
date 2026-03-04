import { initDateDefault, initUIEvents } from "./ui.js";
import { loadSongCache } from "./api.js";
import { attachSuggest } from "./suggest.js";

document.addEventListener("DOMContentLoaded", () => {
  initDateDefault();
  loadSongCache();
  attachSuggest("song");
  attachSuggest("artist");
  initUIEvents();
});