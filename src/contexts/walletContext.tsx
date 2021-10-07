import { Transaction } from "@solana/web3.js";
import { createContext, useContext, useState } from "react";

export type WalletContextValue = {
  walletAddress: string | null;
  connectWallet: () => void;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("WalletContext not set");
  }

  return context;
}

export function WalletContextProvider(props: any) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  async function connectWallet() {
    if (!((window as any).solana?.isPhantom)) {
      return;
    }

    (window as any).solana.connect();
    (window as any).solana.on("connect", () => {
      setWalletAddress((window as any).solana.publicKey.toString());
    });
  }

  async function signTransaction(transaction: Transaction) {
    return await (window as any).solana.signTransaction(transaction);
  }

  const state = {
    walletAddress,
    connectWallet,
    signTransaction
  };

  return (
    <WalletContext.Provider value={state}>
      {props.children}
    </WalletContext.Provider>
  )
}
