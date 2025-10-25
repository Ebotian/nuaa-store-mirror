import Fastify, {
	type FastifyInstance,
	type FastifyServerOptions,
} from "fastify";

import type { LoaderConfig } from "./config.js";
import { createIndexLoader, type IndexLoader } from "./loaders/index-loader.js";
import categoriesRoutes from "./routes/categories.js";
import filesRoutes from "./routes/files.js";
import {
	createCategoryService,
	type CategoryService,
} from "./services/category-service.js";
import {
	createFileService,
	type FileService,
} from "./services/file-service.js";

export interface ServiceRegistry {
	indexLoader: IndexLoader;
	categoryService: CategoryService;
	fileService: FileService;
}

export interface CreateAppOptions {
	fastify?: FastifyServerOptions;
	loader?: Partial<LoaderConfig>;
}

declare module "fastify" {
	interface FastifyInstance {
		services: ServiceRegistry;
	}
}

export function createApp(options: CreateAppOptions = {}): FastifyInstance {
	const app = Fastify({ logger: true, ...options.fastify });
	const loader = createIndexLoader(options.loader ?? {});
	const fileService = createFileService(loader);
	const categoryService = createCategoryService(loader, fileService);

	const services: ServiceRegistry = {
		indexLoader: loader,
		categoryService,
		fileService,
	};

	app.decorate<ServiceRegistry>("services", services);

	app.get("/api/v1/health", async () => ({ ok: true }));

	app.register(categoriesRoutes);
	app.register(filesRoutes);

	return app;
}
