# Architecture

This repository currently has two active components:

* `packages/mcp-verifier-cli` — developer CLI.
* `packages/mcp-secure-loader` — registry backend.

> The `apps/registry-backend` folder exists in the tree, but it is currently empty. The live backend implementation is under `packages/mcp-secure-loader`.

## High-level architecture

Developer CLI → Registry Backend → MongoDB

The CLI handles developer authentication, key management, manifest validation, source hashing, signing, and publish/download operations.
The backend handles JWT-protected API requests, stores developer public keys, stores publish audits, and provides package metadata to download clients.

## Active backend endpoints

* `GET /test` — health check.
* `GET /oauth/github` — GitHub OAuth code exchange.
* `GET /oauth/success` — OAuth success acknowledgment.
* `POST /getkey` — retrieve a developer public key.
* `POST /update/pubkey` — store or update a developer public key (JWT required).
* `POST /download/project` — return package metadata for downloads.
* `POST /publish` — persist publish audit documents (JWT required).
* `GET /resolve/:namespace/:serverName` — placeholder route, not implemented.

## Backend data model

### Developer document
Located in `packages/mcp-secure-loader/Schema/namespaces.schema.js`.

* `ownerId` — GitHub user ID.
* `githubUsername` — GitHub login.
* `email` — user email.
* `publicKey` — stored developer public key metadata.
* `status` — developer account status.

### Publish audit document
Located in `packages/mcp-secure-loader/Schema/publishAudit.schema.js`.

* `packageName`, `version`, `description`, `entry`.
* `repository.url`, `repository.branch`.
* `commitId`.
* `permissions` object.
* `manifest`, `manifestHash`, `signature`.
* `security` object from LLM review.
* `publishStatus`.

## Current execution flow

### Login

1. CLI executes `node ./cli.js login`.
2. CLI opens the configured GitHub OAuth URL.
3. User authorizes in a browser.
4. Backend `/oauth/github` exchanges the code for an access token.
5. Backend retrieves GitHub profile and saves a developer record.
6. Backend creates a JWT and redirects to the CLI loopback server on `http://127.0.0.1:4242/getToken`.
7. CLI stores the JWT locally and uploads the local public key.

### Publish

1. CLI reads `manifest.json` from the current working directory.
2. CLI validates the manifest schema.
3. CLI resolves the declared entrypoint file.
4. CLI performs AST traversal from the entrypoint and recursively follows relative imports.
5. CLI computes SHA-256 hashes for each discovered file.
6. CLI computes a cumulative project hash.
7. CLI signs the project hash with the local Ed25519 private key.
8. CLI obtains an LLM security review.
9. CLI sends publish metadata to `POST /publish`.
10. Backend stores the publish audit in MongoDB.

### Download

1. CLI calls `POST /download/project` with package name, GitHub username, and version.
2. Backend returns stored metadata, including the repository URL, branch, commit ID, and signature.
3. CLI clones the repository and checks out the exact commit.
4. CLI recomputes the project hash from source files.
5. CLI requests the developer public key from `POST /getkey`.
6. CLI verifies the signature against the recomputed project hash.

## Important current limitations

* The backend accepts `POST /publish` payloads but does not verify signatures before storage.
* The project currently stores audit metadata, not package artifacts or runtime manifest resolution logic.
* The CLI only supports relative local imports, not alias-based or dynamic module resolution.
* Key rotation and public key revocation are unfinished.
