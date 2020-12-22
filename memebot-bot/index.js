import { generate } from "./generate";

async function main() {
  const result = await generate(100777631, ["Me", "You", "Ahh"]);

  console.log(result);
}

main().catch(console.error);
