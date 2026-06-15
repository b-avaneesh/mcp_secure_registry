
import { z } from "zod";

const manifestSchema = z.object({
    name: z
        .string()
        .min(1, "Name is missing in manifest.json"),

    version: z
        .string()
        .regex(
            /^\d+\.\d+\.\d+$/,
            "Version must follow semantic versioning (e.g. 1.0.0)"
        ),

    description: z
        .string()
        .optional(),

    entry: z
        .string()
        .min(1, "Entry point is missing in manifest.json"),

    author: z
        .string()
        .optional(),

    repository: z
        .string()
        .url("Repository must be a valid URL")
        .optional(),

    permissions: z
        .array(
            z.enum([
                "network",
                "filesystem",
                "process",
                "env"
            ])
        )
        .default([]),
});

export{manifestSchema};