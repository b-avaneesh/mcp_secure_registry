
/**
 * External dependencies
 */
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import * as z from "zod";
import dotenv from 'dotenv';
dotenv.config();

/**
 * Internal dependencies
 */
import { prompt, prompt2,prompt3 } from "./cli.config.js";
const {GEMINI_API_KEY} = process.env;

const client = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
});

/**
 * Response Schema
 */
const securityReviewJsonSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "A concise summary of the package behaviour."
    },

    riskScore: {
      type: "integer",
      description: "Overall security risk score from 0 to 100."
    },

    riskLevel: {
      type: "string",
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    },

    verdict: {
      type: "string",
      enum: ["SAFE", "SUSPICIOUS", "MALICIOUS"]
    },

    permissionsMatch: {
      type: "boolean",
      description: "True if the declared manifest permissions accurately reflect the observed code behaviour."
    },

    missingPermissions: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "network",
          "filesystem",
          "process",
          "env"
        ]
      },
      description: "Permissions required by the code but missing from the manifest."
    },

    unnecessaryPermissions: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "network",
          "filesystem",
          "process",
          "env"
        ]
      },
      description: "Permissions declared in the manifest but not actually used."
    },

    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
          },

          category: {
            type: "string"
          },

          title: {
            type: "string"
          },

          description: {
            type: "string"
          },

          file: {
            type: "string"
          },

          line: {
            type: "integer"
          },

          recommendation: {
            type: "string"
          }
        },
        required: [
          "severity",
          "category",
          "title",
          "description",
          "file",
          "line",
          "recommendation"
        ]
      }
    }
  },

  required: [
    "summary",
    "riskScore",
    "riskLevel",
    "verdict",
    "permissionsMatch",
    "missingPermissions",
    "unnecessaryPermissions",
    "findings"
  ]
};

const securityReviewSchema = z.fromJSONSchema(securityReviewJsonSchema);

/**
 * Unlike inline data docs provided by gemini - we're directly encoding .json into base64
 * @param {*} astOutput 
 * @returns output
 */
async function send_to_llm(astOutput) {

    const json = JSON.stringify(astOutput);
    console.log("Printing the est. token count");
    const est = await client.models.countTokens({ model : "gemini-3.5-flash", contents: json })
    console.log(est);
    const interaction = await client.interactions.create({
        model: "gemini-2.5-flash",
        input: [
        { type: "text", text: prompt3 },
        { type: "text", text: json }
    ],
          response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: securityReviewJsonSchema
        }
    });

    return interaction.output_text;

}



export {send_to_llm};