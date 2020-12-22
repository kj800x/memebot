import mkdirp from "mkdirp";

import fs from "fs";
import fetch from "node-fetch";
import { pipeline } from "stream";
import { promisify } from "util";
const streamPipeline = promisify(pipeline);
const SPACES = /\s/g;

async function query(q) {
  console.log(`Querying "${q}"`);
  const convertedQ = q.replace(SPACES, "+");
  const req = await fetch(
    `https://imgflip.com/ajax_meme_search_new?q=${convertedQ}&transparent_only=0&include_nsfw=0&allow_gifs=1`
  );
  const json = await req.json();
  return json.results.filter((result) => result.approved === 1);
}

async function downloadEntry(entry) {
  const target = `../data/${entry.url_name}.${entry.file_type}`;
  if (!fs.existsSync(target)) {
    console.log(`Downloading resources for ${entry.url_name}`);
    const url = `https://imgflip.com/s/meme/${entry.url_name}.${entry.file_type}`;
    await streamPipeline((await fetch(url)).body, fs.createWriteStream(target));
  }
}

async function main() {
  await mkdirp("../data");

  const queries = fs
    .readFileSync("./queries.txt", "utf-8")
    .split("\n")
    .filter(Boolean);

  let results = [];

  for (const q of queries) {
    results = [...results, ...(await query(q))];
  }

  fs.writeFileSync("../data/data.json", JSON.stringify(results, null, 2));

  for (const entry of results) {
    await downloadEntry(entry);
  }
}

main().catch(console.error);
