const core = require('@actions/core');
const cache = require('@actions/cache');
const { exec, execSync } = require("child_process");

async function main() {
  try {
    key = 'ajv-cli'
    installDir = `${process.env.RUNNER_TEMP}/${key}}`
    if (typeof await cache.restoreCache([installDir], key) === 'undefined') {
      console.log("Cache miss");
      console.log(execSync(`npm install --prefix ${installDir} ajv-cli`).toString());
      await cache.saveCache([installDir], key);
    } else {
      console.log("Cache hit");
    }
    binDir = execSync(`npm bin --prefix ${installDir}`).toString().trim();
    core.addPath(binDir);
    execSync(`PATH=${binDir}:$PATH ajv help`);
    console.log("Installation successful");
  } catch (err) {
    core.setFailed(err);
  }
}

main();

