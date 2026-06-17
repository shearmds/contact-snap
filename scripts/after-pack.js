const { execFileSync } = require("child_process");
const path = require("path");

exports.default = async function afterPack(context) {
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  execFileSync("xattr", ["-cr", appPath]);
};
