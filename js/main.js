window.addEventListener("DOMContentLoaded", function () {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById("date_to").value = `${yyyy}-${mm}-${dd}`;
});

const supabaseUrl = "https://lmddclqnqzkdvxvfzhor.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZGRjbHFucXprZHZ4dmZ6aG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjkzMzYsImV4cCI6MjA4NjU0NTMzNn0.2xXa8YPwgkzRgiaFnAgOukiR7hsAKYb1avqRCyYe3FU";
const client = window.supabase.createClient(supabaseUrl, supabaseKey);
let currentData = [];
let currentPage = 1;
const pageSize = 100;
let totalCount = 0;

let songCache = [];
let activeIndex = -1;
let currentSuggestions = [];
let debounceTimer = null;

async function loadSongCache() {
    let allData = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await client
            .from("songs")
            .select("id, song, artist, song_normalized, artist_normalized")
            .range(from, from + pageSize - 1);

        if (error) {
            console.error(error);
            break;
        }

        allData = allData.concat(data);

        if (data.length < pageSize) break;

        from += pageSize;
    }

    songCache = allData;
    console.log("Song cache loaded:", songCache.length);
}

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

function attachSuggest(inputId) {

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



function validate() {
    const song = document.getElementById("song").value.trim();
    const artist = document.getElementById("artist").value.trim();
    const btn = document.getElementById("searchBtn");
    const message = document.getElementById("message");

    if (!song && !artist) {
        btn.disabled = true;
        message.innerText = "曲名 / アーティスト名どちらかを入力してください";
    } else {
        btn.disabled = false;
        message.innerText = "";
    }
}


function getVtuberClass(name) {
    switch(name.trim()) {
        case "空奏イト": return "ito";
        case "天吹サン": return "san";
        case "小鈴りあん": return "lian";
        case "雪白キャル": return "qalu";
        case "星乃りむ": return "rimu";
        case "成海ミャオ": return "myao";
        case "琴宮いおり": return "iori";
        case "渚沢シチ": return "shichi";
        default: return "other";
    }
}

function render(data) {
    const resultDiv = document.getElementById("result");
    let html = "";

    data.forEach(item => {
        let timestampUrl = item.url;
        if (item.song_time) {
            timestampUrl += (item.url.includes("?") ? "&" : "?") + "t=" + item.song_time + "s";
        }

        let vtuberHtml = "";
        if (item.vtubers) {
            const members = item.vtubers.split(",");
            members.forEach(name => {
                const cls = getVtuberClass(name);
                vtuberHtml += `<span class="vtuber-tag ${cls}">${name.trim()}</span>`;
            });
        }

     html += `
        <div class="card">
            <div class="card-title">
                ♪ <a href="${timestampUrl}" target="_blank">${item.song}</a>
                <span class="artist-name">${item.artist}</span>
            </div>

            <div class="card-sub">
                <div class="stream-date">${item.streamdate}</div>
                <div class="stream-name">${item.stream_name || ""}</div>
            </div>

            <div class="member-list">
                ${vtuberHtml}
            </div>

            ${item.memo && item.memo.trim() !== "" 
                ? `<div class="memo">※ ${item.memo}</div>` 
                : ""}
        </div>
        `;

    });

    resultDiv.innerHTML = html;

    const bottomPaginationHtml = `
        <div id="bottomPagination">
            <button id="prevPageBottom">◀</button>
            <button id="nextPageBottom">▶</button>
        </div>
    `;

    const existing = document.getElementById("bottomPagination");
    if (existing) existing.remove();

    resultDiv.insertAdjacentHTML('afterend', bottomPaginationHtml);

    const prevBtn = document.getElementById("prevPageBottom");
    const nextBtn = document.getElementById("nextPageBottom");

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => changePage(currentPage - 1));
        nextBtn.addEventListener("click", () => changePage(currentPage + 1));

        const maxPage = Math.ceil(totalCount / pageSize);
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === maxPage;
    }
}

function renderPage() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = currentData.slice(start, end);
    render(pageData);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function updatePagination() {
    const maxPage = Math.ceil(totalCount / pageSize);
    document.getElementById("resultControls").style.display = "flex";
    document.getElementById("pageInput").value = currentPage;
    document.getElementById("pageInput").max = maxPage;
    document.getElementById("maxPage").textContent = maxPage;
    document.getElementById("totalCount").textContent = totalCount;

    const prevTop = document.getElementById("prevPage");
    const nextTop = document.getElementById("nextPage");
    if (prevTop) prevTop.disabled = currentPage === 1;
    if (nextTop) nextTop.disabled = currentPage === maxPage;

}


function changePage(newPage) {
    const maxPage = Math.ceil(totalCount / pageSize);
    if (newPage < 1) newPage = 1;
    if (newPage > maxPage) newPage = maxPage;
    currentPage = newPage;
    updatePagination();
    renderPage();
}

function sortLocal() {
    if (!currentData.length) return;
    const column = document.getElementById("sort_column").value;
    const order = document.getElementById("sort_order").value;

    currentData.sort((a, b) => {
        let valA, valB;
        if (column === "date") {
            valA = new Date(a.streamdate);
            valB = new Date(b.streamdate);
        } else {
            valA = (a[column] || "").toLowerCase();
            valB = (b[column] || "").toLowerCase();
        }           
        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
        return 0;
    });

    currentPage = 1;
    updatePagination();
    renderPage();
}

async function search() {
    const resultDiv = document.getElementById("result");
    resultDiv.innerText = "検索中...";

    const song = document.getElementById("song").value.trim();
    const artist = document.getElementById("artist").value.trim();

    const checked = Array.from(document.querySelectorAll(".vtuber:checked"));
    const vtuberIds = checked.map(cb => Number(cb.value));

    const vtuberMode = document.getElementById("vtuber_mode").value;
    const externalMode = document.getElementById("external_mode").value;

    const dateFrom = document.getElementById("date_from").value;
    const dateTo = document.getElementById("date_to").value;

    const { data, error } = await client.rpc("search_song_streams", {
        p_song: song || null,
        p_artist: artist || null,
        p_vtuber_ids: vtuberIds.length ? vtuberIds : null,
        p_vtuber_mode: vtuberMode,
        p_external_mode: externalMode,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
        p_sort_column: "date",
        p_sort_order: "desc",
        p_limit: 500,
        p_offset: 0
    });

    if (error) {
        resultDiv.innerText = error.message;
        return;
    }

    if (!data || data.length === 0) {
        currentData = [];
        totalCount = 0;
        document.getElementById("resultControls").style.display = "none";
        resultDiv.innerText = "該当するデータがありません。";
        return;
    }

    currentData = data;
    totalCount = data.length;

    const sortColumn = document.getElementById("sort_column");
    const sortOrder = document.getElementById("sort_order");

    if (sortColumn) sortColumn.value = "date";
    if (sortOrder) sortOrder.value = "desc";

    if (totalCount >= 500) {
        document.getElementById("message").innerText = "※検索結果が500件に達しました。条件を絞ってください。";
    } else {
        document.getElementById("message").innerText = "";
    }

    currentPage = 1;
    updatePagination();
    renderPage();
}

validate();

window.addEventListener("DOMContentLoaded", () => {

    document.getElementById("prevPage")?.addEventListener("click", () => {
        changePage(currentPage - 1);
    });

    document.getElementById("nextPage")?.addEventListener("click", () => {
        changePage(currentPage + 1);
    });

    const pageInput = document.getElementById("pageInput");

    if (pageInput) {
        pageInput.addEventListener("change", () => {
            changePage(Number(pageInput.value));
        });

        pageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                changePage(Number(pageInput.value));
            }
        });
    }

    document.getElementById("sort_column")?.addEventListener("change", sortLocal);
    document.getElementById("sort_order")?.addEventListener("change", sortLocal);

    loadSongCache();
    attachSuggest("song");
    attachSuggest("artist");
});
