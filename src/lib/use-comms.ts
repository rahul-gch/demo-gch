import { useEffect, useState } from "react";
import { subscribeComms } from "@/seed/comms";

// Tiny hook to force re-render when the comms store changes.
export function useCommsVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const unsub = subscribeComms(() => setV((x) => x + 1));
    return () => {
      unsub();
    };
  }, []);
  return v;
}
