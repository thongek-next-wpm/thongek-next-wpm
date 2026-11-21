import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const README_PATH = path.join(ROOT_DIR, 'README.md');
const CONFIG_PATH = path.join(__dirname, 'profile-config.json');

const BADGE_CATALOG = {
  react19: { label: 'React_19', alt: 'React 19', color: '20232A', logo: 'react', logoColor: '61DAFB' },
  react: { label: 'React', alt: 'React', color: '20232A', logo: 'react', logoColor: '61DAFB' },
  nextjs: { label: 'Next.js', alt: 'Next.js', color: '000000', logo: 'nextdotjs', logoColor: 'white' },
  vue: { label: 'Vue.js', alt: 'Vue.js', color: '4FC08D', logo: 'vuedotjs', logoColor: 'white' },
  nuxt: { label: 'Nuxt.js', alt: 'Nuxt.js', color: '00DC82', logo: 'nuxtdotjs', logoColor: 'white' },
  vite: { label: 'Vite', alt: 'Vite', color: '646CFF', logo: 'vite', logoColor: 'white' },
  threejs: { label: 'Three.js', alt: 'Three.js', color: '000000', logo: 'threedotjs', logoColor: 'white' },
  tailwind: { label: 'Tailwind_CSS', alt: 'Tailwind CSS', color: '06B6D4', logo: 'tailwindcss', logoColor: 'white' },
  express: { label: 'Express', alt: 'Express', color: '1E293B', logo: 'express', logoColor: 'white' },
  supabase: { label: 'Supabase', alt: 'Supabase', color: '3ECF8E', logo: 'supabase', logoColor: 'white' },
  postgres: { label: 'PostgreSQL', alt: 'PostgreSQL', color: '4169E1', logo: 'postgresql', logoColor: 'white' },
  redis: { label: 'Redis', alt: 'Redis', color: 'DC382D', logo: 'redis', logoColor: 'white' },
  mongodb: { label: 'MongoDB', alt: 'MongoDB', color: '47A248', logo: 'mongodb', logoColor: 'white' },
  mysql: { label: 'MySQL', alt: 'MySQL', color: '4479A1', logo: 'mysql', logoColor: 'white' },
  sqlite: { label: 'SQLite', alt: 'SQLite', color: '003B57', logo: 'sqlite', logoColor: 'white' },
  firebase: { label: 'Firebase', alt: 'Firebase', color: 'DD2C00', logo: 'firebase', logoColor: 'white' },
  prisma: { label: 'Prisma', alt: 'Prisma', color: '2D3748', logo: 'prisma', logoColor: 'white' },
  docker: { label: 'Docker', alt: 'Docker', color: '2496ED', logo: 'docker', logoColor: 'white' },
  typescript: { label: 'TypeScript', alt: 'TypeScript', color: '3178C6', logo: 'typescript', logoColor: 'white' },
  javascript: { label: 'JavaScript', alt: 'JavaScript', color: 'F7DF1E', logo: 'javascript', logoColor: 'black' },
  nodejs: { label: 'Node.js', alt: 'Node.js', color: '339933', logo: 'nodedotjs', logoColor: 'white' },
  python: { label: 'Python', alt: 'Python', color: '3776AB', logo: 'python', logoColor: 'white' },
  flutter: { label: 'Flutter', alt: 'Flutter', color: '02569B', logo: 'flutter', logoColor: 'white' },
  dart: { label: 'Dart', alt: 'Dart', color: '0175C2', logo: 'dart', logoColor: 'white' },
  batch: { label: 'Windows_Batch', alt: 'Windows Batch', color: '4D4D4D' },
  powershell: { label: 'PowerShell', alt: 'PowerShell', color: '5391FE' },
  shell: { label: 'Shell', alt: 'Shell', color: '121011', logo: 'gnubash', logoColor: 'white' },
  githubpages: { label: 'GitHub_Pages', alt: 'GitHub Pages', color: '222222', logo: 'githubpages', logoColor: 'white' },
  vercel: { label: 'Vercel', alt: 'Vercel', color: '000000', logo: 'vercel', logoColor: 'white' },
  html: { label: 'HTML5', alt: 'HTML5', color: 'E34F26', logo: 'html5', logoColor: 'white' },
  css: { label: 'CSS3', alt: 'CSS3', color: '1572B6', logo: 'css3', logoColor: 'white' }
};

function buildHeaders(token, accept = 'application/vnd.github+json') {
  const headers = {
    'User-Agent': 'thongek-profile-updater/1.0',
    Accept: accept
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchJson(url, token, { allow404 = false } = {}) {
  const res = await fetch(url, { headers: buildHeaders(token) });
  if (allow404 && res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status} for ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchText(url, headers = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'thongek-profile-updater/1.0', ...headers }
  });
  if (!res.ok) {
    return null;
  }
  return res.text();
}

async function fetchPinnedRepoNames(username, token) {
  if (token) {
    try {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          ...buildHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query($login: String!) {
            user(login: $login) {
              pinnedItems(first: 6, types: REPOSITORY) {
                nodes {
                  ... on Repository {
                    name
                    isPrivate
                  }
                }
              }
            }
          }`,
          variables: { login: username }
        })
      });
      if (res.ok) {
        const payload = await res.json();
        const nodes = payload?.data?.user?.pinnedItems?.nodes ?? [];
        const names = nodes.filter((n) => n && !n.isPrivate && n.name).map((n) => n.name);
        if (names.length > 0) {
          return names;
        }
      }
    } catch (err) {
      console.warn(`GraphQL pinnedItems lookup failed, falling back to profile HTML: ${err.message}`);
    }
  }

  const html = await fetchText(`https://github.com/${encodeURIComponent(username)}`);
  if (!html) {
    return [];
  }
  const regex = new RegExp(
    `pinned-item-list-item[\\s\\S]*?href="/${escapeRegex(username)}/([^"?#/]+)"`,
    'g'
  );
  const names = [];
  for (const match of html.matchAll(regex)) {
    if (!names.includes(match[1])) {
      names.push(match[1]);
    }
  }
  return names;
}

async function fetchRepoFileText(username, repoName, filePath, token) {
  const data = await fetchJson(
    `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
    token,
    { allow404: true }
  );
  if (!data || !data.content) {
    return null;
  }
  return Buffer.from(data.content, data.encoding || 'base64').toString('utf8');
}

async function fetchRepoMetadata(username, repo, token) {
  const [languages, rootItems, readmeText] = await Promise.all([
    fetchJson(`https://api.github.com/repos/${username}/${repo.name}/languages`, token, { allow404: true }),
    fetchJson(`https://api.github.com/repos/${username}/${repo.name}/contents`, token, { allow404: true }),
    fetchText(`https://api.github.com/repos/${username}/${repo.name}/readme`, {
      ...buildHeaders(token, 'application/vnd.github.raw+json')
    })
  ]);

  const itemNames = new Set(Array.isArray(rootItems) ? rootItems.map((item) => item.name) : []);
  const pkgPaths = [];
  if (itemNames.has('package.json')) pkgPaths.push('package.json');
  if (itemNames.has('frontend')) pkgPaths.push('frontend/package.json');
  if (itemNames.has('backend')) pkgPaths.push('backend/package.json');

  const pkgContents = await Promise.all(
    pkgPaths.map((pkgPath) => fetchRepoFileText(username, repo.name, pkgPath, token))
  );
  const dockerCompose = itemNames.has('docker-compose.yml')
    ? await fetchRepoFileText(username, repo.name, 'docker-compose.yml', token)
    : null;

  const dependencies = new Map();
  for (const raw of pkgContents) {
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      for (const section of ['dependencies', 'devDependencies']) {
        for (const [dep, ver] of Object.entries(parsed[section] || {})) {
          dependencies.set(dep, String(ver));
        }
      }
    } catch {
      // Ignore malformed package.json
    }
  }

  return {
    languages: languages || {},
    rootItems: itemNames,
    dependencies,
    dockerCompose: dockerCompose || '',
    readmeText: readmeText || ''
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function formatRepoTitle(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveLiveUrl(repo, username) {
  const homepage = (repo.homepage || '').trim();
  if (homepage && /^https?:\/\//i.test(homepage) && !/^https?:\/\/github\.com\//i.test(homepage)) {
    return homepage.endsWith('/') ? homepage : `${homepage}/`;
  }
  if (repo.has_pages) {
    return `https://${username}.github.io/${repo.name}/`;
  }
  return null;
}

function isGenericDescription(repo) {
  const desc = (repo.description || '').trim();
  if (!desc) return true;
  return desc.toLowerCase() === repo.name.toLowerCase() || desc.length < 16;
}

function extractReadmeSummary(markdown) {
  if (!markdown) return '';
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  const collected = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!line) {
      if (collected.length > 0) break;
      continue;
    }
    if (/^(#{1,6}\s|!\[|\[!\[|<img|<p|<div|<a\s|---|\*\*\*|>\s)/.test(line)) {
      if (collected.length > 0) break;
      continue;
    }
    if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
      if (collected.length > 0) break;
      continue;
    }
    collected.push(line);
  }

  let text = collected
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length > 240) {
    text = text.slice(0, 237).replace(/\s+\S*$/, '').replace(/[,;:\-]+$/, '') + '...';
  }
  return text;
}

function pickRepoDescription(repo, meta, override) {
  if (override?.description) {
    return override.description;
  }
  if (!isGenericDescription(repo)) {
    return escapeHtml(repo.description.trim());
  }
  const fromReadme = extractReadmeSummary(meta.readmeText);
  if (fromReadme) {
    return escapeHtml(fromReadme);
  }
  if (repo.description?.trim()) {
    return escapeHtml(repo.description.trim());
  }
  return escapeHtml(`Repository built with ${repo.language || 'modern web tools'} by ${repo.owner?.login || 'thongek-next-wpm'}.`);
}

function detectTechBadges(repo, meta, override, hasLiveUrl) {
  if (Array.isArray(override?.badges)) {
    return override.badges;
  }

  const keys = [];
  const addKey = (key) => {
    if (BADGE_CATALOG[key] && !keys.includes(key)) {
      keys.push(key);
    }
  };

  const deps = meta.dependencies;
  const reactVer = deps.get('react') || '';
  if (deps.has('next')) addKey('nextjs');
  if (deps.has('react')) addKey(/(^|[~^=<> ])19\./.test(reactVer) ? 'react19' : 'react');
  if (deps.has('vue')) addKey('vue');
  if (deps.has('nuxt')) addKey('nuxt');
  if (deps.has('express')) addKey('express');
  if (deps.has('@supabase/supabase-js') || meta.rootItems.has('supabase')) {
    addKey('supabase');
    addKey('postgres');
  }
  if (deps.has('pg') || /\bpostgres(ql)?\b/i.test(meta.dockerCompose)) addKey('postgres');
  if (deps.has('redis') || deps.has('ioredis') || /\bredis\b/i.test(meta.dockerCompose)) addKey('redis');
  if (deps.has('mongoose') || deps.has('mongodb') || /\bmongo\b/i.test(meta.dockerCompose)) addKey('mongodb');
  if (deps.has('mysql2') || deps.has('mysql')) addKey('mysql');
  if (deps.has('prisma') || deps.has('@prisma/client')) addKey('prisma');
  if (deps.has('firebase')) addKey('firebase');

  if (meta.rootItems.has('Dockerfile') || meta.rootItems.has('docker-compose.yml')) {
    addKey('docker');
  }
  if (deps.has('vite')) addKey('vite');
  if (deps.has('three')) addKey('threejs');
  if (deps.has('tailwindcss')) addKey('tailwind');
  if (repo.has_pages) {
    addKey('githubpages');
  }

  const langs = meta.languages;
  if (langs.TypeScript && !keys.includes('typescript')) addKey('typescript');
  if (langs.Python) addKey('python');
  if (langs.Dart) addKey('dart');
  if (langs.Batchfile) addKey('batch');
  if (langs.PowerShell || /\bpowershell\b/i.test(meta.readmeText)) addKey('powershell');
  if (langs.Shell) addKey('shell');
  if (langs.JavaScript && keys.length === 0) addKey('javascript');
  if (langs.HTML && keys.length < 2) addKey('html');
  if (langs.CSS && keys.length < 2) addKey('css');

  for (const topic of repo.topics || []) {
    const normalized = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (BADGE_CATALOG[normalized]) addKey(normalized);
  }

  if (keys.length === 0 && repo.language) {
    const fallback = repo.language.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (BADGE_CATALOG[fallback]) addKey(fallback);
  }

  const maxTechBadges = hasLiveUrl ? 5 : 6;
  return keys.slice(0, maxTechBadges).map((key) => BADGE_CATALOG[key]);
}

function renderBadgeImg(badge) {
  const params = new URLSearchParams({ style: 'flat-square' });
  if (badge.logo) params.set('logo', badge.logo);
  if (badge.logoColor) params.set('logoColor', badge.logoColor);
  const src = `https://img.shields.io/badge/${badge.label}-${badge.color}?${params.toString()}`;
  return `<img src="${src}" alt="${escapeAttr(badge.alt || badge.label)}" />`;
}

function selectLiveWebsites(repos, config) {
  const { username, excludeRepos = [], liveWebsites = {} } = config;
  const excludeSet = new Set(excludeRepos);
  const overrides = liveWebsites.overrides || {};
  const sites = [];

  if (liveWebsites.autoDiscover !== false) {
    for (const repo of repos) {
      if (repo.private || repo.fork || repo.archived || excludeSet.has(repo.name)) {
        continue;
      }
      const liveUrl = resolveLiveUrl(repo, username);
      if (!liveUrl) continue;
      const override = overrides[repo.name] || {};
      if (override.hidden) continue;

      const highlights =
        override.highlights ||
        (!isGenericDescription(repo)
          ? escapeHtml(repo.description.trim())
          : escapeHtml(`Live ${repo.language || 'web'} project hosted on ${liveUrl.includes('github.io') ? 'GitHub Pages' : 'the web'}`));

      sites.push({
        name: repo.name,
        order: override.order ?? 999,
        pushedAt: repo.pushed_at || '',
        title: override.title || `🌐 ${escapeHtml(formatRepoTitle(repo.name))}`,
        highlights,
        liveUrl,
        repoUrl: repo.html_url,
        badgeColor: override.badgeColor || liveWebsites.defaultBadgeColor || '0EA5E9'
      });
    }
  }

  sites.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return b.pushedAt.localeCompare(a.pushedAt);
  });

  return sites;
}

function renderLiveWebsitesTable(sites) {
  const rows = sites
    .map(
      (site) => `  <tr>
    <td><b>${site.title}</b></td>
    <td>${site.highlights}</td>
    <td align="center">
      <a href="${escapeAttr(site.liveUrl)}" target="_blank"><img src="https://img.shields.io/badge/Live_Site-${site.badgeColor}?style=flat-square&logo=googlechrome&logoColor=white" alt="Visit ${escapeAttr(site.name)}" /></a>
      <a href="${escapeAttr(site.repoUrl)}" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="${escapeAttr(site.name)} Repository" /></a>
    </td>
  </tr>`
    )
    .join('\n');

  return `<table width="100%">
  <tr>
    <th width="25%" align="left">Website</th>
    <th width="50%" align="left">Highlights</th>
    <th width="25%" align="center">Links</th>
  </tr>
${rows}
</table>`;
}

async function selectFeaturedProjects(repos, pinnedNames, config, token) {
  const { username, statsHost, excludeRepos = [], featuredProjects = {} } = config;
  const excludeSet = new Set(excludeRepos);
  const includeForks = new Set(featuredProjects.includeForks || []);
  const overrides = featuredProjects.overrides || {};
  const maxPublic = featuredProjects.maxAutoPublicRepos ?? 5;

  const repoMap = new Map(repos.map((r) => [r.name, r]));
  const selected = [];
  const seen = new Set();

  const tryAddRepo = (repo) => {
    if (!repo || repo.private || repo.archived || excludeSet.has(repo.name) || seen.has(repo.name)) {
      return false;
    }
    if (repo.fork && !includeForks.has(repo.name) && !pinnedNames.includes(repo.name)) {
      return false;
    }
    seen.add(repo.name);
    selected.push(repo);
    return true;
  };

  for (const name of pinnedNames) {
    if (selected.length >= maxPublic) break;
    tryAddRepo(repoMap.get(name));
  }

  for (const repo of repos) {
    if (selected.length >= maxPublic) break;
    if (!repo.fork) {
      tryAddRepo(repo);
    }
  }

  for (const forkName of includeForks) {
    tryAddRepo(repoMap.get(forkName));
  }

  const metadataList = await Promise.all(
    selected.map((repo) => fetchRepoMetadata(username, repo, token))
  );

  const cards = selected.map((repo, idx) => {
    const meta = metadataList[idx];
    const override = overrides[repo.name] || {};
    const liveUrl = override.hideLiveBadge ? null : resolveLiveUrl(repo, username);
    const liveBadgeColor = override.liveBadgeColor || '0EA5E9';
    const badges = detectTechBadges(repo, meta, override, Boolean(liveUrl));

    return {
      type: 'repo',
      name: repo.name,
      repoUrl: repo.html_url,
      pinImageUrl: `${statsHost}/api/pin/?username=${encodeURIComponent(username)}&repo=${encodeURIComponent(repo.name)}&theme=algolia&bg_color=0D1117&hide_border=true`,
      title: override.title || `📦 ${escapeHtml(formatRepoTitle(repo.name))}`,
      description: pickRepoDescription(repo, meta, override),
      liveUrl,
      liveBadgeColor,
      badges
    };
  });

  for (const custom of featuredProjects.customCards || []) {
    if (custom.repoName && seen.has(custom.repoName)) {
      continue;
    }
    cards.push({ type: 'custom', ...custom });
  }

  return cards;
}

function renderProjectCell(card, colspan = 1) {
  const tdOpen = colspan > 1 ? `    <td colspan="${colspan}" valign="top">` : `    <td width="50%" valign="top">`;

  if (card.type === 'custom') {
    const subtitle = card.subtitle ? ` <sub><i>${escapeHtml(card.subtitle)}</i></sub>` : '';
    const badgesHtml = (card.badges || []).map(renderBadgeImg).join('\n        ');
    return `${tdOpen}
      <p align="center">
        <img width="100%" src="${escapeAttr(card.image)}" alt="${escapeAttr(card.imageAlt)}" />
      </p>
      <p>
        <b>${card.title}</b>${subtitle}<br />
        ${card.description}
      </p>
      <p>
        ${badgesHtml}
      </p>
    </td>`;
  }

  const badgeLines = [];
  if (card.liveUrl) {
    badgeLines.push(
      `<a href="${escapeAttr(card.liveUrl)}" target="_blank"><img src="https://img.shields.io/badge/Live_Website-${card.liveBadgeColor}?style=flat-square&logo=googlechrome&logoColor=white" alt="Live Website" /></a>`
    );
  }
  for (const badge of card.badges) {
    badgeLines.push(renderBadgeImg(badge));
  }

  return `${tdOpen}
      <p align="center">
        <a href="${escapeAttr(card.repoUrl)}" target="_blank">
          <img width="100%" src="${escapeAttr(card.pinImageUrl)}" alt="${escapeAttr(card.name)}" />
        </a>
      </p>
      <p>
        <b>${card.title}</b><br />
        ${card.description}
      </p>
      <p>
        ${badgeLines.join('\n        ')}
      </p>
    </td>`;
}

function renderFeaturedProjectsGrid(cards) {
  const rows = [];
  for (let i = 0; i < cards.length; i += 2) {
    const first = cards[i];
    const second = cards[i + 1];
    if (second) {
      rows.push(`  <tr>\n${renderProjectCell(first)}\n${renderProjectCell(second)}\n  </tr>`);
    } else {
      rows.push(`  <tr>\n${renderProjectCell(first, 2)}\n  </tr>`);
    }
  }
  return `<table width="100%">\n${rows.join('\n')}\n</table>`;
}

function replaceMarkerBlock(content, markerName, newBody) {
  const startMarker = `<!-- AUTO:${markerName}:START -->`;
  const endMarker = `<!-- AUTO:${markerName}:END -->`;
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Missing or malformed markers for ${markerName} in README.md`);
  }

  const before = content.slice(0, startIdx + startMarker.length);
  const after = content.slice(endIdx);
  return `${before}\n${newBody}\n${after}`;
}

async function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  const { username } = config;

  const [repos, pinnedNames] = await Promise.all([
    fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&type=owner`, token),
    fetchPinnedRepoNames(username, token)
  ]);

  const liveSites = selectLiveWebsites(repos, config);
  const projectCards = await selectFeaturedProjects(repos, pinnedNames, config, token);

  const rawReadme = fs.readFileSync(README_PATH, 'utf8');
  const usesCrlf = rawReadme.includes('\r\n');
  let updated = rawReadme.replace(/\r\n/g, '\n');

  updated = replaceMarkerBlock(updated, 'LIVE_WEBSITES', renderLiveWebsitesTable(liveSites));
  updated = replaceMarkerBlock(updated, 'FEATURED_PROJECTS', renderFeaturedProjectsGrid(projectCards));

  if (usesCrlf) {
    updated = updated.replace(/\n/g, '\r\n');
  }

  if (updated !== rawReadme) {
    fs.writeFileSync(README_PATH, updated, 'utf8');
    console.log(`Updated README.md (${liveSites.length} live websites, ${projectCards.length} featured project cards).`);
  } else {
    console.log('README.md is already up to date.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
