
import AdmZip from "adm-zip";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const pdf = require("pdf-parse") as (
  buffer: Buffer
) => Promise<{ text: string }>;

export async function extractResumeText(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const extension = fileName.split(".").pop()?.toLowerCase();

  let text = "";

  if (extension === "pdf") {
    const result = await pdf(buffer);
    text = result.text;
  } else if (extension === "pptx") {
    const zip = new AdmZip(buffer);

    const slideFiles = zip
      .getEntries()
      .filter((entry) =>
        /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)
      )
      .sort((a, b) => {
        const getNumber = (name: string) =>
          Number(name.match(/slide(\d+)\.xml$/)?.[1] ?? 0);

        return getNumber(a.entryName) - getNumber(b.entryName);
      });

    text = slideFiles
      .map((entry) => {
        const xml = entry.getData().toString("utf8");

        return [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
          .map((match) =>
            match[1]
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
          )
          .join(" ");
      })
      .join("\n");
  } else {
    throw new Error(
      "Unsupported resume format. Only PDF and PPTX are accepted."
    );
  }

  const cleanedText = text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!cleanedText) {
    throw new Error("No readable text was extracted from the resume");
  }

  if (cleanedText.length > 100_000) {
    throw new Error("Resume text exceeds the permitted length");
  }

  return cleanedText;
}
