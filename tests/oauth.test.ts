// Connexion avec GitHub (src/lib/oauth.ts) : état de sécurité, adresse d'autorisation, retour de GitHub, échange du code.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLIENT_ID, ErreurConnexion, adresseAutorisation, echangerCode, etatValide, garderEtat, genererEtat, lireRetour, reprendreEtat } from '../src/lib/oauth.ts';

const stockageEnMemoire = () => {
	const donnees = new Map<string, string>();
	return {
		getItem: (cle: string) => donnees.get(cle) ?? null,
		setItem: (cle: string, valeur: string) => void donnees.set(cle, valeur),
		removeItem: (cle: string) => void donnees.delete(cle),
	};
};

// Un faux fetch qui répond toujours la même chose
const reponse = (corps: unknown, ok = true) => (async () => ({ ok, json: async () => corps })) as unknown as typeof fetch;

test('l’état est un nombre hexadécimal de 32 caractères, différent à chaque fois', () => {
	const premier = genererEtat();
	assert.match(premier, /^[0-9a-f]{32}$/);
	assert.notEqual(premier, genererEtat());
});

test('l’adresse d’autorisation pointe vers GitHub, sans scope', () => {
	const etat = genererEtat();
	const adresse = new URL(adresseAutorisation(etat));
	assert.equal(adresse.origin, 'https://github.com');
	assert.equal(adresse.pathname, '/login/oauth/authorize');
	assert.equal(adresse.searchParams.get('client_id'), CLIENT_ID);
	assert.equal(adresse.searchParams.get('state'), etat);
	assert.ok(!adresse.searchParams.has('scope'));
});

test('l’état gardé ne peut être repris qu’une fois', () => {
	const stockage = stockageEnMemoire();
	const etat = genererEtat();
	assert.ok(garderEtat(stockage, etat));
	assert.equal(reprendreEtat(stockage), etat);
	assert.equal(reprendreEtat(stockage), null);
	assert.ok(!garderEtat(null, etat));
});

test('l’état n’est valide que s’il est identique à celui gardé', () => {
	const etat = genererEtat();
	assert.ok(etatValide(etat, etat));
	assert.ok(!etatValide(genererEtat(), etat));
	assert.ok(!etatValide(etat, null));
	assert.ok(!etatValide('', ''));
});

test('le retour de GitHub est lu avec prudence', () => {
	assert.equal(lireRetour(new URLSearchParams('code=abcdef1234&state=zz')).type, 'code');
	assert.equal(lireRetour(new URLSearchParams('error=access_denied')).type, 'refus');
	assert.equal(lireRetour(new URLSearchParams('')).type, 'aucun');
	assert.equal(lireRetour(new URLSearchParams('code=abc&state=z')).type, 'aucun', 'code trop court');
	assert.equal(lireRetour(new URLSearchParams('code=abcdef1234')).type, 'aucun', 'code sans état');
});

test('l’échange du code renvoie le token', async () => {
	assert.equal(await echangerCode('abcdef1234', reponse({ access_token: 'gho_x' })), 'gho_x');
});

test('l’échange du code échoue avec une ErreurConnexion', async () => {
	const pannes = {
		'réponse en erreur': reponse({ erreur: 'x' }, false),
		'réponse sans token': reponse({}),
		'réseau coupé': (async () => {
			throw new Error('réseau');
		}) as unknown as typeof fetch,
	};
	for (const [nom, faux] of Object.entries(pannes)) {
		await assert.rejects(echangerCode('abcdef1234', faux), ErreurConnexion, nom);
	}
});
