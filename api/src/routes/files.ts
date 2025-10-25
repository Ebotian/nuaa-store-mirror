import type { FastifyPluginAsync } from "fastify";

const filesRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get<{
		Params: { id: string };
	}>("/api/v1/files/:id", async (request, reply) => {
		const { id } = request.params;
		const file = await fastify.services.fileService.findById(id);
		if (!file) {
			reply.code(404);
			return { error: "file_not_found" };
		}
		const siblings = await fastify.services.fileService.listFilesByCategory(
			file.categoryId
		);
		const related = siblings.filter((item) => item.id !== file.id).slice(0, 10);
		return {
			data: file,
			meta: {
				related,
				relatedCount: related.length,
			},
		};
	});
};

export default filesRoutes;
