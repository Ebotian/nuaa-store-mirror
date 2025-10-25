#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "web", "public", "mock-data");
const OUT_FILE = path.join(OUT_DIR, "files.json");

const IGNORES = new Set([
	"node_modules",
	".git",
	"web/node_modules",
	"web/dist",
	"web/build",
	"web/.git",
	"scripts",
]);
const MAX_EXCERPT = 200;

function isBinaryFilename(filename) {
	const binExt = [
		".png",
		".jpg",
		".jpeg",
		".gif",
		".ico",
		".pdf",
		".docx",
		".xlsx",
		".zip",
		".7z",
		".tar",
		".gz",
	];
	return binExt.includes(path.extname(filename).toLowerCase());
}

function walk(dir, cb) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const ent of entries) {
		const name = ent.name;
		const full = path.join(dir, name);
		const rel = path.relative(ROOT, full);
		if (IGNORES.has(name) || IGNORES.has(rel)) continue;
		if (ent.isDirectory()) {
			walk(full, cb);
		} else if (ent.isFile()) cb(full, rel);
	}
}

let items = [];

const CURATED_INDEX = path.join(ROOT, "tools", "web", "public", "index.json");

if (fs.existsSync(CURATED_INDEX)) {
	try {
		const raw = fs.readFileSync(CURATED_INDEX, "utf8");
		const parsed = JSON.parse(raw);
		if (parsed && Array.isArray(parsed.files)) {
			items = parsed.files.map((f) => {
				const id = f.id;
				const title = f.title || f.name || id;
				const excerpt =
					(f.digest && String(f.digest).slice(0, MAX_EXCERPT)) || undefined;
				const p = f.path
					? "/" + f.path.replace(/\\\\/g, "/")
					: "/" + id.replace(/\\\\/g, "/");
				const category =
					f.categoryId || (f.path ? f.path.split("/")[0] : "root");
				return { id, title, excerpt, path: p, category };
			});
		}
	} catch (err) {
		console.warn(
			"Failed to parse curated index, falling back to repo crawl:",
			err && err.message
		);
	}
}

if (items.length === 0) {
	walk(ROOT, (full, rel) => {
		// Skip the output file itself if encountered
		if (full === OUT_FILE) return;
		// Skip files under web/public/mock-data to avoid recursion
		if (rel.startsWith(path.join("web", "public", "mock-data"))) return;

		const parts = rel.split(path.sep);
		const category = parts.length > 1 ? parts[0] : "root";
		const id = rel.replace(/\\/g, "/");
		const title = path.basename(full);
		let excerpt;
		try {
			if (!isBinaryFilename(full)) {
				const text = fs.readFileSync(full, "utf8");
				excerpt = text.trim().slice(0, MAX_EXCERPT);
				// normalize whitespace
				excerpt = excerpt.replace(/\s+/g, " ");
			}
		} catch (err) {
			// ignore read errors
		}
		items.push({ id, title, excerpt, path: "/" + id, category });
	});
}

try {
	fs.mkdirSync(OUT_DIR, { recursive: true });
	fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2), "utf8");
	console.log("Wrote", OUT_FILE, "with", items.length, "items");

	// Build categories.json (hierarchical metadata)
	const categoriesMap = new Map();
	// Count files per exact category id
	for (const it of items) {
		const cat = it.category || "root";
		categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + 1);
	}

	// Ensure parent categories exist and compute aggregated counts later
	const nodes = new Map();
	for (const [catId, count] of categoriesMap.entries()) {
		const parts = catId.split("/");
		const name = parts[parts.length - 1] || catId;
		const parentId = parts.length > 1 ? parts.slice(0, -1).join("/") : null;
		nodes.set(catId, {
			id: catId,
			name,
			path: catId,
			parentId,
			fileCount: count,
		});
		// ensure ancestor nodes exist
		let acc = "";
		for (let i = 0; i < parts.length - 1; i++) {
			acc = acc ? acc + "/" + parts[i + (acc ? 1 : 0)] : parts[0];
			if (!nodes.has(acc)) {
				const pparts = acc.split("/");
				nodes.set(acc, {
					id: acc,
					name: pparts[pparts.length - 1],
					path: acc,
					parentId: pparts.length > 1 ? pparts.slice(0, -1).join("/") : null,
					fileCount: 0,
				});
			}
		}
	}

	// Aggregate counts upward (child -> parent)
	// Sort keys by depth desc so children are processed before parents
	const sorted = Array.from(nodes.keys()).sort(
		(a, b) => b.split("/").length - a.split("/").length
	);
	for (const key of sorted) {
		const node = nodes.get(key);
		if (!node) continue;
		if (node.parentId) {
			const parent = nodes.get(node.parentId);
			if (parent)
				parent.fileCount = (parent.fileCount || 0) + (node.fileCount || 0);
			else
				nodes.set(node.parentId, {
					id: node.parentId,
					name: node.parentId.split("/").slice(-1)[0],
					path: node.parentId,
					parentId: node.parentId.includes("/")
						? node.parentId.split("/").slice(0, -1).join("/")
						: null,
					fileCount: node.fileCount || 0,
				});
		}
	}

	const categories = Array.from(nodes.values()).map((n) => ({
		id: n.id,
		name: n.name,
		path: n.path,
		parentId: n.parentId,
		fileCount: n.fileCount || 0,
	}));
	const CAT_OUT = path.join(OUT_DIR, "categories.json");
	fs.writeFileSync(CAT_OUT, JSON.stringify(categories, null, 2), "utf8");
	console.log("Wrote", CAT_OUT, "with", categories.length, "categories");
} catch (err) {
	console.error("Failed to write output", err);
	process.exitCode = 1;
}
