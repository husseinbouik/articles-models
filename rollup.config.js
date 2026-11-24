import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";

const pkg = require("./package.json");

const extensions = [".js", ".jsx", ".ts", ".tsx"];

export default {
  input: "src/lib/index.ts",

  plugins: [
    resolve({ extensions }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
    babel({
      babelHelpers: "bundled",
      exclude: "node_modules/**",
      extensions,
    }),
  ],

  external: [
    /^react(\/.*)?$/,
    /^react-dom(\/.*)?$/,
    /^@react-three\/fiber(\/.*)?$/,
    /^@emotion\/react(\/.*)?$/,
    /^@emotion\/styled(\/.*)?$/,
    /^@mui\/material(\/.*)?$/,
    /^@mui\/icons-material(\/.*)?$/,
    /^@react-spring\/three(\/.*)?$/,
    /^@react-three\/csg(\/.*)?$/,
    /^@react-three\/drei(\/.*)?$/,
    "three",
  ],

  output: [
    {
      file: pkg.main,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: "esm",
      sourcemap: true,
    },
  ],
};
