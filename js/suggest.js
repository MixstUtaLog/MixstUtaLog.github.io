import { songCache } from "./api.js";

let activeIndex = -1;
let currentSuggestions = [];
let debounceTimer = null;

function createSuggestionList(inputElement) {

    const suggestionBox = inputElement.nextElementSibling;
    const keyword = inputElement.value.trim().toLowerCase();
    const isSongInput = inputElement.id === "song";
    const isArtistInput = inputElement.id === "artist";

    const artistInputRaw = document.getElementById("artist").value.trim();
    const artistInput = artistInputRaw.toLowerCase();

    const artistLengthOK = artistInput.length >= 2;
    const songLengthOK = keyword.length >= 2;

    let results = [];

    if (isSongInput) {

        if (songLengthOK) {
            results = songCache.filter(item =>
                item.song_normalized.includes(keyword)
            );
        }
        else if (!songLengthOK && artistLengthOK) {
            results = songCache.filter(item =>
                item.artist_normalized.includes(artistInput)
            );
        }
        else {
            suggestionBox.style.display = "none";
            suggestionBox.innerHTML = "";
            return;
        }

        if (artistLengthOK) {
            results = results.filter(item =>
                item.artist_normalized.includes(artistInput)
            );
        }

        results.sort((a, b) =>
            a.song.localeCompare(b.song, "ja")
        );

        currentSuggestions = results.slice(0, 50);

        suggestionBox.innerHTML = currentSuggestions
            .map((item, index) =>
                `<div class="suggest-item" data-index="${index}">
                    ${item.song}
                </div>`
            )
            .join("");

    }

    else if (isArtistInput) {

        if (!songLengthOK) {
            suggestionBox.style.display = "none";
            suggestionBox.innerHTML = "";
            return;
        }

        results = songCache.filter(item =>
            item.artist_normalized.includes(keyword)
        );

        const map = new Map();

        results.forEach(item => {
            const key = item.artist_normalized;
            if (!map.has(key)) {
                map.set(key, item.artist);
            }
        });

        const uniqueArtists = Array.from(map.values());

        uniqueArtists.sort((a, b) =>
            a.localeCompare(b, "ja")
        );

        currentSuggestions = uniqueArtists.slice(0, 50);

        suggestionBox.innerHTML = currentSuggestions
            .map((artist, index) =>
                `<div class="suggest-item" data-index="${index}">
                    ${artist}
                </div>`
            )
            .join("");
    }

    if (!currentSuggestions.length) {
        suggestionBox.style.display = "none";
        suggestionBox.innerHTML = "";
        return;
    }

    suggestionBox.style.display = "block";
    activeIndex = -1;
}

export function attachSuggest(inputId) {

    const input = document.getElementById(inputId);
    const suggestionBox = document.createElement("div");
    suggestionBox.className = "suggest-box";
    input.parentNode.appendChild(suggestionBox);

    input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            createSuggestionList(input);
        }, 300);
    });

    input.addEventListener("keydown", (e) => {

        if (!currentSuggestions.length) return;

        const items = suggestionBox.querySelectorAll(".suggest-item");

        if (e.key === "ArrowDown") {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            updateActive(items);
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            updateActive(items);
        }

        if (e.key === "Enter") {
            if (activeIndex >= 0) {
                e.preventDefault();
                selectSuggestion(input, currentSuggestions[activeIndex]);
            }
        }

        if (e.key === "Escape") {
            suggestionBox.style.display = "none";
        }
    });

    suggestionBox.addEventListener("click", (e) => {
        const item = e.target.closest(".suggest-item");
        if (!item) return;

        const index = Number(item.dataset.index);
        selectSuggestion(input, currentSuggestions[index]);
    });

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.style.display = "none";
        }
    });

    input.addEventListener("focus", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            createSuggestionList(input);
        }, 300);
    });
}

function updateActive(items) {
    items.forEach(item => item.classList.remove("active"));
    if (activeIndex >= 0) {
        items[activeIndex].classList.add("active");
    }
}

function selectSuggestion(input, item) {

    if (input.id === "song") {
        input.value = item.song;
        document.getElementById("artist").value = item.artist;
    }

    if (input.id === "artist") {
        input.value = item;
    }

    input.nextElementSibling.style.display = "none";
}