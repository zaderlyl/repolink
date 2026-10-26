// Listes de langages et de topics proposées dans les filtres (src/data/filtres.ts) et couleurs des langages.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupesTopics, langagesRecherche, topicsRecherche } from '../src/data/filtres.ts';
import { couleurLangage } from '../src/lib/conversion.ts';
import { lireFiltres } from '../src/lib/recherche.ts';

const noms = langagesRecherche.map((langage) => langage.nom);

test('chaque langage est unique et a une couleur hexadécimale', () => {
	assert.equal(new Set(noms).size, noms.length);
	assert.ok(langagesRecherche.every((langage) => /^#[0-9a-f]{6}$/.test(langage.couleur)));
});

test('chaque langage et chaque topic passent la lecture des filtres tels quels', () => {
	for (const nom of noms) assert.equal(lireFiltres(new URLSearchParams({ langage: nom })).langages[0], nom);
	for (const topic of topicsRecherche) assert.equal(lireFiltres(new URLSearchParams({ topic })).topics[0], topic);
});

test('les topics sont en minuscules, sans espace, et sans doublon entre groupes', () => {
	assert.ok(topicsRecherche.every((topic) => topic === topic.toLowerCase() && !topic.includes(' ')));
	assert.equal(groupesTopics.flatMap((groupe) => groupe.topics).length, topicsRecherche.length);
});

test('chaque groupe a un titre et des topics', () => {
	assert.ok(groupesTopics.every((groupe) => groupe.titre && groupe.topics.length > 0));
});

test('les couleurs des langages', () => {
	assert.equal(couleurLangage('C#'), '#178600');
	assert.equal(couleurLangage('CSS'), '#563d7c');
	assert.equal(couleurLangage('JavaScript'), '#f1e05a');
	assert.equal(couleurLangage('Zig'), '#ec915c');
	assert.equal(couleurLangage('Inconnu'), '#8b949e', 'langage inconnu : gris');
	assert.equal(couleurLangage(null), '#8b949e');
});
