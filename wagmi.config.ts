import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import * as abis from "./src/config/abis";

export default defineConfig({
  out: "src/generated.ts",
  contracts: Object.entries(abis).map(([name, abi]) => ({
    name,
    abi,
  })),
  plugins: [react()],
});
