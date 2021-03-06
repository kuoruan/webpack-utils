import typescript from "rollup-plugin-typescript2";

import pkg from "./package.json";

export default {
  input: "./src/index.ts",
  output: [
    {
      file: pkg.main,
      exports: "auto",
      format: "cjs",
    },
    {
      file: pkg.module,
      format: "es",
    },
  ],
  external: [
    "fs",
    "path",
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [typescript()],
};
