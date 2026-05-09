import { useCallback, useState } from "react";

import { fetchConfig } from "../api.js";
import type { ConfigView } from "../types.js";

export function useConfigResourceStore(options: { onFailure: (error: unknown) => void }) {
  const [configView, setConfigView] = useState<ConfigView | null>(null);
  const onFailure = options.onFailure;

  const refreshConfigView = useCallback(async () => {
    try {
      setConfigView(await fetchConfig());
    } catch (error) {
      onFailure(error);
    }
  }, [onFailure]);

  return {
    configView,
    setConfigView,
    refreshConfigView,
  };
}
