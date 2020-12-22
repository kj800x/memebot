import memes from "../data/data";
import execa from "execa";

const getBaseSettings = (meme) => {
  if (meme.default_settings) {
    return JSON.parse(meme.default_settings);
  }

  return [
    {
      type: "text",
      x: meme.w / 2,
      y: 0,
      w: meme.w,
      h: meme.h,
      rotation: 0,
      gravity: "top",
      font: "impact",
      font_color: "#ffffff",
      outline_color: "#000000",
      force_caps: false,
      text_align: "center",
      vertical_align: "top",
    },
    {
      type: "text",
      x: meme.w / 2,
      y: meme.h,
      w: meme.w,
      h: meme.h,
      rotation: 0,
      gravity: "bottom",
      font: "impact",
      font_color: "#ffffff",
      outline_color: "#000000",
      force_caps: false,
      text_align: "center",
      vertical_align: "bottom",
    },
  ];
};

const makeArgs = (node) => [
  "-background",
  "transparent",
  "-fill",
  node.font_color,
  "-font",
  node.font,
  "-strokewidth",
  "2",
  "-stroke",
  node.outline_color,
  "-pointsize",
  "100",
  "-gravity",
  "center",
  `label:${node.text.replace(/'/g, "\\'")}`,
];

const runConvert = async (args) => {
  const outputFile = Math.floor(Math.random() * 10000);
  await execa("convert", [...args, `../${outputFile}.png`]);
  return `../${outputFile}.png`;
};

const calcXY = (x, y, gravity) => {
  switch (gravity) {
    case "center":
      return [-x / 2, -y / 2];
    case "top":
      return [-x / 2, 0];
    case "bottom":
      return [-x / 2, -y];
    default:
      [0, 0];
  }
};

const calcGeometry = async (cover, node) => {
  const gravity = node.gravity || "center";

  const measure = await execa("identify", [cover]);

  const dims = measure.stdout.split(" ")[2];

  const [dimX, dimY] = dims.split("x").map((n) => parseInt(n, 10));

  const [x, y] = calcXY(dimX, dimY, gravity);

  return `+${node.x + x}+${node.y + y}`;
};

const makeOverlayArgs = async (node, base, cover) => [
  base,
  cover,
  "+repage",
  "-geometry",
  await calcGeometry(cover, node),
  "-composite",
];

export const generate = async (id, args) => {
  const meme = memes.find((m) => m.id === id);

  if (!meme) {
    throw new Error("Unknown meme");
  }

  const settings = getBaseSettings(meme);

  const finalizedSettings = settings.map((node, i) => ({
    ...node,
    text: args[i],
  }));

  let base = `../data/${meme.url_name}.${meme.file_type}`;

  for (const node of finalizedSettings) {
    const textFile = await runConvert(makeArgs(node));
    console.log(node);
    console.log(makeOverlayArgs(node, base, textFile));
    base = await runConvert(await makeOverlayArgs(node, base, textFile));
  }

  return base;
};
