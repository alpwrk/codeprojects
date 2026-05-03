// ─── KONFIGURATION ────────────────────────────────────────────
const GITHUB_USERNAME = 'alpwrk';

const WEBSITE_LINKS = {
  // 'repo-name': 'https://deine-website.de',
};
// ─────────────────────────────────────────────────────────────

function getStatus(repo) {
  if (repo.archived) return 'archived';
  if (repo.topics && repo.topics.includes('wip')) return 'wip';
  return 'active';
}

function langColor(lang) {
  const map = {
    JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572A5',
    Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
    C: '#555555', HTML: '#e34c26', CSS: '#563d7c', Ruby: '#701516',
    Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  };
  return map[lang] || '#666';
}

function linkifyDesc(text) {
  return text.replace(/\b([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g, (match) =>
    `<a href="https://${match}" target="_blank" onclick="event.stopPropagation()">${match} ↗</a>`
  );
}

function langBar(langs) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (!total) return '';
  const segments = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, bytes]) => {
      const pct = (bytes / total * 100).toFixed(1);
      return `<span style="width:${pct}%;background:${langColor(lang)};height:100%;display:inline-block;" title="${lang} ${pct}%"></span>`;
    }).join('');
  const labels = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, bytes]) => {
      const pct = (bytes / total * 100).toFixed(1);
      return `<span class="tag lang" style="border-color:${langColor(lang)}33;color:${langColor(lang)}cc">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${langColor(lang)};margin-right:4px;vertical-align:middle"></span>${lang} <span style="color:#444">${pct}%</span>
      </span>`;
    }).join('');
  return `
    <div style="width:100%;height:4px;border-radius:2px;overflow:hidden;display:flex;margin-bottom:8px;background:#1a1a1a">${segments}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${labels}</div>`;
}

async function loadRepos() {
  const grid = document.getElementById('grid');
  try {
    let page = 1, repos = [];
    while (true) {
      const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      repos = repos.concat(data);
      if (data.length < 100) break;
      page++;
    }

    repos.sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      return new Date(b.pushed_at) - new Date(a.pushed_at);
    });

    const langData = await Promise.all(
      repos.map(r => fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${r.name}/languages`).then(r => r.json()).catch(() => ({})))
    );

    grid.innerHTML = repos.map((repo, i) => {
      const status = getStatus(repo);
      const websiteUrl = WEBSITE_LINKS[repo.name];
      const topics = (repo.topics || []).filter(t => t !== 'wip');
      const langs = langData[i] || {};
      const created = new Date(repo.created_at).toLocaleDateString('de-DE');

      return `
        <div class="project-card" onclick="window.open('${websiteUrl || repo.html_url}','_blank')" style="cursor:pointer">
          <span class="project-name">${repo.name}</span>
          <span style="display:flex;align-items:center;gap:18px;grid-column:2;grid-row:1">
            ${websiteUrl
              ? `<a class="project-link" href="${websiteUrl}" target="_blank" onclick="event.stopPropagation()">${new URL(websiteUrl).hostname} ↗</a>`
              : `<a class="project-link" href="${repo.html_url}" target="_blank" onclick="event.stopPropagation()">github ↗</a>`
            }
            <span class="status-dot ${status}"></span>
          </span>
          <span style="font-family:'DM Mono',monospace;font-size:0.68rem;color:var(--muted);letter-spacing:0.04em;grid-column:2;grid-row:2;align-self:start;white-space:nowrap">CREATED ${created}</span>
          <p class="project-desc">${repo.description ? linkifyDesc(repo.description) : '<span style="color:#333">NO DESCRIPTION</span>'}</p>
          <div class="project-meta">
            <div style="width:100%">${langBar(langs)}</div>
            ${topics.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>`;
    }).join('');

  } catch (e) {
    grid.innerHTML = `<div class="project-card" style="color:#e55;font-family:'DM Mono',monospace;font-size:0.8rem">
      fehler beim laden — username korrekt? (${e.message})
    </div>`;
  }
}

loadRepos();