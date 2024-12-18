import { OS, System } from "../src/os";
import * as versions from "../src/swift-versions";

const macOS: System = { os: OS.MacOS, version: "latest", name: "macOS" };
const ubuntu: System = { os: OS.Ubuntu, version: "latest", name: "Ubuntu" };
const windows: System = { os: OS.Windows, version: "latest", name: "Windows" };

describe("swift version resolver", () => {
  it("identifies X.X.X versions", async () => {
    const version = await versions.verify("5.0.1", macOS);
    expect(version).toBe("5.0.1");
  });

  it("identifies X.X.0 versions", async () => {
    const version = await versions.verify("5.0.0", macOS);
    expect(version).toBe("5.0");
  });

  it("identifies X.X versions", async () => {
    const version = await versions.verify("5.0", macOS);
    expect(version).toBe("5.0.1");
  });

  it("identifies ~X.X versions", async () => {
    const version = await versions.verify("~5.0", macOS);
    expect(version).toBe("5.0.1");
  });

  it("identifies X versions", async () => {
    const version = await versions.verify("5", macOS);
    expect(version).toBe("5.10.1");
  });

  it("identifies versions based on system", async () => {
    const macVersion = await versions.verify("5.0", macOS);
    expect(macVersion).toBe("5.0.1");

    const ubuntuVersion = await versions.verify("5.0", ubuntu);
    expect(ubuntuVersion).toBe("5.0.3");
  });

  it("throws an error if version is invalid", async () => {
    expect.assertions(1);
    try {
      await versions.verify("foo", macOS);
    } catch (e) {
      expect(e).toEqual(new Error("Version must be a valid semver format."));
    }
  });
});
