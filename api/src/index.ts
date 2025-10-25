import { createApp } from "./app.js";
import { fileURLToPath } from "url";

const app = createApp();

const start = async () => {
	try {
		const port = Number(process.env.PORT) || 3000;
		await app.listen({ port });
		app.log.info(`Server listening on ${port}`);
	} catch (err) {
		app.log.error(err);
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
	void start();
}

export const fastifyApp = app;
export default app;
