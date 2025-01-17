import * as os from "os";
import * as fs from "fs";
import * as core from "@actions/core";
import * as toolCache from "@actions/tool-cache";
import * as path from "path";
import { ExecOptions, exec } from "@actions/exec";
import { System } from "./os";
import { swiftPackage, Package } from "./swift-versions";
import { setupVsTools } from "./visual-studio";

export async function install(version: string, system: System) {
  if (os.platform() !== "win32") {
    core.error("Trying to run windows installer on non-windows os");
    return;
  }

  const swiftPkg = swiftPackage(version, system);
  let swiftPath = toolCache.find(`swift-${system.name}`, version);

  if (swiftPath === null || swiftPath.trim().length == 0) {
    core.debug(`No cached installer found`);

    let exe = await download(swiftPkg);

    const exePath = await toolCache.cacheFile(
      exe,
      swiftPkg.name,
      `swift-${system.name}`,
      version
    );

    swiftPath = path.join(exePath, swiftPkg.name);
  } else {
    core.debug("Cached installer found");
  }

  core.debug("Running installer");

  const options: ExecOptions = {};
  options.listeners = {
    stdout: (data: Buffer) => {
      core.info(data.toString());
    },
    stderr: (data: Buffer) => {
      core.error(data.toString());
    },
  };
  let code = await exec(`"${swiftPath}" -q`, []);
  const localAppData = process.env.LOCALAPPDATA!;
  const swiftLibPath = path.join(localAppData, "Programs", "Swift");
  const swiftInstallPath = path.join(swiftLibPath, "Toolchains", `${version}+Asserts`, "usr", "bin");

  if (code != 0 || !fs.existsSync(swiftInstallPath)) {
    throw new Error(`Swift installer failed with exit code: ${code}`);
  }

  core.addPath(swiftInstallPath);

  const swiftRuntime = path.join(swiftLibPath, "Platforms", `${version}`, "Windows.platform", "Developer", "SDKs", "Windows.sdk");
  core.exportVariable("SDKROOT", swiftRuntime);
  process.env.SDKROOT = swiftRuntime;

  const additionalPaths = [
    path.join(swiftLibPath, "Tools", version),
    path.join(swiftLibPath, "Runtimes", `${version}`, "usr", "bin"),
  ];
  additionalPaths.forEach((value, index, array) => core.addPath(value));

  core.debug(`Swift installed at "${swiftInstallPath}"`);
  await setupVsTools(swiftPkg);
}

async function download({ url }: Package) {
  core.debug("Downloading swift for windows");
  return toolCache.downloadTool(url);
}
