// Connexion : la session et le token gardés dans le navigateur (src/lib/session.ts et src/lib/token.ts).
// Le stockage est simulé par une Map : ces tests n'ont besoin ni de navigateur ni d'internet.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLE_SESSION, ecrireSession, effacerSession, lireSession } from '../src/lib/session.ts';
import { CLE_TOKEN, ecrireToken, effacerToken, estTokenValide, lireToken } from '../src/lib/token.ts';

const stockageEnMemoire = () => {
	const donnees = new Map<string, string>();
	return {
		getItem: (cle: string) => donnees.get(cle) ?? null,
		setItem: (cle: string, valeur: string) => void donnees.set(cle, valeur),
		removeItem: (cle: string) => void donnees.delete(cle),
	};
};

const token = 'gho_' + 'A1b2'.repeat(9);
const session = { pseudo: 'octocat', nom: 'The Octocat', avatar: 'https://avatars.githubusercontent.com/u/583231' };

test('sans rien, personne n’est connecté', () => {
	const stockage = stockageEnMemoire();
	assert.equal(lireSession(stockage), null);
	assert.equal(lireToken(stockage), null);
	assert.equal(lireSession(null), null);
});

test('une session sans token compte comme déconnectée', () => {
	const stockage = stockageEnMemoire();
	ecrireSession(stockage, session);
	assert.equal(lireSession(stockage), null);
});

test('session et token : connecté', () => {
	const stockage = stockageEnMemoire();
	ecrireSession(stockage, session);
	ecrireToken(stockage, token);
	assert.deepEqual(lireSession(stockage), session);
	assert.equal(lireToken(stockage), token);
});

test('seuls les tokens gho_ bien formés sont acceptés', () => {
	assert.ok(estTokenValide(token));
	assert.ok(!estTokenValide('ghp_' + 'a'.repeat(36)));
	assert.ok(!estTokenValide('github_pat_' + 'a'.repeat(30)));
	assert.ok(!estTokenValide('gho_abc'));
	assert.ok(!estTokenValide('gho_' + 'a'.repeat(20) + '!'));
});

test('un token ou une session abîmés donnent « déconnecté »', () => {
	const stockage = stockageEnMemoire();
	ecrireSession(stockage, session);
	stockage.setItem(CLE_TOKEN, 'n_importe_quoi');
	assert.equal(lireSession(stockage), null);

	stockage.setItem(CLE_TOKEN, token);
	stockage.setItem(CLE_SESSION, '{abîmé');
	assert.equal(lireSession(stockage), null);
});

test('une photo qui n’est pas en https est refusée', () => {
	const stockage = stockageEnMemoire();
	ecrireToken(stockage, token);
	ecrireSession(stockage, { ...session, avatar: 'http://x' });
	assert.equal(lireSession(stockage), null);
});

test('effacer le token ou la session déconnecte', () => {
	const stockage = stockageEnMemoire();
	ecrireSession(stockage, session);
	ecrireToken(stockage, token);
	effacerToken(stockage);
	assert.equal(lireSession(stockage), null);

	ecrireToken(stockage, token);
	effacerSession(stockage);
	assert.equal(lireSession(stockage), null);
});

test('un stockage qui refuse tout ne fait pas planter', () => {
	const refuse = () => {
		throw new Error('stockage bloqué');
	};
	const casse = { getItem: refuse, setItem: refuse, removeItem: refuse };
	assert.equal(lireSession(casse), null);
	assert.equal(lireToken(casse), null);
	assert.equal(ecrireToken(casse, token), false);
	assert.equal(effacerToken(casse), false);
});
