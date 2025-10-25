import Fastify from "fastify";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Simple health check
fastify.get("/api/v1/health", async () => ({ ok: true }));

// Helper to load JSON index generated at build-time (if exists)
async function loadIndex(): Promise<any> {
	// prefer api/public first, then web/public
	const candidates = [
		path.resolve(__dirname, "../public/index.json"),
		path.resolve(__dirname, "../../web/public/index.json"),
	];
	for (const p of candidates) {
		try {
			const raw = await fs.readFile(p, "utf-8");
			return JSON.parse(raw);
		} catch (err) {
			// ignore and try next
		}
	}
	return null;
}

// Example route: list categories (from static categories.json or derived from index)
fastify.get("/api/v1/categories", async (request, reply) => {
	try {
		// try categories.json first
		const candidates = [
			path.resolve(__dirname, "../public/categories.json"),
			path.resolve(__dirname, "../../web/public/categories.json"),
		];
		for (const p of candidates) {
			try {
				const raw = await fs.readFile(p, "utf-8");
				const data = JSON.parse(raw);
				return { data };
			} catch (err) {
				// continue
			}
		}

		// fallback: derive from index.json
		const index = await loadIndex();
		if (index && Array.isArray(index.categories)) {
			return { data: index.categories };
		}

		reply.code(204);
		return { data: [] };
	} catch (err) {
		request.log.error(err);
		reply.code(500);
		return { error: "failed_to_load_categories" };
	}
});

// Example route: files for a category
fastify.get("/api/v1/categories/:categoryId/files", async (request, reply) => {
	const { categoryId } = request.params as { categoryId: string };
	try {
		const index = await loadIndex();
		if (!index || !Array.isArray(index.files)) {
			reply.code(404);
			return { error: "index_not_found" };
		}
		const files = index.files.filter((f: any) => f.categoryId === categoryId);
		return { data: files, meta: { total: files.length } };
	} catch (err) {
		request.log.error(err);
		reply.code(500);
		return { error: "failed_to_load_files" };
	}
});

// Start server when run directly
const start = async () => {
	try {
		const port = Number(process.env.PORT) || 3000;
		await fastify.listen({ port });
		fastify.log.info(`Server listening on ${port}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
const isDirectExecution = (() => {
	if (typeof process === "undefined") return false;
	const entryPath = process.argv?.[1];
	if (!entryPath) return false;
	return entryPath === fileURLToPath(import.meta.url);
})();

if (isDirectExecution) {
	start();
}

export const fastifyApp = fastify;
export default fastify;
