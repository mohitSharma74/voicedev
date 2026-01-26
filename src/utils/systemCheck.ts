export type Platform = "macos" | "windows" | "linux" | "unknown";

export function getPlatform(): Platform {
	const platform = process.platform;
	if (platform === "darwin") {
		return "macos";
	}
	if (platform === "win32") {
		return "windows";
	}
	if (platform === "linux") {
		return "linux";
	}

	return "unknown";
}
