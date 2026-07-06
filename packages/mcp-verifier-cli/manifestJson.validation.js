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

    repository: z
        .object({
            type: z.enum(["git"], {
                error: "Repository type must be 'git'.",
            }),

            url: z
                .string()
                .url("Repository URL must be a valid URL"),
        })
        .optional(),

    author: z
        .object({
            name: z
                .string()
                .min(1, "Author name cannot be empty"),

            email: z
                .string()
                .email("Author email must be valid"),
        })
        .optional(),

    license: z
        .string()
        .min(1, "License cannot be empty")
        .optional(),

    permissions: z
        .array(
            z.enum([
                "network",
                "filesystem",
                "process",
                "env",
            ])
        )
        .default([]),
});

export { manifestSchema };