import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  TROPHY_ASSETS,
  AWARD_ASSETS,
  resolveTrophyAsset,
  resolveAwardAsset,
  groupTrophiesForVitrina,
  renderTrophyImgHTML,
  renderAwardImgHTML,
} from '../public/copas.js';

const publicCopasDir = path.resolve(process.cwd(), 'public', 'copas');

test('All referenced trophy & award SVG files exist on disk', () => {
  const allAssets = [...Object.values(TROPHY_ASSETS), ...Object.values(AWARD_ASSETS)];
  for (const asset of allAssets) {
    const filename = path.basename(asset.src);
    const fullPath = path.join(publicCopasDir, filename);
    assert.equal(fs.existsSync(fullPath), true, `Missing SVG file: ${fullPath}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.match(content, /<svg\b/i, `Invalid SVG header in ${filename}`);
  }
});

test('resolveTrophyAsset maps every UFRO tournament and division accurately', () => {
  assert.equal(resolveTrophyAsset({ type: 'LEAGUE', division: 1, title: 'Campeón Intercarreras (1ª División)' }).src, '/public/copas/intercarreras-1ra.svg');
  assert.equal(resolveTrophyAsset({ type: 'LEAGUE', division: 2, title: 'Campeón Intercarreras (2ª División)' }).src, '/public/copas/intercarreras-2da.svg');
  assert.equal(resolveTrophyAsset({ type: 'LEAGUE', division: 3, title: 'Campeón Intercarreras (3ª División)' }).src, '/public/copas/intercarreras-3ra.svg');
  assert.equal(resolveTrophyAsset({ type: 'FACULTY', title: 'Copa Facultad FICA' }).src, '/public/copas/copa-facultad.svg');
  assert.equal(resolveTrophyAsset({ type: 'INTERFACULTADES', title: 'Torneo Interfacultades UFRO' }).src, '/public/copas/interfacultades.svg');
  assert.equal(resolveTrophyAsset({ type: 'HEROIC_ASCENT', title: 'Hazaña 3ª → 1ª División UFRO' }).src, '/public/copas/hazana-ascenso.svg');
  assert.equal(resolveTrophyAsset({ type: 'SELECCION', title: 'Clasificatorio CNU (Sel. UFRO)' }).src, '/public/copas/clasificatorio-cnu.svg');
  assert.equal(resolveTrophyAsset({ type: 'SELECCION', title: 'Campeón LDES (Sel. UFRO)' }).src, '/public/copas/ldes.svg');
  assert.equal(resolveTrophyAsset({ type: 'SELECCION', title: 'Campeona Univerciudad (Sel. UFRO)' }).src, '/public/copas/univerciudad.svg');
  assert.equal(resolveTrophyAsset({ type: 'SELECCION', title: 'Histórico Nacional FENAUDE (Sel. UFRO)' }).src, '/public/copas/nacional-fenaude.svg');
  assert.equal(resolveTrophyAsset('NOTFC').src, '/public/copas/copa-notfc.svg');
});

test('resolveAwardAsset maps Futbol, Basket, and NOT F.C awards accurately', () => {
  assert.equal(resolveAwardAsset({ title: 'Goleador 1ª Div.', icon: '⚽' }).src, '/public/copas/premio-goleador.svg');
  assert.equal(resolveAwardAsset({ title: 'Goleadora del Torneo UFRO', icon: '⚽' }).src, '/public/copas/premio-goleador.svg');
  assert.equal(resolveAwardAsset({ title: 'Guante de Oro Femenino UFRO', icon: '🧤' }).src, '/public/copas/premio-guante.svg');
  assert.equal(resolveAwardAsset({ title: 'Cerebro del Torneo (1ª Div.)', icon: '🎯' }).src, '/public/copas/premio-asistencias.svg');
  assert.equal(resolveAwardAsset({ title: 'Muralla Defensiva UFRO', icon: '🧱' }).src, '/public/copas/premio-defensa.svg');
  assert.equal(resolveAwardAsset({ title: 'Defensor del Año (Básquet UFRO)', icon: '🛡️' }).src, '/public/copas/premio-defensa.svg');
  assert.equal(resolveAwardAsset({ title: 'Máximo Anotador (Básquet UFRO)', icon: '🏀' }).src, '/public/copas/premio-anotador-basket.svg');
  assert.equal(resolveAwardAsset({ title: 'Rey de los Tableros (Básquet UFRO)', icon: '💪' }).src, '/public/copas/premio-rebotes-basket.svg');
  assert.equal(resolveAwardAsset({ title: 'MVP Básquetbol UFRO', icon: '🌟' }).src, '/public/copas/premio-mvp.svg');
  assert.equal(resolveAwardAsset('MVP').src, '/public/copas/premio-mvp.svg');
  assert.equal(resolveAwardAsset('GOLEADOR').src, '/public/copas/premio-goleador.svg');
  assert.equal(resolveAwardAsset('GUANTE').src, '/public/copas/premio-guante.svg');
});

test('groupTrophiesForVitrina aggregates duplicates and sorts by prestige hierarchy', () => {
  const grouped = groupTrophiesForVitrina([
    { type: 'LEAGUE', division: 3, title: '3ª Div', year: 1 },
    { type: 'LEAGUE', division: 1, title: '1ª Div', year: 3 },
    { type: 'LEAGUE', division: 1, title: '1ª Div', year: 4 },
    { type: 'SELECCION', title: 'Histórico Nacional FENAUDE', year: 4 },
    { type: 'SELECCION', title: 'Campeón LDES', year: 3 },
  ]);
  assert.equal(grouped.length, 4);
  assert.equal(grouped[0].asset.key, 'FENAUDE');
  assert.equal(grouped[1].asset.key, 'LDES');
  assert.equal(grouped[2].asset.key, 'LEAGUE_1');
  assert.equal(grouped[2].count, 2);
  assert.deepEqual(grouped[2].years, [3, 4]);
});

test('HTML renderers escape attributes and embed SVG asset paths', () => {
  const tHtml = renderTrophyImgHTML({ type: 'FACULTY', title: 'Copa "FICA"' }, 'w-8 h-8');
  assert.match(tHtml, /src="\/public\/copas\/copa-facultad\.svg"/);
  assert.match(tHtml, /alt="Copa &quot;FICA&quot;"/);
  const aHtml = renderAwardImgHTML({ title: 'Guante de Oro', icon: '🧤' }, 'w-9 h-9');
  assert.match(aHtml, /src="\/public\/copas\/premio-guante\.svg"/);
});
