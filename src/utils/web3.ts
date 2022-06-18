import { AMM_STATE_SEED, ASSOCIATED_TOKEN_PROGRAM_ID, CRP_LP_PROGRAM_ID_V1, NNI_LP_PROGRAM_ID_V1, RENT_PROGRAM_ID, SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@/utils/ids'
import { ACCOUNT_LAYOUT, MINT_LAYOUT } from '@/utils/layouts'
import { TOKENS } from '@/utils/tokens'
import { initializeAccount } from '@project-serum/serum/lib/token-instructions'
// @ts-ignore without ts ignore, yarn build will failed
import { Token } from '@solana/spl-token'
import {
  Account,
  AccountInfo,
  Commitment,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature
} from '@solana/web3.js'
import { GLOBAL_STATE_LAYOUT } from './nni-swap'

export const web3Config = {
  strategy: 'speed',
  rpcs: [
    { url: 'https://node.neonomadfinance.com/3ccce80332b0ce21965496d3dc5af39c9a8cbdbb/', weight: 70 },
  ]
}

// export const commitment: Commitment = 'processed'
export const commitment: Commitment = 'confirmed'
// export const commitment: Commitment = 'finalized'

export async function findProgramAddress(seeds: Array<Buffer | Uint8Array>, programId: PublicKey) {
  const [publicKey, nonce] = await PublicKey.findProgramAddress(seeds, programId)
  return { publicKey, nonce }
}

export async function createAmmAuthority(programId: PublicKey) {
  return await findProgramAddress(
    [new Uint8Array(Buffer.from('amm authority'.replace('\u00A0', ' '), 'utf-8'))],
    programId
  )
}

async function createGlobalStateId(programId: PublicKey, bufferKey: string) {
  const { publicKey } = await findProgramAddress(
    [Buffer.from(bufferKey), programId.toBuffer()],
    programId
  )
  return publicKey
}


export async function createAssociatedId(infoId: PublicKey, marketAddress: PublicKey, bufferKey: string) {
  const { publicKey } = await findProgramAddress(
    [infoId.toBuffer(), marketAddress.toBuffer(), Buffer.from(bufferKey)],
    infoId
  )
  return publicKey
}

export async function findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey) {
  const { publicKey } = await findProgramAddress(
    [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return publicKey
}

export async function createTokenAccountIfNotExist(
  connection: Connection,
  account: string | undefined | null,
  owner: PublicKey,
  mintAddress: string,
  lamports: number | null,

  transaction: Transaction,
  signer: Array<Account>
) {
  let publicKey

  if (account) {
    publicKey = new PublicKey(account)
  } else {
    publicKey = await createProgramAccountIfNotExist(
      connection,
      account,
      owner,
      TOKEN_PROGRAM_ID,
      lamports,
      ACCOUNT_LAYOUT,
      transaction,
      signer
    )

    transaction.add(
      initializeAccount({
        account: publicKey,
        mint: new PublicKey(mintAddress),
        owner
      })
    )
  }

  return publicKey
}

export async function getAMMGlobalStateAddress(official: boolean){
  return await createGlobalStateId(new PublicKey(official ? NNI_LP_PROGRAM_ID_V1 : CRP_LP_PROGRAM_ID_V1), AMM_STATE_SEED)
}

export async function getAMMGlobalStateAccount(conn:any, official: boolean)
{
  const stateId = await getAMMGlobalStateAddress(official)
  const state = await conn.getAccountInfo(stateId)
  let state_account = null
  if(state)
  {
    const stateData = GLOBAL_STATE_LAYOUT.decode(Buffer.from(state.data))

    if (stateData.isInitialized) {
      state_account = {
        ...stateData
      }
    }
  }
  return state_account
}

export async function createAssociatedTokenAccountIfNotExist(
  account: string | undefined | null,
  owner: PublicKey,
  mintAddress: string,

  transaction: Transaction,
  atas: string[] = []
) {
  let publicKey
  if (account) {
    publicKey = new PublicKey(account)
  }

  const mint = new PublicKey(mintAddress)
  // @ts-ignore without ts ignore, yarn build will failed
  const ata = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner, true)

  if ((!publicKey || !ata.equals(publicKey)) && !atas.includes(ata.toBase58())) {
    transaction.add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        owner,
        owner
      )
    )
    atas.push(ata.toBase58())
  }

  return ata
}

export async function createAtaSolIfNotExistAndWrap(
  connection: Connection,
  account: string | undefined | null,
  owner: PublicKey,
  transaction: Transaction,
  signers: Array<Account>,
  amount: number
) {
  let publicKey
  if (account) {
    publicKey = new PublicKey(account)
  }
  const mint = new PublicKey(TOKENS.WSOL.mintAddress)
  // @ts-ignore without ts ignore, yarn build will failed
  const ata = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner, true)
  if (!publicKey) {
    const rent = await Token.getMinBalanceRentForExemptAccount(connection)
    transaction.add(
      SystemProgram.transfer({ fromPubkey: owner, toPubkey: ata, lamports: amount + rent }),
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        owner,
        owner
      )
    )
  } else {
    const rent = await Token.getMinBalanceRentForExemptAccount(connection)
    const wsol = await createTokenAccountIfNotExist(
      connection,
      null,
      owner,
      TOKENS.WSOL.mintAddress,
      amount + rent,
      transaction,
      signers
    )
    transaction.add(
      Token.createTransferInstruction(TOKEN_PROGRAM_ID, wsol, ata, owner, [], amount),
      Token.createCloseAccountInstruction(TOKEN_PROGRAM_ID, wsol, owner, owner, [])
    )
  }
}

export async function createAssociatedTokenAccountIfNotExist2(
  account: string | undefined | null,
  owner: PublicKey,
  payer: PublicKey,
  mintAddress: string,

  transaction: Transaction,
  atas: string[] = []
) {
  let publicKey
  if (account) {
    publicKey = new PublicKey(account)
  }

  const mint = new PublicKey(mintAddress)
  // @ts-ignore without ts ignore, yarn build will failed
  const ata = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, owner, true)

  if ((!publicKey || !ata.equals(publicKey)) && !atas.includes(ata.toBase58())) {
    transaction.add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        owner,
        payer
      )
    )
    atas.push(ata.toBase58())
  }

  return ata
}

export async function createProgramAccountIfNotExist(
  connection: Connection,
  account: string | undefined | null,
  owner: PublicKey,
  programId: PublicKey,
  lamports: number | null,
  layout: any,

  transaction: Transaction,
  signer: Array<Account>
) {
  let publicKey

  if (account) {
    publicKey = new PublicKey(account)
  } else {
    const newAccount = new Account()
    publicKey = newAccount.publicKey

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: publicKey,
        lamports: lamports ?? (await connection.getMinimumBalanceForRentExemption(layout.span)),
        space: layout.span,
        programId
      })
    )

    signer.push(newAccount)
  }

  return publicKey
}

export async function createAssociatedTokenAccount(
  tokenMintAddress: PublicKey,
  owner: PublicKey,
  transaction: Transaction
) {
  const associatedTokenAddress = await findAssociatedTokenAddress(owner, tokenMintAddress)

  const keys = [
    {
      pubkey: owner,
      isSigner: true,
      isWritable: true
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: owner,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: tokenMintAddress,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: RENT_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    }
  ]

  transaction.add(
    new TransactionInstruction({
      keys,
      programId: ASSOCIATED_TOKEN_PROGRAM_ID,
      data: Buffer.from([])
    })
  )

  return associatedTokenAddress
}

export async function getFilteredProgramAccounts(
  connection: Connection,
  programId: PublicKey,
  filters: any
): Promise<{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer> }[]> {
  // @ts-ignore
  const resp = await connection._rpcRequest('getProgramAccounts', [
    programId.toBase58(),
    {
      commitment: connection.commitment,
      filters,
      encoding: 'base64'
    }
  ])
  if (resp.error) {
    throw new Error(resp.error.message)
  }
  // @ts-ignore
  return resp.result.map(({ pubkey, account: { data, executable, owner, lamports } }) => ({
    publicKey: new PublicKey(pubkey),
    accountInfo: {
      data: Buffer.from(data[0], 'base64'),
      executable,
      owner: new PublicKey(owner),
      lamports
    }
  }))
}

export async function getFilteredProgramAccountsAmmOrMarketCache(
  cacheName: String,
  connection: Connection,
  programId: PublicKey,
  filters: any
): Promise<{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer> }[]> {
  try {
    if (!cacheName) {
      throw new Error('cacheName error')
    }

    const resp = await (await fetch('https://api.raydium.io/cache/rpc/' + cacheName)).json()
    if (resp.error) {
      throw new Error(resp.error.message)
    }
    // @ts-ignore
    return resp.result.map(({ pubkey, account: { data, executable, owner, lamports } }) => ({
      publicKey: new PublicKey(pubkey),
      accountInfo: {
        data: Buffer.from(data[0], 'base64'),
        executable,
        owner: new PublicKey(owner),
        lamports
      }
    }))
  } catch (e) {
    return getFilteredProgramAccounts(connection, programId, filters)
  }
}

// getMultipleAccounts
export async function getMultipleAccounts(
  connection: Connection,
  publicKeys: PublicKey[],
  commitment?: Commitment
): Promise<Array<null | { publicKey: PublicKey; account: AccountInfo<Buffer> }>> {
  const keys: PublicKey[][] = []
  let tempKeys: PublicKey[] = []

  publicKeys.forEach((k) => {
    if (tempKeys.length >= 100) {
      keys.push(tempKeys)
      tempKeys = []
    }
    tempKeys.push(k)
  })
  if (tempKeys.length > 0) {
    keys.push(tempKeys)
  }

  const accounts: Array<null | {
    executable: any
    owner: PublicKey
    lamports: any
    data: Buffer
  }> = []

  const resArray: { [key: number]: any } = {}
  await Promise.all(
    keys.map(async (key, index) => {
      const res = await connection.getMultipleAccountsInfo(key, commitment)
      resArray[index] = res
    })
  )

  Object.keys(resArray)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach((itemIndex) => {
      const res = resArray[parseInt(itemIndex)]
      for (const account of res) {
        accounts.push(account)
      }
    })

  return accounts.map((account, idx) => {
    if (account === null) {
      return null
    }
    return {
      publicKey: publicKeys[idx],
      account
    }
  })
}

// transaction
export async function signTransaction(
  connection: Connection,
  wallet: any,
  transaction: Transaction,
  signers: Array<Account> = []
) {
  transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
  transaction.setSigners(wallet.publicKey, ...signers.map((s) => s.publicKey))
  if (signers.length > 0) {
    transaction.partialSign(...signers)
  }
  return await wallet.signTransaction(transaction)
}

async function covertToProgramWalletTransaction(
  connection: Connection,
  wallet: any,
  transaction: Transaction,
  signers: Array<Account> = []
) {
  transaction.recentBlockhash = (await connection.getRecentBlockhash(commitment)).blockhash
  transaction.feePayer = wallet.publicKey
  if (signers.length > 0) {
    transaction = await wallet.convertToProgramWalletTransaction(transaction)
    transaction.partialSign(...signers)
  }
  return transaction
}

export async function sendTransaction(
  connection: Connection,
  wallet: any,
  transaction: Transaction,
  signers: Array<Account> = []
) {
  if (wallet.isProgramWallet) {
    const programWalletTransaction = await covertToProgramWalletTransaction(connection, wallet, transaction, signers)
    return await wallet.signAndSendTransaction(programWalletTransaction)
  } else {
    const signedTransaction = await signTransaction(connection, wallet, transaction, signers)
    return await sendSignedTransaction(connection, signedTransaction)
  }
}

export async function sendSignedTransaction(connection: Connection, signedTransaction: Transaction): Promise<string> {
  const rawTransaction = signedTransaction.serialize()

  const txid: TransactionSignature = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    preflightCommitment: commitment
  })

  return txid
}

export function mergeTransactions(transactions: (Transaction | undefined)[]) {
  const transaction = new Transaction()
  transactions
    .filter((t): t is Transaction => t !== undefined)
    .forEach((t) => {
      transaction.add(t)
    })
  return transaction
}

function throwIfNull<T>(value: T | null, message = 'account not found'): T {
  if (value === null) {
    throw new Error(message)
  }
  return value
}

export async function getMintDecimals(connection: Connection, mint: PublicKey): Promise<number> {
  const { data } = throwIfNull(await connection.getAccountInfo(mint), 'mint not found')
  const { decimals } = MINT_LAYOUT.decode(data)
  return decimals
}

export async function getFilteredTokenAccountsByOwner(
  connection: Connection,
  programId: PublicKey,
  mint: PublicKey
): Promise<{ context: {}; value: [] }> {
  // @ts-ignore
  const resp = await connection._rpcRequest('getTokenAccountsByOwner', [
    programId.toBase58(),
    {
      mint: mint.toBase58()
    },
    {
      encoding: 'jsonParsed'
    }
  ])
  if (resp.error) {
    throw new Error(resp.error.message)
  }
  return resp.result
}

export async function getOneFilteredTokenAccountsByOwner(  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
): Promise<string|null> {
  try{
    const tokenAccountList1 = await getFilteredTokenAccountsByOwner(connection, owner, mint)
    const tokenAccountList: any = tokenAccountList1.value.map((item: any) => {
        return item.pubkey
    })
    let tokenAccount
    for (const item of tokenAccountList) {
      if (item !== null) {
        tokenAccount = item
      }
    }
    return tokenAccount
  }
  catch{
    return null
  }

}

export const checkWalletATA = async (
  mint: string,
  connection: Connection,
  walletPubkey: PublicKey
) => {
  const parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletPubkey,
    {
      programId: TOKEN_PROGRAM_ID
    },
    'confirmed'
  )
  let result: any = null
  parsedTokenAccounts.value.forEach(async (tokenAccountInfo) => {
    const tokenAccountPubkey = tokenAccountInfo.pubkey
    const parsedInfo = tokenAccountInfo.account.data.parsed.info
    const mintAddress = parsedInfo.mint
    if (mintAddress === mint) {
      result = tokenAccountPubkey
    }
  })
  return result
}
