// sitemap.xml を生成する
//   使い方：リポジトリのルートで `node tools/make-sitemap.js`
//   - トップ階層の主要ページと article/ 内の全記事（.html）を載せる
//   - lastmod は各ファイルの最終コミット日。未コミットの変更があるファイルは今日の日付
//   - 載せたくないページは EXCLUDE に追加する
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://tsuri-boon.github.io/';
const EXCLUDE = new Set([
  'testindnx.html',              // テスト用ページ
  'article/lure_template.html',  // 記事テンプレート
  'makers.html',                 // maker-zukan.html への転送ページ
]);

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const git = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
const changed = new Set(execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).map(l => l.slice(3).replace(/"/g, '')));

function lastmod(rel) {
  if (changed.has(rel)) return todayStr;
  const d = git(`git log -1 --format=%cs -- "${rel}"`);
  return d || todayStr;
}

const top = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const articles = fs.readdirSync(path.join(ROOT, 'article')).filter(f => f.endsWith('.html')).map(f => 'article/' + f);
const pages = [...top, ...articles].filter(p => !EXCLUDE.has(p));

const priority = (p) => (p === 'index.html' ? '1.0' : p === 'lure-zukan.html' || p === 'maker-zukan.html' || p === 'lure-gatya.html' ? '0.9' : p.startsWith('article/') ? '0.7' : '0.5');

const urls = pages
  .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)))
  .map(p => [
    '  <url>',
    `    <loc>${BASE}${p === 'index.html' ? '' : p}</loc>`,  // トップは / を正規URLにする
    `    <lastmod>${lastmod(p)}</lastmod>`,
    `    <priority>${priority(p)}</priority>`,
    '  </url>',
  ].join('\n'));

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml を作成しました（${pages.length} ページ）`);
