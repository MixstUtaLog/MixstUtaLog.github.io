export function renderArtistSummaries(songSummary, vtuberSummary, state, onSongClick, onVtuberClick) {
    const songBox = document.getElementById("songRefineBox");
    const vtuberBox = document.getElementById("vtuberRefineBox");

    songBox.innerHTML = "";
    vtuberBox.innerHTML = "";

    songSummary.forEach(song => {
        const btn = document.createElement("button");
        btn.className = "refine-btn song";
        btn.textContent = `${song.song} (${song.count})`;
        btn.onclick = () => onSongClick(song.song_id, song.song);

        if (state.selectedSong === song.song_id) {
            btn.classList.add("active-refine");
        }
        songBox.appendChild(btn);
    });

    vtuberSummary.forEach(vtuber => {
        const btn = document.createElement("button");
        const cls = vtuber.id === -1 ? "other" : getVtuberClass(vtuber.name);
        btn.className = `refine-btn ${cls}`;
        btn.textContent = `${vtuber.id === -1 ? "外部コラボ" : vtuber.name} (${vtuber.count})`;
        btn.onclick = () => onVtuberClick(vtuber.id, vtuber.name);

        if (state.selectedVtuberId === vtuber.id) {
            btn.classList.add("active-refine");
        }
        vtuberBox.appendChild(btn);
    });
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
        case "外部コラボ": return "other";
        default: return "other";
    }
}

export function renderArtistDetail(detail) {
    const resultDiv = document.getElementById("artistResult");
    let html = "";

    detail.forEach(item => {
        let timestampUrl = item.url;
        if (item.song_time) {
            timestampUrl += (item.url.includes("?") ? "&" : "?") + "t=" + item.song_time + "s";
        }

        let vtuberHtml = "";
        if (item.vtubers) {
            const members = item.vtubers.split(",");
            members.forEach(name => {
                const trimmed = name.trim();
                const cls = getVtuberClass(trimmed);
                vtuberHtml += `
                    <span class="vtuber-tag ${cls}">
                        ${trimmed}
                    </span>
                `;
            });
        }

        html += `
        <div class="card">
            <div class="card-title">
                ♪ <a href="${timestampUrl}" target="_blank" rel="noopener noreferrer">
                    ${item.song}
                </a>
                <span class="artist-name">${item.artist}</span>
            </div>

            <div class="card-sub">
                <div class="stream-date">${item.streamdate}</div>
                <div class="stream-name">${item.stream_name || ""}</div>
            </div>

            <div class="member-list">
                ${vtuberHtml}
            </div>

            ${item.memo && item.memo.trim() !== "" ? `<div class="memo">※ ${item.memo}</div>` : ""}
        </div>
        `;
    });

    resultDiv.innerHTML = html;
}

export function clearArtistDetail() {
    document.getElementById("artistResult").innerHTML = "";
}

export function renderArtistPagination(
  totalCount,
  currentPage,
  pageSize,
  onPageChange
) {
  const container = document.getElementById("artistPagination");
  container.innerHTML = "";

  const maxPage = Math.ceil(totalCount / pageSize);
  if (maxPage <= 1) return;

  const prev = document.createElement("button");
  prev.innerText = "◀";
  prev.disabled = currentPage === 1;
  prev.onclick = () => onPageChange(currentPage - 1);

  const next = document.createElement("button");
  next.innerText = "▶";
  next.disabled = currentPage === maxPage;
  next.onclick = () => onPageChange(currentPage + 1);

  const info = document.createElement("span");
  info.innerText = ` ${currentPage} / ${maxPage} `;

  container.appendChild(prev);
  container.appendChild(info);
  container.appendChild(next);
}

export function renderActiveFilters(state, removeSong, removeVtuber) {
    const container = document.getElementById("activeFilters");
    container.innerHTML = "";

    if (!state.selectedSong && !state.selectedVtuberId) return;

    const title = document.createElement("div");
    title.textContent = "現在の絞り込み:";
    title.style.fontWeight = "bold";
    container.appendChild(title);

    if (state.selectedSong) {
        const tag = createTag(`曲: ${state.selectedSongName}`, removeSong);
        container.appendChild(tag);
    }

    if (state.selectedVtuberId) {
        const tag = createTag(`メンバー: ${state.selectedVtuberName}`, removeVtuber);
        container.appendChild(tag);
    }
}

function createTag(text, onRemove) {
    const span = document.createElement("span");
    span.className = "filter-tag";
    span.innerHTML = `${text} ×`;
    span.onclick = onRemove;
    return span;
}