import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
import { useWalletContext, useTokenRegistryContext } from "../contexts/";
import { buildCloseTokenAccountInstruction, listEmptyTokenAccounts } from "../utils/accounts";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: #030403;
  font-size: 16px;
  margin-top: 25px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const AddressContent = styled.span`
  font-family: Monospace;

  a, a:visited, a:hover {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 32px;

`;

const SectionTitle = styled.span`
  display: block;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const TokenContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-width: 520px;
  margin-bottom: 20px;
`;

const TokenItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const TokenName = styled.span`
  display: block;
  font-weight: bold;
  font-family: Monospace;
  margin-bottom: 4px;
`;

const TokenMint = styled.span`
  display: block;
  font-family: Monospace;

  a, a:visited, a:hover {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

const TokenCloseButton = styled.button`
  background-color: transparent;
  color: #86726c;
  border: 4px solid #86726c;
  border-radius: 12px;
  padding: 4px 8px;
  display: inline-block;
  text-align: center;
  text-decoration: none;
  font-size: 16px;
  font-weight: bold;
  &:hover {
    background-color: rgba(134, 114, 108, 0.9);
    color: #f6f6f2;
  }
`;

const WelcomeContainer = styled.div`
  display: flex;
`;

const ConnectButton = styled.button`
  background-color: transparent;
  color: #606768;
  border: 4px solid #606768;
  border-radius: 12px;
  padding: 15px 32px;
  display: inline-block;
  text-align: center;
  text-decoration: none;
  font-size: 18px;
  font-weight: bold;
  &:hover {
    background-color: rgba(96, 103, 104, 0.8);
    color: #f6f6f2;
  }
`;

function MainPage() {
  const { walletAddress, signTransaction } = useWalletContext();
  const tokenRegistry = useTokenRegistryContext();
  const [emptyAccounts, setEmptyAccounts] = useState<any[]>([]);
  const connection = useMemo(() => new Connection("https://api.mainnet-beta.solana.com", "singleGossip"), []);
  const [triggerUpdate, setTriggerUpdate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      if (walletAddress && tokenRegistry.size > 0) {
        const ownerPublicKey = new PublicKey(walletAddress);
        const emptyAccounts = await listEmptyTokenAccounts(connection, ownerPublicKey, tokenRegistry);
        setEmptyAccounts(emptyAccounts);
        setIsLoading(false);
      }
    })();
    console.log("Refresh:", triggerUpdate);
  }, [connection, walletAddress, tokenRegistry, triggerUpdate]);

  const loadingContent = (
    <Section>
      <SectionTitle>
        Loading...
      </SectionTitle>
    </Section>
  );

  const content = !walletAddress ? <WelcomePage /> : (
    <MainContent>
      <Section>
        <SectionTitle>Connected to</SectionTitle>
        <SectionContent>
          <AddressContent>
            <a href={`https://solscan.io/account/${walletAddress}`} target="_blank" rel="noreferrer">
              {walletAddress}
            </a>
          </AddressContent>
        </SectionContent>
      </Section>
      {isLoading ? loadingContent : (
        <EmptyTokens {...{
          emptyAccounts,
          walletAddress,
          connection,
          signTransaction,
          triggerUpdate,
          setTriggerUpdate,
          isLoading,
          setIsLoading
        }} />
      )}
    </MainContent>
  );

  return (
    <Container>
      {content}
    </Container>
  );
}

interface EmptyTokensProps {
  emptyAccounts: any[];
  walletAddress: string;
  connection: Connection;
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  triggerUpdate: number;
  setTriggerUpdate: (x: number) => void;
  isLoading: boolean;
  setIsLoading: (x: boolean) => void;
}

function EmptyTokens({
  emptyAccounts,
  walletAddress,
  connection,
  signTransaction,
  triggerUpdate,
  setTriggerUpdate,
  isLoading,
  setIsLoading
}: EmptyTokensProps
) {
  async function closeAccount(account: any) {
    const feePayer = new PublicKey(walletAddress);
    const accountAddress = new PublicKey(account.accountAddress);
    const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const tx = new Transaction({ recentBlockhash, feePayer });
    tx.add(buildCloseTokenAccountInstruction(feePayer, accountAddress));

    try {
      const signedTx = await signTransaction(tx);
      setIsLoading(true);

      const txId = await connection.sendRawTransaction(signedTx.serialize());
      console.log(txId);

      await new Promise((resolve) => setTimeout(resolve, 4000)); // sleep for 4 seconds
      setTriggerUpdate(triggerUpdate+1);
    } catch(e) {
      console.error(e);
      setIsLoading(false);
    }
  }

  const content = emptyAccounts.length === 0 ? <SectionTitle>No empty accounts</SectionTitle> : (
    <>
      <SectionTitle>Zero balance token accounts</SectionTitle>
      <SectionContent>
        {emptyAccounts.map((account) => (
          <TokenContainer key={account.mintAddress}>
            <TokenItem>
              <TokenName>{account.name ?? "unknown"}</TokenName>
              <TokenMint>
                <a href={`https://solscan.io/token/${account.mintAddress}`} target="_blank" rel="noreferrer">
                  {account.mintAddress}
                </a>
              </TokenMint>
            </TokenItem>
            <TokenCloseButton onClick={() => closeAccount(account)} disabled={isLoading}>
              Close
            </TokenCloseButton>
          </TokenContainer>
        ))}
      </SectionContent>
    </>
  );

  return (
    <Section>
      {content}
    </Section>
  );
}

function WelcomePage() {
  const { connectWallet }= useWalletContext();

  return (
    <WelcomeContainer>
      <ConnectButton onClick={connectWallet}>Connect to Phantom</ConnectButton>
    </WelcomeContainer>
  )
}

export default MainPage;