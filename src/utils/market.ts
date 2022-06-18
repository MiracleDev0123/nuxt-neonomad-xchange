import { ACCOUNT_LAYOUT, getBigNumber, MINT_LAYOUT } from './layouts'
import { transfer } from './swap'
import { throwIfNull } from './errors'
import { LIQUIDITY_POOLS } from './pools'
import BigNumber from 'bignumber.js'
import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction
} from '@solana/web3.js'
import { Token, MintLayout, AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import {

  CRP_AMM_LAYOUT_V1,
  LIQUIDITY_TOKEN_PRECISION,
  createSplAccount,
  createLiquidityPool,
} from "@/utils/nni-swap"

import {
  NNI_LP_PROGRAM_ID_V1,
  SERUM_PROGRAM_ID_V3,
  TOKEN_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  AMM_ASSOCIATED_SEED,
  AMM_STATE_SEED,
  TARGET_ASSOCIATED_SEED,
  WITHDRAW_ASSOCIATED_SEED,
  COIN_VAULT_ASSOCIATED_SEED,
  PC_VAULT_ASSOCIATED_SEED,
  LP_MINT_ASSOCIATED_SEED,
  TEMP_LP_TOKEN_ASSOCIATED_SEED,
  OPEN_ORDER_ASSOCIATED_SEED
} from '@/utils/ids'
import {
  commitment,
  getMultipleAccounts,
  sendTransaction,
  createAmmAuthority,
  getMintDecimals,
  getFilteredTokenAccountsByOwner,
  getOneFilteredTokenAccountsByOwner,
  createAssociatedId,
  findAssociatedTokenAddress,
  createAssociatedTokenAccount,
  createTokenAccountIfNotExist,
  getAMMGlobalStateAccount,
  getAMMGlobalStateAddress
} from '@/utils/web3'
// @ts-ignore
import { struct, u8 } from 'buffer-layout'

// import { AMM_INFO_LAYOUT_V4 } from '@/utils/liquidity'
import { Market as MarketSerum } from '@project-serum/serum'
import { Orderbook } from '@project-serum/serum/lib/market.js'
import {
  closeAccount,
  initializeAccount
  // initializeMint
  // encodeTokenInstructionData
} from '@project-serum/serum/lib/token-instructions'
import { TOKENS } from '@/utils/tokens'

export async function getMarket(conn: any, marketAddress: string): Promise<any | any> {
  try {
    const expectAmmId = (
      await createAssociatedId(
        new PublicKey(NNI_LP_PROGRAM_ID_V1),
        new PublicKey(marketAddress),
        AMM_ASSOCIATED_SEED
      )
    ).toString()
    if (LIQUIDITY_POOLS.find((item) => item.ammId === expectAmmId)) {
      throw new Error('There is already a pool for this Serum Market')
    }
    const marketAddressPubKey = new PublicKey(marketAddress)
    const market = await Market.load(conn, marketAddressPubKey, undefined, new PublicKey(SERUM_PROGRAM_ID_V3))
    const {
      asksAddress,
      bidsAddress,
      quoteMint
      // baseMint
    } = market
    let coinOrPcInTokenFlag = false

    for (const item of [TOKENS.USDT, TOKENS.USDC, TOKENS.CRP, TOKENS.WSOL, TOKENS.SRM]) {
      if (quoteMint?.toBase58() === item.mintAddress) {
        coinOrPcInTokenFlag = true
        break
      }
    }
    if (!coinOrPcInTokenFlag) {
      throw new Error(
        'Only markets that contain USDC, USDT, SOL, CRP, or SRM as the Quote Token are currently supported.'
      )
    }
    const asks: number[] = []
    const bids: number[] = []

    const orderBookMsg = await getMultipleAccounts(conn, [bidsAddress, asksAddress], commitment)
    console.log("getMultipleAccounts->5", orderBookMsg.length)
    orderBookMsg.forEach((info) => {
      // @ts-ignore
      const data = info.account.data
      const orderbook = Orderbook.decode(market, data)
      const { isBids, slab } = orderbook
      if (isBids) {
        for (const item of slab.items(true)) {
          bids.push(market?.priceLotsToNumber(item.key.ushrn(64)) || 0)
        }
      } else {
        for (const item of slab.items(false)) {
          asks.push(market?.priceLotsToNumber(item.key.ushrn(64)) || 0)
        }
      }
    })
    const price = asks.length > 0 && bids.length > 0 ? (asks[0] + bids[0]) / 2 : NaN

    const baseMintDecimals = new BigNumber(await getMintDecimals(conn, market.baseMintAddress as PublicKey))
    const quoteMintDecimals = new BigNumber(await getMintDecimals(conn, market.quoteMintAddress as PublicKey))
    return { market, price, msg: '', baseMintDecimals, quoteMintDecimals }
  } catch (error:any) {
    if (error.message === 'Non-base58 character') {
      return { market: null, price: null, msg: 'market input error', baseMintDecimals: 0, quoteMintDecimals: 0 }
    } else {
      return { market: null, price: null, msg: error.message, baseMintDecimals: 0, quoteMintDecimals: 0 }
    }
  }
}

export async function createAmm(
  conn: any,
  wallet: any,
  market: any,
  userInputBaseValue: number,
  userInputQuoteValue: number
) {

  // return (await updateGlobalState(conn, wallet))
  console.log("Creating AMM")
  let instructions: TransactionInstruction[] = [];
  let cleanupInstructions: TransactionInstruction[] = [];

  const liquidityTokenAccount = new Account();
  // Create account for pool liquidity token
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: liquidityTokenAccount.publicKey,
      lamports: await conn.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  const tokenSwapAccount = new Account();
  // const ammId: PublicKey = await createAssociatedId(
  //   new PublicKey(LIQUIDITY_POOL_PROGRAM_ID_V5),
  //   market.address,
  //   AMM_ASSOCIATED_SEED
  // )
  const ammId: PublicKey = tokenSwapAccount.publicKey
  const [authority, nonce] = await PublicKey.findProgramAddress(
    [tokenSwapAccount.publicKey.toBuffer()],
    new PublicKey(NNI_LP_PROGRAM_ID_V1)
  );

  // create mint for pool liquidity token
  instructions.push(
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      liquidityTokenAccount.publicKey,
      LIQUIDITY_TOKEN_PRECISION,
      // pass control of liquidity mint to swap program
      authority,
      // swap program can freeze liquidity token mint
      null
    )
  );

  // Create holding accounts for
  const accountRentExempt = await conn.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );
  const holdingAccounts: Account[] = [];
  let signers: Account[] = [];

  [market.baseMintAddress, market.quoteMintAddress].forEach((mintPublicKey) => {

    // component account to store tokens I of N in liquidity poll
    holdingAccounts.push(
      createSplAccount(
        instructions,
        wallet.publicKey,
        accountRentExempt,
        mintPublicKey,
        authority,
        AccountLayout.span
      )
    );
  });

  // creating depositor pool account
  const depositorAccount:PublicKey = await findAssociatedTokenAddress(wallet.publicKey, liquidityTokenAccount.publicKey)
  const destLpTokenInfo = await conn.getAccountInfo(depositorAccount)
  if(!destLpTokenInfo)
  {
    instructions.push(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        liquidityTokenAccount.publicKey,
        depositorAccount,
        wallet.publicKey,
        wallet.publicKey
      )
    )
  }

  let transaction = new Transaction()
  instructions.forEach((instruction)=>{
    transaction.add(instruction)
  })
  // create all accounts in one transaction
  let tx = await sendTransaction(conn, wallet, transaction, [
    liquidityTokenAccount,
    // depositorAccount,
    ...holdingAccounts,
    ...signers,
  ]);
  console.log("tx->", tx)

  signers = [];
  instructions = [];
  cleanupInstructions = [];

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: tokenSwapAccount.publicKey,
      lamports: await conn.getMinimumBalanceForRentExemption(
        CRP_AMM_LAYOUT_V1.span
      ),
      space: CRP_AMM_LAYOUT_V1.span,
      programId: new PublicKey(NNI_LP_PROGRAM_ID_V1),
    })
  );
  
  const baseMintDecimals = new BigNumber(await getMintDecimals(conn, market.baseMintAddress as PublicKey))
  const quoteMintDecimals = new BigNumber(await getMintDecimals(conn, market.quoteMintAddress as PublicKey))

  const coinVol = new BigNumber(10).exponentiatedBy(baseMintDecimals).multipliedBy(userInputBaseValue)
  const pcVol = new BigNumber(10).exponentiatedBy(quoteMintDecimals).multipliedBy(userInputQuoteValue)

  const owner = wallet.publicKey
  const baseToken = await getOneFilteredTokenAccountsByOwner(conn, owner, market.baseMintAddress)
  const quoteToken = await getOneFilteredTokenAccountsByOwner(conn, owner, market.quoteMintAddress)

  let src_dst = [{
    account : baseToken,
    amount: coinVol,
    mintAddress: market.baseMintAddress,
  },{
    account : quoteToken,
    amount: pcVol,
    mintAddress: market.quoteMintAddress,
  }]

  if (
    (baseToken === null && market.baseMintAddress.toString() !== TOKENS.WSOL.mintAddress) ||
    (quoteToken === null && market.quoteMintAddress.toString() !== TOKENS.WSOL.mintAddress)
  ) {
    throw new Error('no money')
  }

  src_dst.forEach((leg, i) => {
  
    if (leg.mintAddress.toString() === TOKENS.WSOL.mintAddress) {
      const newAccount = new Account()
      instructions.push(
        SystemProgram.createAccount({
          fromPubkey: owner,
          newAccountPubkey: newAccount.publicKey,
          lamports: parseInt(leg.amount.toFixed()) + 1e7,
          space: ACCOUNT_LAYOUT.span,
          programId: TOKEN_PROGRAM_ID
        })
      )

      instructions.push(
        initializeAccount({
          account: newAccount.publicKey,
          mint: new PublicKey(TOKENS.WSOL.mintAddress),
          owner
        })
      )
  
      instructions.push(transfer(newAccount.publicKey, holdingAccounts[i].publicKey, owner, parseInt(leg.amount.toFixed())))
      instructions.push(
        closeAccount({
          source: newAccount.publicKey,
          destination: owner,
          owner
        })
      )
  
      signers.push(newAccount)
    } else {
      instructions.push(
        // @ts-ignore
        transfer(new PublicKey(leg.account), holdingAccounts[i].publicKey, owner, parseInt(leg.amount.toFixed()))
      )
    }
  });

  const stateId = await getAMMGlobalStateAddress(true);
  instructions.push(
    createLiquidityPool(
      tokenSwapAccount,
      authority,
      stateId,
      ammId,
      holdingAccounts[0].publicKey,
      holdingAccounts[1].publicKey,
      liquidityTokenAccount.publicKey,
      depositorAccount,
      TOKEN_PROGRAM_ID,
      new PublicKey(NNI_LP_PROGRAM_ID_V1),
      new PublicKey(SERUM_PROGRAM_ID_V3),
      market.address,
      nonce,
      wallet.publicKey
    )
  );

  transaction = new Transaction()
  instructions.forEach((instruction)=>{
    transaction.add(instruction)
  })
  cleanupInstructions.forEach((instruction)=>{
    transaction.add(instruction)
  })
    // initialize and provide inital liquidity to swap in 2nd (this prevents loss of funds)
  tx = await sendTransaction(
    conn,
    wallet,
    transaction,
    [tokenSwapAccount, ...signers]
  );
  console.log("tx2->", tx)

  return ammId.toBase58()
}

async function initAmm(
  conn: any,
  wallet: any,
  market: any,
  ammProgramId: PublicKey,
  dexProgramId: PublicKey,
  // ammKeypair: PublicKey,
  ammKeys: any,
  userInputBaseValue: number,
  userInputQuoteValue: number,
  poolCoinTokenAccount: PublicKey,
  poolPcTokenAccount: PublicKey
) {
  const baseMintDecimals = new BigNumber(await getMintDecimals(conn, market.baseMintAddress as PublicKey))
  const quoteMintDecimals = new BigNumber(await getMintDecimals(conn, market.quoteMintAddress as PublicKey))

  const coinVol = new BigNumber(10).exponentiatedBy(baseMintDecimals).multipliedBy(userInputBaseValue)
  const pcVol = new BigNumber(10).exponentiatedBy(quoteMintDecimals).multipliedBy(userInputQuoteValue)

  const transaction = new Transaction()
  const signers: any = []
  const owner = wallet.publicKey
  const baseTokenAccount = await getFilteredTokenAccountsByOwner(conn, owner, market.baseMintAddress)
  const quoteTokenAccount = await getFilteredTokenAccountsByOwner(conn, owner, market.quoteMintAddress)
  const baseTokenList: any = baseTokenAccount.value.map((item: any) => {
    if (item.account.data.parsed.info.tokenAmount.amount >= getBigNumber(coinVol)) {
      return item.pubkey
    }
    return null
  })
  const quoteTokenList: any = quoteTokenAccount.value.map((item: any) => {
    if (item.account.data.parsed.info.tokenAmount.amount >= getBigNumber(pcVol)) {
      return item.pubkey
    }
    return null
  })
  let baseToken: string | null = null
  for (const item of baseTokenList) {
    if (item !== null) {
      baseToken = item
    }
  }
  let quoteToken: string | null = null
  for (const item of quoteTokenList) {
    if (item !== null) {
      quoteToken = item
    }
  }
  if (
    (baseToken === null && market.baseMintAddress.toString() !== TOKENS.WSOL.mintAddress) ||
    (quoteToken === null && market.quoteMintAddress.toString() !== TOKENS.WSOL.mintAddress)
  ) {
    throw new Error('no money')
  }

  if (market.baseMintAddress.toString() === TOKENS.WSOL.mintAddress) {
    const newAccount = new Account()
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: newAccount.publicKey,
        lamports: parseInt(coinVol.toFixed()) + 1e7,
        space: ACCOUNT_LAYOUT.span,
        programId: TOKEN_PROGRAM_ID
      })
    )
    transaction.add(
      initializeAccount({
        account: newAccount.publicKey,
        mint: new PublicKey(TOKENS.WSOL.mintAddress),
        owner
      })
    )

    transaction.add(transfer(newAccount.publicKey, poolCoinTokenAccount, owner, parseInt(coinVol.toFixed())))

    transaction.add(
      closeAccount({
        source: newAccount.publicKey,
        destination: owner,
        owner
      })
    )

    signers.push(newAccount)
  } else {
    transaction.add(
      // @ts-ignore
      transfer(new PublicKey(baseToken), poolCoinTokenAccount, owner, parseInt(coinVol.toFixed()))
    )
  }
  if (market.quoteMintAddress.toString() === TOKENS.WSOL.mintAddress) {
    const newAccount = new Account()
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: newAccount.publicKey,
        lamports: parseInt(pcVol.toFixed()) + 1e7,
        space: ACCOUNT_LAYOUT.span,
        programId: TOKEN_PROGRAM_ID
      })
    )
    transaction.add(
      initializeAccount({
        account: newAccount.publicKey,
        mint: new PublicKey(TOKENS.WSOL.mintAddress),
        owner
      })
    )

    transaction.add(transfer(newAccount.publicKey, poolPcTokenAccount, owner, parseInt(pcVol.toFixed())))
    transaction.add(
      closeAccount({
        source: newAccount.publicKey,
        destination: owner,
        owner
      })
    )
    signers.push(newAccount)
  } else {
    // @ts-ignore
    transaction.add(transfer(new PublicKey(quoteToken), poolPcTokenAccount, owner, parseInt(pcVol.toFixed())))
  }

  transaction.add(
    initialize(
      ammProgramId,
      ammKeys.ammId,
      ammKeys.ammAuthority,
      ammKeys.ammOpenOrders,
      ammKeys.lpMintAddress,
      market.baseMintAddress,
      market.quoteMintAddress,
      ammKeys.poolCoinTokenAccount,
      ammKeys.poolPcTokenAccount,
      ammKeys.poolWithdrawQueue,
      ammKeys.destLpToken,
      ammKeys.poolTempLpTokenAccount,
      dexProgramId,
      market.address,

      owner,

      ammKeys.nonce
    )
  )

  transaction.add(
    initialize2(
      ammProgramId,
      ammKeys.ammId,
      ammKeys.ammAuthority,
      ammKeys.ammOpenOrders,
      ammKeys.poolCoinTokenAccount,
      ammKeys.poolPcTokenAccount,
      ammKeys.ammTargetOrders,
      dexProgramId,
      market.address,
      market.baseVault,
      market.quoteVault,
      market.requestQueue,
      market.eventQueue,
      market.bids,
      market.asks
    )
  )

  const txid = await sendTransaction(conn, wallet, transaction, signers)

  console.log('txid3', txid)
  let txidSuccessFlag = 0
  await conn.onSignature(txid, function (_signatureResult: any, _context: any) {
    if (_signatureResult.err) {
      txidSuccessFlag = -1
    } else {
      txidSuccessFlag = 1
    }
  })

  const timeAwait = new Date().getTime()
  let outOfWhile = false
  while (!outOfWhile) {
    console.log('txid3', outOfWhile, txidSuccessFlag, (new Date().getTime() - timeAwait) / 1000)
    if (txidSuccessFlag !== 0) {
      outOfWhile = true
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  if (txidSuccessFlag !== 1) {
    throw new Error('Transaction failed')
  }

  clearLocal()
}

export function initialize(
  ammProgramId: PublicKey,
  ammId: PublicKey,
  ammAuthority: PublicKey,
  ammOpenOrders: PublicKey,
  lpMintAddress: PublicKey,
  coinMint: PublicKey,
  pcMint: PublicKey,
  poolCoinTokenAccount: PublicKey,
  poolPcTokenAccount: PublicKey,
  poolWithdrawQueue: PublicKey,
  poolLpTokenAccount: PublicKey,
  poolTempLpTokenAccount: PublicKey,
  serumProgramId: PublicKey,
  serumMarket: PublicKey,
  owner: PublicKey,
  nonce: number
): TransactionInstruction {
  const dataLayout = struct([u8('instruction'), u8('nonce')])

  const keys = [
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: ammId, isSigner: false, isWritable: true },
    { pubkey: ammAuthority, isSigner: false, isWritable: false },
    { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
    { pubkey: lpMintAddress, isSigner: false, isWritable: true },
    { pubkey: coinMint, isSigner: false, isWritable: true },
    { pubkey: pcMint, isSigner: false, isWritable: true },
    { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolWithdrawQueue, isSigner: false, isWritable: true },
    { pubkey: poolLpTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolTempLpTokenAccount, isSigner: false, isWritable: true },
    { pubkey: serumProgramId, isSigner: false, isWritable: false },
    { pubkey: serumMarket, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: true }
  ]
  const data = Buffer.alloc(dataLayout.span)

  dataLayout.encode(
    {
      instruction: 0,
      nonce
    },
    data
  )

  return new TransactionInstruction({
    keys,
    programId: ammProgramId,
    data
  })
}

export function initialize2(
  programId: PublicKey,
  ammId: PublicKey,
  ammAuthority: PublicKey,
  ammOpenOrders: PublicKey,
  poolCoinTokenAccount: PublicKey,
  poolPcTokenAccount: PublicKey,
  ammTargetOrders: PublicKey,
  serumProgramId: PublicKey,
  serumMarket: PublicKey,
  serumCoinVaultAccount: PublicKey,
  serumPcVaultAccount: PublicKey,
  serumReqQ: PublicKey,
  serumEventQ: PublicKey,
  serumBids: PublicKey,
  serumAsks: PublicKey
): TransactionInstruction {
  const dataLayout = struct([u8('instruction'), u8('nonce')])

  const keys = [
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: true },
    { pubkey: ammId, isSigner: false, isWritable: true },
    { pubkey: ammAuthority, isSigner: false, isWritable: true },
    { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
    { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
    { pubkey: ammTargetOrders, isSigner: false, isWritable: true },
    { pubkey: serumProgramId, isSigner: false, isWritable: true },
    { pubkey: serumMarket, isSigner: false, isWritable: true },
    { pubkey: serumCoinVaultAccount, isSigner: false, isWritable: true },
    { pubkey: serumPcVaultAccount, isSigner: false, isWritable: true },
    { pubkey: serumReqQ, isSigner: false, isWritable: true },
    { pubkey: serumEventQ, isSigner: false, isWritable: true },
    { pubkey: serumBids, isSigner: false, isWritable: true },
    { pubkey: serumAsks, isSigner: false, isWritable: true }
  ]
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: 1
    },
    data
  )
  return new TransactionInstruction({
    keys,
    programId,
    data
  })
}

export function preInitialize(
  programId: PublicKey,
  ammTargetOrders: PublicKey,
  poolWithdrawQueue: PublicKey,
  ammAuthority: PublicKey,
  lpMintAddress: PublicKey,
  coinMintAddress: PublicKey,
  pcMintAddress: PublicKey,
  poolCoinTokenAccount: PublicKey,
  poolPcTokenAccount: PublicKey,
  poolTempLpTokenAccount: PublicKey,
  market: PublicKey,
  owner: PublicKey,
  nonce: u8
): TransactionInstruction {
  const dataLayout = struct([u8('instruction'), u8('nonce')])

  const keys = [
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },

    { pubkey: ammTargetOrders, isSigner: false, isWritable: true },
    { pubkey: poolWithdrawQueue, isSigner: false, isWritable: true },
    { pubkey: ammAuthority, isSigner: false, isWritable: false },
    { pubkey: lpMintAddress, isSigner: false, isWritable: true },
    { pubkey: coinMintAddress, isSigner: false, isWritable: false },
    { pubkey: pcMintAddress, isSigner: false, isWritable: false },
    { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolTempLpTokenAccount, isSigner: false, isWritable: true },
    { pubkey: market, isSigner: false, isWritable: false },
    { pubkey: owner, isSigner: true, isWritable: true }
  ]
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: 10,
      nonce
    },
    data
  )
  return new TransactionInstruction({
    keys,
    programId,
    data
  })
}

export class Market extends MarketSerum {
  public baseVault: PublicKey | null = null
  public quoteVault: PublicKey | null = null
  public requestQueue: PublicKey | null = null
  public eventQueue: PublicKey | null = null
  public bids: PublicKey | null = null
  public asks: PublicKey | null = null
  public baseLotSize: number = 0
  public quoteLotSize: number = 0
  public decoded: any
  public quoteMint: PublicKey | null = null
  public baseMint: PublicKey | null = null

  static async load(connection: Connection, address: PublicKey, options: any = {}, programId: PublicKey) {
    const { owner, data } = throwIfNull(await connection.getAccountInfo(address), 'Market not found')
    if (!owner.equals(programId)) {
      throw new Error('Address not owned by program: ' + owner.toBase58())
    }
    const decoded = this.getLayout(programId).decode(data)
    if (!decoded.accountFlags.initialized || !decoded.accountFlags.market || !decoded.ownAddress.equals(address)) {
      throw new Error('Invalid market')
    }
    const [baseMintDecimals, quoteMintDecimals] = await Promise.all([
      getMintDecimals(connection, decoded.baseMint),
      getMintDecimals(connection, decoded.quoteMint)
    ])

    const market = new Market(decoded, baseMintDecimals, quoteMintDecimals, options, programId)
    market.decoded = decoded
    market.baseLotSize = decoded.baseLotSize
    market.quoteLotSize = decoded.quoteLotSize
    market.baseVault = decoded.baseVault
    market.quoteVault = decoded.quoteVault
    market.requestQueue = decoded.requestQueue
    market.eventQueue = decoded.eventQueue
    market.bids = decoded.bids
    market.asks = decoded.asks
    market.quoteMint = decoded.quoteMint
    market.baseMint = decoded.baseMint
    return market
  }
}

export function clearLocal() {
  localStorage.removeItem('poolCoinTokenAccount')
  localStorage.removeItem('poolPcTokenAccount')
  localStorage.removeItem('lpMintAddress')
  localStorage.removeItem('poolTempLpTokenAccount')
  localStorage.removeItem('ammId')
  localStorage.removeItem('ammOpenOrders')
  localStorage.removeItem('ammTargetOrders')
  localStorage.removeItem('poolWithdrawQueue')
  localStorage.removeItem('destLpToken')

  localStorage.removeItem('createMarket')
}
