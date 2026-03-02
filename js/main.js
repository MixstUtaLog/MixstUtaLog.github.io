import { initDateDefault } from "./ui.js";
import { loadSongCache } from "./api.js";
import { attachSuggest } from "./suggest.js";
import { initUIEvents } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
    initDateDefault();
    loadSongCache();
    attachSuggest("song");
    attachSuggest("artist");
    initUIEvents();
});