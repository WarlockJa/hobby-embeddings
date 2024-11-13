export interface Env {
	VECTORIZE: Vectorize;
	AI: Ai;
	ACCESS_KEY: string;
}
interface EmbeddingResponse {
	shape: number[];
	data: number[][];
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// checking for accesskey header
		const headers = new Headers(request.headers);
		const keyHeader = headers.get('x-access-key');
		if (keyHeader !== env.ACCESS_KEY) {
			return new Response('access denied', { status: 403 });
		}

		// url params
		const url = new URL(request.url);

		const path = url.pathname;
		if (path.startsWith('/favicon')) {
			return new Response('', { status: 404 });
		}

		// search query params
		// query param for vectorized query
		const query = url.searchParams.get('query');
		const topK = Number(url.searchParams.get('topK')) ?? 1;

		if (!query) {
			return new Response('insufficient data', { status: 400 });
		}

		// generating query vector
		const queryVector: EmbeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
			text: [query],
		});

		const matches = await env.VECTORIZE.query(queryVector.data[0], {
			topK,
		});

		return Response.json({
			// cosine distance metric, where the closer to one, the more similar.
			matches: matches,
		});
	},
} satisfies ExportedHandler<Env>;
