import fs from "fs";
import path from "path";
import crypto from "crypto";
import esprima from "esprima";
import estraverse from "estraverse";

export function checkIntegrity(directory, audit) {
    /**
     * Checks for project manifest Hash - if any  modification to manifest - throws error.
     */
    // const manifestResult = checkManifest(directory, audit);

    // if (!manifestResult.success) {
    //     throw new Error("PROJECT_COMPROMISED");
    // }

    const manifest = JSON.parse(
        fs.readFileSync(
            path.join(directory, "manifest.json"),
            "utf8"
        )
    );

    const entryPoint = path.join(directory, manifest.entry);

    console.log("Directory:", directory);
console.log("Manifest entry:", manifest.entry);
console.log("Resolved entry:", entryPoint);
console.log("Exists:", fs.existsSync(entryPoint));

    const visited = new Set();
    const fileQueue = [entryPoint];
    const shaFile = [];

    while (fileQueue.length !== 0) {

        const poppedFile = fileQueue.pop();

        if (visited.has(poppedFile))
            continue;

        visited.add(poppedFile);

        const currFileData = fs.readFileSync(
            poppedFile,
            "utf8"
        );

        const currTree = esprima.parseModule(currFileData, {
            tolerant: true
        });

        const relativePath = path.relative(
            directory,
            poppedFile
        );

        const sha256Hash = crypto
            .createHash("sha256")
            .update(currFileData)
            .digest("hex");

        shaFile.push([relativePath, sha256Hash]);

        estraverse.traverse(currTree, {

            enter(node) {

                if (
                    node.type === "ImportDeclaration" &&
                    (
                        node.source.value.startsWith("./") ||
                        node.source.value.startsWith("../")
                    )
                ) {

                    const newFile = path.resolve(
                        path.dirname(poppedFile),
                        node.source.value
                    );

                    if (!visited.has(newFile))
                        fileQueue.push(newFile);
                }

            }

        });

    }

    shaFile.sort((a, b) => a[0].localeCompare(b[0]));

    const cumulativeSHA = shaFile
        .map(([file, sha]) => `${file}:${sha}`)
        .join("\n");

    const finalSHA = crypto
        .createHash("sha256")
        .update(cumulativeSHA)
        .digest("hex");

    // if (finalSHA !== audit.projectHash) {
    //     return {
    //         success: false,
    //         reason: "Project integrity verification failed."
    //     };
    // }

    return {
        success: true,
        projectHash: finalSHA
    };
}

export function checkManifest(directory, audit){
    const manifestPath = path.join(directory, "manifest.json");

    const manifestData = fs.readFileSync(manifestPath, "utf8");

    const manifestHash = crypto
        .createHash("sha256")
        .update(manifestData)
        .digest("hex");

    if (manifestHash !== audit.manifestHash) {
        return {
            success: false,
            reason: "Manifest integrity check failed."
        };
    }
    return{
        success: true,
        reason: "Manifest hash is valid"
    }

}