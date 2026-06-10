┌───────────────┐

│ Developer CLI │

└───────┬───────┘

&#x20;       │

&#x20;       ▼

┌───────────────┐

│ Registry API  │

└───────┬───────┘

&#x20;       │

&#x20;       ▼

┌───────────────┐

│   MongoDB     │

└───────────────┘





Consumer

&#x20;   │

&#x20;   ▼

Verification Layer

&#x20;   │

&#x20;   ▼

Registry API







Component 1: Registry Backend



Example:



POST /register-namespace



POST /publish-manifest



GET /manifest/:namespace



This is where:  (CORE OF THE PROJECT)



OAuth happens

Namespace ownership happens

Signature verification happens



Component 2: MongoDB (or) Postgres



This stores data.



Example:



users

{

&#x20; githubId,

&#x20; username

}

namespaces

{

&#x20; namespace,

&#x20; publicKey,

&#x20; ownerId

}

manifests

{

&#x20; namespace,

&#x20; version,

&#x20; signature,

&#x20; manifest --> file itself.

}



MongoDB doesn't know anything about CLI.



It just stores data.



Component 3: Developer CLI



Developer runs:



mcp-verifier publish



CLI:



1\. Reads manifest



2\. Signs manifest



3\. Calls Registry API





