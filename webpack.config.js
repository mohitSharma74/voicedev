const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const PVRECORDER_DESKTOP_BINARIES = [
	"mac/arm64/pv_recorder.node",
	"mac/x86_64/pv_recorder.node",
	"windows/amd64/pv_recorder.node",
	"windows/arm64/pv_recorder.node",
	"linux/x86_64/pv_recorder.node"
];

module.exports = {
	target: "node",
	entry: "./src/extension.ts",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "../[resource-path]"
	},
	devtool: "source-map",
	externals: {
		vscode: "commonjs vscode",
		"@picovoice/pvrecorder-node": "commonjs @picovoice/pvrecorder-node"
	},
	resolve: {
		extensions: [".ts", ".js"],
		alias: {
			"@": path.resolve(__dirname, "src"),
			"@services": path.resolve(__dirname, "src/services"),
			"@utils": path.resolve(__dirname, "src/utils"),
			"@types": path.resolve(__dirname, "src/types"),
			"@config": path.resolve(__dirname, "src/config"),
			"@ui": path.resolve(__dirname, "src/ui"),
			"@commands": path.resolve(__dirname, "src/commands")
		}
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
						options: { configFile: "tsconfig.json" }
					}
				]
			}
		]
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: PVRECORDER_DESKTOP_BINARIES.map((binaryPath) => ({
				from: path.join("node_modules", "@picovoice", "pvrecorder-node", "lib", binaryPath),
				to: path.join("node_modules", "@picovoice", "pvrecorder-node", "lib", binaryPath)
			}))
		})
	]
};
