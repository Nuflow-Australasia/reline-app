// Fetches the latest published posts from selected Circle spaces and writes
// posts.json for the app's Home tab. Only titles, dates, space names and links
// are written: this file is public once deployed.
import { writeFile } from 'node:fs/promises';

const OUT = process.argv[2] || 'posts.json';
const TOKEN = process.env.CIRCLE_API_TOKEN;
const LIMIT = 5;
// Space IDs from Circle: Updates, Community Feed
const SPACE_IDS = [2038147, 2039046];

async function fetchSpace(id) {
  const url = `https://app.circle.so/api/admin/v2/posts?space_id=${id}&status=published&sort=latest&per_page=${LIMIT}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Space ${id}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data.records || []).map(p => ({
    title: p.name,
    url: p.url,
    space: p.space_name,
    space_slug: p.space_slug,
    published_at: p.published_at,
  }));
}

let posts = [];
let ok = true;
if (!TOKEN) {
  console.warn('CIRCLE_API_TOKEN is not set — writing an empty list.');
  ok = false;
} else {
  for (const id of SPACE_IDS) {
    try { posts.push(...await fetchSpace(id)); }
    catch (e) { ok = false; console.warn(e.message); }
  }
}
posts.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
posts = posts.slice(0, LIMIT);

await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), ok, posts }, null, 2));
console.log(`Wrote ${posts.length} posts to ${OUT}${ok ? '' : ' (with warnings)'}`);
