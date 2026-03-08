import { initDateDefault, initUIEvents } from "./ui.js";
import { attachSuggest } from "./suggest.js";

document.addEventListener("DOMContentLoaded",()=>{

  initDateDefault();

  attachSuggest("song");
  attachSuggest("artist");

  initUIEvents();

});