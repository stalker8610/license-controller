import fs from "fs";
import path from "path";

const buildDir = "./dist";
function createCjsModulePackageJson() {
    fs.readdir(buildDir, function (err, dirs) {
        if (err) {
            throw err;
        }
        dirs.forEach(function (dir) {
            if (dir === "cjs") {
                const packageJsonFile = path.join(buildDir, dir, "/package.json");
                if (!fs.existsSync(packageJsonFile)) {
                    fs.writeFile(
                        packageJsonFile,
                        new Uint8Array(Buffer.from('{"type": "commonjs"}')),
                        function (err) {
                            if (err) {
                                throw err;
                            }
                        }
                    );
                }
            }
        });
    });
}

createCjsModulePackageJson();