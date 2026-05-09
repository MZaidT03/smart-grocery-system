import { useEffect, useState } from "react";
import { useTheme } from "@/context/theme";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { scheme } = useTheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return scheme;
  }

  return "light";
}
