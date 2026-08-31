import type { Entity } from "@/seed/types";
import { ChainUploader } from "./ChainUploader";
import { ChainMap } from "./ChainMap";
import { RecommendedChain } from "./RecommendedChain";

export function SupplyChainPage({ entity }: { entity: Entity }) {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Supply chain mapping</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your existing supply chain, visualize it on the map, and discover recommended
          partners to extend it.
        </p>
      </div>
      <ChainUploader entity={entity} />
      <ChainMap entity={entity} />
      <RecommendedChain entity={entity} />
    </div>
  );
}
