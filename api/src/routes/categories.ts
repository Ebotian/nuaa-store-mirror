import type { FastifyPluginAsync } from "fastify";

const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get("/api/v1/categories", async () => {
		const categories = await fastify.services.categoryService.listCategories();
		return { data: categories, meta: { total: categories.length } };
	});

	fastify.get<{
		Params: { id: string };
	}>("/api/v1/categories/:id/files", async (request, reply) => {
		const { id } = request.params;
		const result = await fastify.services.categoryService.listFilesByCategory(
			id
		);
		if (!result) {
			reply.code(404);
			return { error: "category_not_found" };
		}
		const { category, files } = result;
		return {
			data: files,
			meta: { category, total: files.length },
		};
	});
};

export default categoriesRoutes;
