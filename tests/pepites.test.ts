// Sélection des « Pépites à soutenir » de l'accueil (src/lib/pepites.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NB_PEPITES, choisirPepites, construireRequetePepites } from '../src/lib/pepites.ts';
import type { RepoGithub } from '../src/lib/github.ts';

const repo = (proprietaire: string, nom: string, options: Partial<RepoGithub> & { type?: 'User' | 'Organization' } = {}): RepoGithub => ({
	full_name: `${proprietaire}/${nom}`,
	html_url: `https://github.com/${proprietaire}/${nom}`,
	description: null,
	language: null,
	stargazers_count: 5,
	open_issues_count: 1,
	updated_at: '2026-10-20T00:00:00Z',
	owner: { login: proprietaire, avatar_url: '', type: options.type ?? 'User' },
	...options,
});
const noms = (repos: RepoGithub[]) => repos.map((r) => r.full_name);

test('la requête vise les petits projets récents, actifs, avec une good first issue', () => {
	const requete = construireRequetePepites(new Date('2026-10-26T12:00:00Z'));
	assert.equal(
		requete,
		'good-first-issues:>0 stars:1..50 size:>200 created:>2025-10-26 pushed:>2026-09-26 archived:false fork:false',
	);
});

test('les repos de personnes passent avant ceux des organisations', () => {
	const choisis = choisirPepites([repo('asso', 'a', { type: 'Organization' }), repo('alice', 'b'), repo('bob', 'c')]);
	assert.deepEqual(noms(choisis), ['alice/b', 'bob/c', 'asso/a']);
});

test('un seul repo par auteur, sans tenir compte des majuscules', () => {
	const choisis = choisirPepites([repo('alice', 'a'), repo('Alice', 'b'), repo('bob', 'c')]);
	assert.deepEqual(noms(choisis), ['alice/a', 'bob/c']);
});

test('l’ordre de GitHub est gardé parmi les mêmes sortes de repos', () => {
	const choisis = choisirPepites([repo('c', '1'), repo('a', '2'), repo('b', '3')]);
	assert.deepEqual(noms(choisis), ['c/1', 'a/2', 'b/3']);
});

test('les repos privés et forkés sont écartés', () => {
	const choisis = choisirPepites([repo('a', '1', { private: true }), repo('b', '2', { fork: true }), repo('c', '3')]);
	assert.deepEqual(noms(choisis), ['c/3']);
});

test('on garde au plus le nombre demandé, 4 par défaut', () => {
	const beaucoup = ['a', 'b', 'c', 'd', 'e', 'f'].map((auteur) => repo(auteur, 'x'));
	assert.equal(choisirPepites(beaucoup).length, NB_PEPITES);
	assert.equal(choisirPepites(beaucoup, 2).length, 2);
});

test('une liste vide donne une liste vide', () => {
	assert.deepEqual(choisirPepites([]), []);
});
