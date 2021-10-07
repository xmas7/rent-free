import { TokenInfo, TokenInfoMap, TokenListContainer, TokenListProvider } from "@solana/spl-token-registry";
import { createContext, useContext, useEffect, useState } from "react";

export const TokenRegistryContext = createContext<TokenInfoMap>(new Map());

export function useTokenRegistryContext() {
  const context = useContext(TokenRegistryContext);
  if (!context) {
    throw new Error("TokenRegistryContext not set");
  }

  return context;
}

export function TokenRegistryContextProvider(props: any) {
  const [tokenRegistry, setTokenRegistry] = useState<TokenInfoMap>(new Map());

  useEffect(() => {
    new TokenListProvider().resolve().then((tokens: TokenListContainer) => {
      const tokenMap: TokenInfoMap = new Map();
      tokens.getList().forEach((item: TokenInfo) => {
        tokenMap.set(item.address, item);
      });
      setTokenRegistry(tokenMap);
    });
  }, []);

  return (
    <TokenRegistryContext.Provider value={tokenRegistry}>
      {props.children}
    </TokenRegistryContext.Provider>
  );
}