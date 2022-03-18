import { PublicKey, Transaction } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useTokenRegistryContext } from "../contexts/";
import { buildCloseTokenAccountInstruction, listEmptyTokenAccounts } from "../utils/accounts";
import styled from "styled-components";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

function MainPage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const tokenRegistry = useTokenRegistryContext();

  const [emptyAccounts, setEmptyAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (publicKey && tokenRegistry.size > 0 && !isLoading) {
        const emptyAccounts = await listEmptyTokenAccounts(connection, publicKey, tokenRegistry);
        setEmptyAccounts(emptyAccounts);
      }
    })();
  }, [connection, publicKey, tokenRegistry, isLoading]);

  if (!publicKey) {
    return (
      <Container>
        <WelcomePage />
      </Container>
    );
  }

  const content = isLoading ? <LaodingContent /> : (
    <EmptyTokens {...{
      emptyAccounts,
      isLoading,
      setIsLoading
    }} />
  );

  return (
    <Container>
      <MainContent>
        <Section>
          <SectionTitle>Connected to</SectionTitle>
          <SectionContent>
            <AddressContent>
              <a href={`https://solscan.io/account/${publicKey.toBase58()}`} target="_blank" rel="noreferrer">
                {publicKey.toBase58()}
              </a>
            </AddressContent>
            <DisconnectContainer>
              <WalletDisconnectButton />
            </DisconnectContainer>
          </SectionContent>
        </Section>
        {content}
      </MainContent>
    </Container>
  );
}

function EmptyTokens({
  emptyAccounts,
  isLoading,
  setIsLoading
}: {
  emptyAccounts: any[];
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}
) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  async function closeAccount(account: any) {
    if (!publicKey || !signTransaction) {
      return;
    }

    const accountAddress = new PublicKey(account.accountAddress);
    const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const tx = new Transaction({ recentBlockhash, feePayer: publicKey });
    tx.add(buildCloseTokenAccountInstruction(publicKey, accountAddress));

    try {
      const signedTx = await signTransaction(tx);

      setIsLoading(true);
      const txId = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txId, "processed");
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function closeAllAccounts() {
    if (!publicKey || !signAllTransactions) {
      return;
    }
    const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    let txArr: Transaction[] = [];
    emptyAccounts.forEach((acc: any) => {
      const tx = new Transaction({ recentBlockhash, feePayer: publicKey });
      tx.add(buildCloseTokenAccountInstruction(publicKey, acc.accountAddress));
      txArr.push(tx);
    })

    try {
      const signedTxArr = await signAllTransactions(txArr);
      setIsLoading(true);
      await Promise.all(signedTxArr.map((signedTx) => new Promise(resolve => {
        connection.sendRawTransaction(signedTx.serialize()).then((txId) => {
          resolve(txId);
          //connection.confirmTransaction(txId, "processed").then((v) => resolve(v));
        });
      })));
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }
  

  const content = emptyAccounts.length === 0 ? <SectionTitle>No empty accounts</SectionTitle> : (
    <>
      <SectionTitle>Zero balance token accounts</SectionTitle>
      <SectionContent>
        <TokenCloseButton onClick={() => closeAllAccounts()} disabled={isLoading}>
          Close ALL
        </TokenCloseButton>
      </SectionContent>
      
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

function LaodingContent() {
  return (
    <Section>
      <SectionTitle>
        Loading...
      </SectionTitle>
    </Section>
  );
}

function WelcomePage() {
  return (
    <WelcomeContainer>
      <WalletMultiButton />
    </WelcomeContainer>
  )
}

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

const DisconnectContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
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

export default MainPage;