import { useState, useEffect } from "react";

const useWalletHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
};

export default useWalletHydration;
