// Worker Cloudflare de connexion (worker/index.js) : CORS, origines autorisées, échange du code.
// GitHub est simulé en remplaçant fetch : aucun appel réel, aucun secret.
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import worker from '../worker/index.js';

const ORIGINE = 'https://zaderlyl.github.io';
const env = { CLIENT_ID: 'id-de-test', CLIENT_SECRET: 'secret-de-test' };
const fetchReel = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = fetchReel;
});

const appeler = (methode: string, origine: string | null, corps?: unknown): Promise<Response> =>
	worker.fetch(
		new Request('https://worker.test/', {
			method: methode,
			headers: origine ? { Origin: origine } : {},
			body: corps === undefined ? undefined : JSON.stringify(corps),
		}),
		env,
	);

// Fait répondre GitHub avec `corps` et garde la requête reçue
const simulerGithub = (corps: unknown) => {
	const recues: { url: string; corps: Record<string, string> }[] = [];
	globalThis.fetch = (async (url: string, options: { body: string }) => {
		recues.push({ url: String(url), corps: JSON.parse(options.body) });
		return { json: async () => corps };
	}) as unknown as typeof fetch;
	return recues;
};

test('la requête préliminaire CORS répond 204 sans contenu', async () => {
	const reponse = await appeler('OPTIONS', ORIGINE);
	assert.equal(reponse.status, 204);
	assert.equal(reponse.headers.get('access-control-allow-origin'), ORIGINE);
	assert.equal(reponse.headers.get('access-control-allow-headers'), 'Content-Type');
	assert.equal(await reponse.text(), '');
});

test('le serveur de développement est autorisé', async () => {
	assert.equal((await appeler('OPTIONS', 'http://localhost:4321')).status, 204);
});

test('une autre origine, ou aucune, est refusée', async () => {
	assert.equal((await appeler('OPTIONS', 'https://autre.com')).status, 403);
	assert.equal((await appeler('POST', null, { code: 'abcdef1234' })).status, 403);
});

test('seul POST est accepté', async () => {
	assert.equal((await appeler('GET', ORIGINE)).status, 405);
});

test('un corps ou un code invalide donne 400', async () => {
	const invalide = await worker.fetch(new Request('https://worker.test/', { method: 'POST', headers: { Origin: ORIGINE }, body: 'pas du json' }), env);
	assert.equal(invalide.status, 400);
	assert.equal((await appeler('POST', ORIGINE, { code: 'court' })).status, 400);
	assert.equal((await appeler('POST', ORIGINE, { code: 12345678901 })).status, 400);
});

test('un code valide est échangé contre le token, avec le secret', async () => {
	const recues = simulerGithub({ access_token: 'gho_abc' });
	const reponse = await appeler('POST', ORIGINE, { code: 'abcdef1234' });
	assert.equal(reponse.status, 200);
	assert.deepEqual(await reponse.json(), { access_token: 'gho_abc' });
	assert.equal(recues[0].url, 'https://github.com/login/oauth/access_token');
	assert.deepEqual(recues[0].corps, { client_id: 'id-de-test', client_secret: 'secret-de-test', code: 'abcdef1234' });
});

test('si GitHub refuse le code, le Worker répond 400 sans token', async () => {
	simulerGithub({ error: 'bad_verification_code' });
	const reponse = await appeler('POST', ORIGINE, { code: 'abcdef1234' });
	assert.equal(reponse.status, 400);
	assert.ok(!JSON.stringify(await reponse.json()).includes('access_token'));
});
