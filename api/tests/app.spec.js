import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { createApp } from "../src/app.js";
const createFixtureManifest = () => {
    const generatedAt = new Date("2025-01-01T00:00:00.000Z").toISOString();
    return {
        generatedAt,
        files: [
            {
                id: "课程Course/数学分析/讲义.pdf",
                name: "讲义.pdf",
                path: "课程Course/数学分析/讲义.pdf",
                categoryId: "课程Course/数学分析",
                ext: ".pdf",
                mime: "application/pdf",
                size: 1024,
                modifiedAt: generatedAt,
            },
            {
                id: "课程Course/数学分析/习题集.md",
                name: "习题集.md",
                path: "课程Course/数学分析/习题集.md",
                categoryId: "课程Course/数学分析",
                ext: ".md",
                mime: "text/markdown",
                size: 2048,
                modifiedAt: generatedAt,
                title: "数学分析习题",
            },
            {
                id: "通识General/校园地图/index.html",
                name: "index.html",
                path: "通识General/校园地图/index.html",
                categoryId: "通识General/校园地图",
                ext: ".html",
                mime: "text/html",
                size: 512,
                modifiedAt: generatedAt,
            },
        ],
        categories: [
            {
                id: "课程Course",
                name: "课程Course",
                path: "课程Course",
                parentId: null,
                depth: 0,
                childrenCount: 1,
                fileCount: 0,
            },
            {
                id: "课程Course/数学分析",
                name: "数学分析",
                path: "课程Course/数学分析",
                parentId: "课程Course",
                depth: 1,
                childrenCount: 0,
                fileCount: 2,
            },
            {
                id: "通识General/校园地图",
                name: "校园地图",
                path: "通识General/校园地图",
                parentId: "通识General",
                depth: 1,
                childrenCount: 0,
                fileCount: 1,
            },
        ],
        stats: {
            totalFiles: 3,
            totalCategories: 3,
        },
    };
};
const createCategoriesSnapshot = (manifest) => manifest.categories.map((category) => ({ ...category }));
describe("Fastify API", () => {
    let app;
    const context = { tempDir: "" };
    beforeEach(async () => {
        context.tempDir = await mkdtemp(path.join(tmpdir(), "nuaa-index-"));
        const manifest = createFixtureManifest();
        await Promise.all([
            writeFile(path.join(context.tempDir, "index.json"), JSON.stringify(manifest, null, 2), "utf-8"),
            writeFile(path.join(context.tempDir, "categories.json"), JSON.stringify(createCategoriesSnapshot(manifest), null, 2), "utf-8"),
        ]);
        app = createApp({
            loader: {
                indexDirectories: [context.tempDir],
                cacheMaxAgeMs: 0,
            },
            fastify: { logger: false },
        });
        await app.ready();
    });
    afterEach(async () => {
        await app.close();
        await rm(context.tempDir, { recursive: true, force: true });
    });
    it("returns health status", async () => {
        const response = await app.inject({ url: "/api/v1/health" });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ ok: true });
    });
    it("lists categories", async () => {
        const response = await app.inject({ url: "/api/v1/categories" });
        expect(response.statusCode).toBe(200);
        const payload = response.json();
        expect(payload.data).toHaveLength(3);
        expect(payload.meta.total).toBe(3);
    });
    it("returns files for a category", async () => {
        const categoryId = encodeURIComponent("课程Course/数学分析");
        const response = await app.inject({ url: `/api/v1/categories/${categoryId}/files` });
        expect(response.statusCode).toBe(200);
        const payload = response.json();
        expect(payload.data).toHaveLength(2);
        expect(payload.meta.category.id).toBe("课程Course/数学分析");
    });
    it("returns 404 for missing category", async () => {
        const response = await app.inject({ url: "/api/v1/categories/nonexistent/files" });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual({ error: "category_not_found" });
    });
    it("returns file details with related files", async () => {
        const fileId = encodeURIComponent("课程Course/数学分析/讲义.pdf");
        const response = await app.inject({ url: `/api/v1/files/${fileId}` });
        expect(response.statusCode).toBe(200);
        const payload = response.json();
        expect(payload.data.id).toBe("课程Course/数学分析/讲义.pdf");
        expect(payload.meta.related).toHaveLength(1);
        expect(payload.meta.related[0].id).toBe("课程Course/数学分析/习题集.md");
    });
    it("returns 404 for missing file", async () => {
        const response = await app.inject({ url: "/api/v1/files/unknown" });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual({ error: "file_not_found" });
    });
});
//# sourceMappingURL=app.spec.js.map