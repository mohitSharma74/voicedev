const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * PvRecorder native binaries that need to be copied to dist
 */
const PVRECORDER_BINARIES = [
	"mac/arm64/pv_recorder.node",
	"mac/x86_64/pv_recorder.node",
	"windows/amd64/pv_recorder.node",
	"windows/arm64/pv_recorder.node",
	"linux/x86_64/pv_recorder.node",
];

/**
 * esbuild plugin to copy PvRecorder native binaries
 * @type {import('esbuild').Plugin}
 */
const copyPvRecorderBinariesPlugin = {
	name: "copy-pvrecorder-binaries",
	setup(build) {
		build.onEnd(() => {
			const sourceBase = path.join("node_modules", "@picovoice", "pvrecorder-node", "lib");
			const targetBase = path.join("dist", "node_modules", "@picovoice", "pvrecorder-node", "lib");

			PVRECORDER_BINARIES.forEach((binaryPath) => {
				const sourcePath = path.join(sourceBase, binaryPath);
				const targetPath = path.join(targetBase, binaryPath);

				// Create target directory if it doesn't exist
				const targetDir = path.dirname(targetPath);
				if (!fs.existsSync(targetDir)) {
					fs.mkdirSync(targetDir, { recursive: true });
				}

				// Copy binary file if it exists
				if (fs.existsSync(sourcePath)) {
					fs.copyFileSync(sourcePath, targetPath);
					console.log(`[copy] ${binaryPath}`);
				}
			});
		});
	},
};

/**
 * esbuild plugin for problem matcher integration
 * Emits build start/end messages that VS Code can detect
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: "esbuild-problem-matcher",
	setup(build) {
		build.onStart(() => {
			console.log("[watch] build started");
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				if (location == null) return;
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log("[watch] build finished");
		});
	},
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: ["src/extension.ts"],
		bundle: true,
		format: "cjs",
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: "node",
		outfile: "dist/extension.js",
		external: ["vscode", "@picovoice/pvrecorder-node"],
		logLevel: "warning",
		plugins: [copyPvRecorderBinariesPlugin, esbuildProblemMatcherPlugin],
	});

	if (watch) {
		await ctx.watch();
		console.log("[esbuild] watching for changes...");
	} else {
		await ctx.rebuild();
		await ctx.dispose();
		console.log("[esbuild] build complete");
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
