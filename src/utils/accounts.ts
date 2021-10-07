import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenInfoMap } from '@solana/spl-token-registry';
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

export async function listEmptyTokenAccounts(
  connection: Connection,
  ownerAddress: PublicKey,
  tokenRegistry: TokenInfoMap
) {
  const { value } = await connection.getParsedTokenAccountsByOwner(
    ownerAddress,
    {programId: TOKEN_PROGRAM_ID}
  );

  const allTokens = value.map((accountInfo: any) => {
    const accountAddress = accountInfo.pubkey as string;
    const mintAddress = accountInfo.account.data.parsed.info.mint as string;
    const amount = accountInfo.account.data.parsed.info.tokenAmount;
    const name = tokenRegistry.get(mintAddress)?.name;
    return { accountAddress, mintAddress, amount, name };
  });

  const emptyTokens = allTokens.filter((token) => token.amount.amount === "0");
  emptyTokens.sort((a, b) => {
    if (!a.name) {
      return 1;
    }
    
    if (!b.name) {
      return -1;
    }

    return a.name.localeCompare(b.name);
  });
  return emptyTokens;
}

export function buildCloseTokenAccountInstruction(
  ownerAddress: PublicKey,
  accountAddress: PublicKey
): TransactionInstruction {
  return Token.createCloseAccountInstruction(
    TOKEN_PROGRAM_ID,
    accountAddress,
    ownerAddress,
    ownerAddress,
    []
  );
}