// Recherche (src/lib/recherche.ts) : filtres lus dans l'adresse, requête envoyée à GitHub, adresses construites.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	LANGUES,
	MAX_FILTRES,
	FILTRES_VIDES,
	basculer,
	construireOptions,
	construireRequete,
	construireRequeteIssues,
	hrefIssues,
	hrefRecherche,
	lireFiltres,
} from '../src/lib/recherche.ts';
import { PREFERENCES_PAR_DEFAUT } from '../src/lib/preferences.ts';

const maintenant = new Date('2026-10-26T12:00:00Z');
const sansPreference = { ...PREFERENCES_PAR_DEFAUT, projetsActifs: false, masquerArchives: false };
const lire = (adresse: string) => lireFiltres(new URLSearchParams(adresse));
const requete = (filtres: object, preferences = sansPreference) =>
	construireRequete({ ...FILTRES_VIDES, ...filtres }, preferences, maintenant);

test('les langages et topics se lisent dans l’adresse', () => {
	assert.deepEqual(lire('langage=Go').langages, ['Go']);
	assert.deepEqual(lire('langage=Go,Rust').langages, ['Go', 'Rust']);
	assert.deepEqual(lire('topic=CLI,Docker').topics, ['cli', 'docker'], 'topics en minuscules');
	assert.deepEqual(lire('').langages, []);
	assert.deepEqual(lire('').topics, []);
});

test('les langages prennent leur nom officiel, même inconnu', () => {
	assert.deepEqual(lire('langage=go,RUST,c%2B%2B').langages, ['Go', 'Rust', 'C++']);
	assert.deepEqual(lire('langage=Brainfuck').langages, ['Brainfuck']);
});

test('doublons, valeurs vides et valeurs dangereuses sont ignorés', () => {
	assert.deepEqual(lire('langage=Go,go,GO').langages, ['Go']);
	assert.deepEqual(lire('langage=,Go,,').langages, ['Go']);
	assert.deepEqual(lire('langage=Go,<script>').langages, ['Go']);
});

test('au plus 5 langages et 5 topics', () => {
	assert.equal(lire('langage=a,b,c,d,e,f,g').langages.length, MAX_FILTRES);
	assert.equal(lire('topic=a,b,c,d,e,f,g').topics.length, MAX_FILTRES);
});

test('langages en OU, topics en ET : GitHub les répète', () => {
	assert.equal(requete({ langages: ['Go', 'Rust'] }), 'language:Go language:Rust stars:>=10');
	assert.equal(requete({ topics: ['cli', 'docker'] }), 'topic:cli topic:docker stars:>=10');
	assert.equal(
		requete({ q: 'api', langages: ['C++', 'Jupyter Notebook'], topics: ['react'] }),
		'api language:C++ language:"Jupyter Notebook" topic:react',
	);
});

test('sans filtre, on cherche les repos avec des good first issues', () => {
	assert.equal(requete({}), 'good-first-issues:>0 stars:>=10');
	assert.equal(requete({ q: 'cli' }), 'cli');
});

test('petits projets : 1 à 50 étoiles, assez de code, toujours actifs', () => {
	const petits = requete({ taille: 'petits', langages: ['Go'] });
	assert.ok(petits.includes('stars:1..50') && petits.includes('size:>200'));
	assert.ok(!petits.includes('stars:>=10'), 'plus de plancher à 10 étoiles');
	assert.ok(petits.includes('pushed:>'), 'actifs même sans la préférence');
	assert.ok(requete({ taille: 'petits', q: 'cli' }).startsWith('cli stars:1..50'));
	assert.ok(requete({ taille: 'petits' }).startsWith('good-first-issues:>0 stars:1..50'));
	assert.ok(requete({ taille: 'petits', langages: ['Go', 'Rust'], topics: ['cli'] }).startsWith('language:Go language:Rust topic:cli stars:1..50 size:>200'));
});

test('« pushed » n’apparaît qu’une fois avec la préférence « projets actifs »', () => {
	const avec = construireRequete({ ...FILTRES_VIDES, taille: 'petits' }, { ...sansPreference, projetsActifs: true }, maintenant);
	assert.equal((avec.match(/pushed:/g) ?? []).length, 1);
});

test('projets populaires : plus de 50 étoiles, sans forcer l’activité', () => {
	assert.equal(requete({ taille: 'populaires', q: 'cli' }), 'cli stars:>50');
	assert.ok(!requete({ taille: 'populaires' }).includes('pushed:'));
});

test('les archivés se masquent avec la préférence', () => {
	assert.ok(requete({ taille: 'petits' }, { ...sansPreference, masquerArchives: true }).includes('archived:false'));
});

test('la taille se lit dans l’adresse, « tous » par défaut', () => {
	assert.equal(lire('taille=petits').taille, 'petits');
	assert.equal(lire('taille=geant').taille, 'tous');
	assert.equal(lire('').taille, 'tous');
});

test('sans texte, les résultats sont triés par date de mise à jour', () => {
	assert.equal(construireOptions({ ...FILTRES_VIDES, taille: 'petits' }).tri, 'updated');
});

test('il y a 8 langues, avec des mots utilisables', () => {
	assert.equal(LANGUES.length, 8);
	assert.equal(new Set(LANGUES.map((langue) => langue.id)).size, 8, 'ids uniques');
	for (const langue of LANGUES) {
		assert.ok(langue.mots.length >= 4, langue.id);
		assert.ok(langue.mots.every((mot) => mot.length > 0 && !mot.includes(' ')), langue.id);
	}
});

test('la langue se lit dans l’adresse, vide si inconnue', () => {
	assert.equal(lire('langue=fr').langue, 'fr');
	assert.equal(lire('langue=klingon').langue, '');
	assert.equal(lire('').langue, '');
});

test('la langue ajoute des mots courants de cette langue à la requête', () => {
	assert.equal(requete({ langue: 'fr' }), 'in:name,description,readme avec pour dans des une stars:>=10');
	assert.ok(!requete({ langue: 'fr' }).includes('good-first-issues'));
	assert.equal(
		requete({ q: 'cli', langue: 'es', langages: ['Go'], topics: ['docker'] }),
		'cli in:name,description,readme para con una los que del language:Go topic:docker',
	);
	assert.ok(requete({ langue: 'de', taille: 'petits' }).includes('und der die mit für stars:1..50 size:>200'));
	assert.ok(requete({ langue: 'zh' }).includes('的 是 和 使用'), 'caractères chinois gardés tels quels');
});

test('les adresses de recherche', () => {
	assert.equal(hrefRecherche({}), '/recherche');
	assert.equal(hrefRecherche({ langages: ['Go', 'Rust'], topics: ['cli', 'docker'] }), '/recherche?langage=Go,Rust&topic=cli,docker');
	assert.equal(hrefRecherche({ taille: 'petits', langages: ['Go'] }), '/recherche?langage=Go&taille=petits');
	assert.ok(!hrefRecherche({ taille: 'tous' }).includes('taille'), '« tous » n’est pas écrit');
	assert.equal(hrefRecherche({ langue: 'ja' }), '/recherche?langue=ja');
	assert.ok(!hrefRecherche({ langue: '' }).includes('langue'));
	assert.ok(hrefRecherche({ ...lire('taille=petits'), page: 2 }).includes('taille=petits&page=2'));
});

test('une adresse construite se relit à l’identique', () => {
	const filtres = { ...FILTRES_VIDES, langages: ['C++', 'Go'], topics: ['x'] };
	assert.deepEqual(lire(hrefRecherche(filtres).split('?')[1]), filtres);
	assert.equal(lire(hrefRecherche({ langue: 'pt', taille: 'petits', langages: ['Go'] }).split('?')[1]).langue, 'pt');
});

test('les issues : adresse et requête', () => {
	assert.equal(hrefIssues({ langages: ['Go'], page: 2 }), '/good-first-issues?langage=Go&page=2');
	assert.ok(construireRequeteIssues({ ...FILTRES_VIDES, langages: ['Go', 'Rust'] }).includes('language:Go language:Rust'));
});

test('basculer ajoute ou retire un filtre, sans modifier la liste d’origine', () => {
	assert.deepEqual(basculer(['Go'], 'Rust'), ['Go', 'Rust']);
	assert.deepEqual(basculer(['Go', 'Rust'], 'go'), ['Rust']);
	assert.equal(basculer(['a', 'b', 'c', 'd', 'e'], 'f').length, 5, 'plein : n’ajoute plus');
	assert.equal(basculer(['a', 'b', 'c', 'd', 'e'], 'a').length, 4, 'plein : peut retirer');
	const liste = ['Go'];
	basculer(liste, 'Rust');
	assert.equal(liste.length, 1);
});
