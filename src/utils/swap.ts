import { getBigNumber } from './layouts'
import { Account, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
// @ts-ignore
import { u8, nu64, struct } from 'buffer-layout'
import { Market, OpenOrders, _OPEN_ORDERS_LAYOUT_V2 } from '@project-serum/serum/lib/market'
// eslint-disable-next-line
import { NATIVE_SOL, TOKENS, getTokenByMintAddress } from './tokens'
import {
  createProgramAccountIfNotExist,
  createTokenAccountIfNotExist,
  createAssociatedTokenAccountIfNotExist,
  mergeTransactions,
  sendTransaction,
  commitment,
  getMintDecimals,
  getAMMGlobalStateAccount,
  getOneFilteredTokenAccountsByOwner,
  getAMMGlobalStateAddress,
  createAtaSolIfNotExistAndWrap,
  createAssociatedTokenAccountIfNotExist2,
} from '@/utils/web3'
import { TokenAmount } from '@/utils/safe-math'
import { ACCOUNT_LAYOUT } from '@/utils/layouts'
import { swapInstruction_v5, updateGlobalStateInstruction, CurveType, swapInstruction_v5_NonOfficial } from '@/utils/nni-swap'
// eslint-disable-next-line
import { SYSTEM_PROGRAM_ID, MEMO_PROGRAM_ID, SERUM_PROGRAM_ID_V3, NNI_LP_PROGRAM_ID_V1, AMM_STATE_SEED, CRP_LP_VERSION_V1 } from './ids'
import { closeAccount } from '@project-serum/serum/lib/token-instructions'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

export function getOutAmount(
  market: any,
  asks: any,
  bids: any,
  fromCoinMint: string,
  toCoinMint: string,
  amount: string,
  slippage: number
) {
  const fromAmount = parseFloat(amount)

  let fromMint = fromCoinMint
  let toMint = toCoinMint

  if (fromMint === NATIVE_SOL.mintAddress) {
    fromMint = TOKENS.WSOL.mintAddress
  }
  if (toMint === NATIVE_SOL.mintAddress) {
    toMint = TOKENS.WSOL.mintAddress
  }

  if (fromMint === market.quoteMintAddress.toBase58() && toMint === market.baseMintAddress.toBase58()) {
    // buy
    return forecastBuy(market, asks, fromAmount, slippage)
  } else {
    return forecastSell(market, bids, fromAmount, slippage)
  }
}

export function getSwapOutAmount(
  poolInfo: any,
  fromCoinMint: string,
  toCoinMint: string,
  amount: string,
  slippage: number
){
  const getSwapOutAmount_fcn = (poolInfo.version == CRP_LP_VERSION_V1)? getCropperSwapOutAmount: getRaydiumSwapOutAmount
  return getSwapOutAmount_fcn(poolInfo, fromCoinMint, toCoinMint, amount, slippage);
}

function getCropperSwapOutAmount(
  poolInfo: any,
  fromCoinMint: string,
  toCoinMint: string,
  amount: string,
  slippage: number
) {
  const { coin, pc, fees } = poolInfo

  const { returnFeeNumerator, fixedFeeNumerator, feeDenominator } = fees
  const totalFeeNumerator = returnFeeNumerator + fixedFeeNumerator

  if (fromCoinMint === coin.mintAddress && toCoinMint === pc.mintAddress) {
    // coin2pc
    const fromAmount = new TokenAmount(amount, coin.decimals, false)
    const denominator = coin.balance.wei.plus(fromAmount.wei)
    const amountOut = pc.balance.wei.multipliedBy(fromAmount.wei).dividedBy(denominator)
    const amountOutWithFee = amountOut.dividedBy(feeDenominator).multipliedBy(feeDenominator - totalFeeNumerator)
    const amountOutWithSlippage = amountOutWithFee.dividedBy(1 + slippage / 100)

    const outBalance = pc.balance.wei.minus(amountOut)
    const beforePrice = new TokenAmount(
      parseFloat(new TokenAmount(pc.balance.wei, pc.decimals).fixed()) /
        parseFloat(new TokenAmount(coin.balance.wei, coin.decimals).fixed()),
      pc.decimals,
      false
    )
    const afterPrice = new TokenAmount(
      parseFloat(new TokenAmount(outBalance, pc.decimals).fixed()) /
        parseFloat(new TokenAmount(denominator, coin.decimals).fixed()),
      pc.decimals,
      false
    )
    const priceImpact =
      ((parseFloat(beforePrice.fixed()) - parseFloat(afterPrice.fixed())) / parseFloat(beforePrice.fixed())) * 100

    return {
      amountIn: fromAmount,
      amountOut: new TokenAmount(amountOutWithFee, pc.decimals),
      amountOutWithSlippage: new TokenAmount(amountOutWithSlippage, pc.decimals),
      priceImpact
    }
  } else {
    // pc2coin
    const fromAmount = new TokenAmount(amount, pc.decimals, false)
    const denominator = pc.balance.wei.plus(fromAmount.wei)
    const amountOut = coin.balance.wei.multipliedBy(fromAmount.wei).dividedBy(denominator)
    const amountOutWithFee = amountOut.dividedBy(feeDenominator).multipliedBy(feeDenominator - totalFeeNumerator)
    const amountOutWithSlippage = amountOutWithFee.dividedBy(1 + slippage / 100)

    const outBalance = coin.balance.wei.minus(amountOut)

    const beforePrice = new TokenAmount(
      parseFloat(new TokenAmount(pc.balance.wei, pc.decimals).fixed()) /
        parseFloat(new TokenAmount(coin.balance.wei, coin.decimals).fixed()),
      pc.decimals,
      false
    )
    const afterPrice = new TokenAmount(
      parseFloat(new TokenAmount(denominator, pc.decimals).fixed()) /
        parseFloat(new TokenAmount(outBalance, coin.decimals).fixed()),
      pc.decimals,
      false
    )
    const priceImpact =
      ((parseFloat(afterPrice.fixed()) - parseFloat(beforePrice.fixed())) / parseFloat(beforePrice.fixed())) * 100

    return {
      amountIn: fromAmount,
      amountOut: new TokenAmount(amountOutWithFee, coin.decimals),
      amountOutWithSlippage: new TokenAmount(amountOutWithSlippage, coin.decimals),
      priceImpact
    }
  }
}

function getRaydiumSwapOutAmount(
  poolInfo: any,
  fromCoinMint: string,
  toCoinMint: string,
  amount: string,
  slippage: number
) {
  const { coin, pc, fees } = poolInfo
  const { swapFeeNumerator, swapFeeDenominator } = fees

  if (fromCoinMint === coin.mintAddress && toCoinMint === pc.mintAddress) {
    // coin2pc
    const fromAmount = new TokenAmount(amount, coin.decimals, false)
    const denominator = coin.balance.wei.plus(fromAmount.wei)
    const amountOut = pc.balance.wei.multipliedBy(fromAmount.wei).dividedBy(denominator)
    const amountOutWithFee = amountOut.dividedBy(swapFeeDenominator).multipliedBy(swapFeeDenominator - swapFeeNumerator)
    const amountOutWithSlippage = amountOutWithFee.dividedBy(1 + slippage / 100)

    const outBalance = pc.balance.wei.minus(amountOut)
    const beforePrice = new TokenAmount(
      parseFloat(new TokenAmount(pc.balance.wei, pc.decimals).fixed()) /
        parseFloat(new TokenAmount(coin.balance.wei, coin.decimals).fixed()),
      pc.decimals,
      false
    )
    const afterPrice = new TokenAmount(
      parseFloat(new TokenAmount(outBalance, pc.decimals).fixed()) /
        parseFloat(new TokenAmount(denominator, coin.decimals).fixed()),
      pc.decimals,
      false
    )
    const priceImpact =
      ((parseFloat(beforePrice.fixed()) - parseFloat(afterPrice.fixed())) / parseFloat(beforePrice.fixed())) * 100

    return {
      amountIn: fromAmount,
      amountOut: new TokenAmount(amountOutWithFee, pc.decimals),
      amountOutWithSlippage: new TokenAmount(amountOutWithSlippage, pc.decimals),
      priceImpact
    }
  } else {
    // pc2coin
    const fromAmount = new TokenAmount(amount, pc.decimals, false)
    const denominator = pc.balance.wei.plus(fromAmount.wei)
    const amountOut = coin.balance.wei.multipliedBy(fromAmount.wei).dividedBy(denominator)
    const amountOutWithFee = amountOut.dividedBy(swapFeeDenominator).multipliedBy(swapFeeDenominator - swapFeeNumerator)
    const amountOutWithSlippage = amountOutWithFee.dividedBy(1 + slippage / 100)

    const outBalance = coin.balance.wei.minus(amountOut)

    const beforePrice = new TokenAmount(
      parseFloat(new TokenAmount(pc.balance.wei, pc.decimals).fixed()) /
        parseFloat(new TokenAmount(coin.balance.wei, coin.decimals).fixed()),
      pc.decimals,
      false
    )
    const afterPrice = new TokenAmount(
      parseFloat(new TokenAmount(denominator, pc.decimals).fixed()) /
        parseFloat(new TokenAmount(outBalance, coin.decimals).fixed()),
      pc.decimals,
      false
    )
    const priceImpact =
      ((parseFloat(afterPrice.fixed()) - parseFloat(beforePrice.fixed())) / parseFloat(beforePrice.fixed())) * 100

    return {
      amountIn: fromAmount,
      amountOut: new TokenAmount(amountOutWithFee, coin.decimals),
      amountOutWithSlippage: new TokenAmount(amountOutWithSlippage, coin.decimals),
      priceImpact
    }
  }
}


export function forecastBuy(market: any, orderBook: any, pcIn: any, slippage: number) {
  let coinOut = 0
  let bestPrice = null
  let worstPrice = 0
  let availablePc = pcIn

  for (const { key, quantity } of orderBook.items(false)) {
    const price = market?.priceLotsToNumber(key.ushrn(64)) || 0
    const size = market?.baseSizeLotsToNumber(quantity) || 0

    if (!bestPrice && price !== 0) {
      bestPrice = price
    }

    const orderPcVaule = price * size
    worstPrice = price

    if (orderPcVaule >= availablePc) {
      coinOut += availablePc / price
      availablePc = 0
      break
    } else {
      coinOut += size
      availablePc -= orderPcVaule
    }
  }

  coinOut = coinOut * 0.993

  const priceImpact = ((worstPrice - bestPrice) / bestPrice) * 100

  worstPrice = (worstPrice * (100 + slippage)) / 100
  const amountOutWithSlippage = (coinOut * (100 - slippage)) / 100

  // const avgPrice = (pcIn - availablePc) / coinOut;
  const maxInAllow = pcIn - availablePc

  return {
    side: 'buy',
    maxInAllow,
    amountOut: coinOut,
    amountOutWithSlippage,
    worstPrice,
    priceImpact
  }
}

export function forecastSell(market: any, orderBook: any, coinIn: any, slippage: number) {
  let pcOut = 0
  let bestPrice = null
  let worstPrice = 0
  let availableCoin = coinIn

  for (const { key, quantity } of orderBook.items(true)) {
    const price = market.priceLotsToNumber(key.ushrn(64)) || 0
    const size = market?.baseSizeLotsToNumber(quantity) || 0

    if (!bestPrice && price !== 0) {
      bestPrice = price
    }

    worstPrice = price

    if (availableCoin <= size) {
      pcOut += availableCoin * price
      availableCoin = 0
      break
    } else {
      pcOut += price * size
      availableCoin -= size
    }
  }

  pcOut = pcOut * 0.993

  const priceImpact = ((bestPrice - worstPrice) / bestPrice) * 100

  worstPrice = (worstPrice * (100 - slippage)) / 100
  const amountOutWithSlippage = (pcOut * (100 - slippage)) / 100

  // const avgPrice = pcOut / (coinIn - availableCoin);
  const maxInAllow = coinIn - availableCoin

  return {
    side: 'sell',
    maxInAllow,
    amountOut: pcOut,
    amountOutWithSlippage,
    worstPrice,
    priceImpact
  }
}

export async function wrap(
  axios: any,
  connection: Connection,
  wallet: any,
  fromCoinMint: string,
  toCoinMint: string,
  fromTokenAccount: string,
  toTokenAccount: string,
  amount: string
) {
  const transaction = new Transaction()
  const signers: Account[] = []

  const owner = wallet.publicKey

  const fromCoin = getTokenByMintAddress(fromCoinMint)
  const amountOut = new TokenAmount(amount, fromCoin?.decimals, false)

  const newFromTokenAccount = await createAssociatedTokenAccountIfNotExist(
    fromTokenAccount,
    owner,
    fromCoinMint,
    transaction
  )
  const newToTokenAccount = await createAssociatedTokenAccountIfNotExist(toTokenAccount, owner, toCoinMint, transaction)

  const solletRes = await axios.post('https://swap.sollet.io/api/swap_to', {
    address: newToTokenAccount.toString(),
    blockchain: 'sol',
    coin: toCoinMint,
    size: 1,
    wusdtToUsdt: true
  })
  const { address, maxSize } = solletRes.result

  if (!address) {
    throw new Error('Unwrap not available now')
  }

  if (parseFloat(amount) > maxSize) {
    throw new Error(`Max allow ${maxSize}`)
  }

  transaction.add(transfer(newFromTokenAccount, new PublicKey(address), owner, getBigNumber(amountOut.toWei())))
  transaction.add(memoInstruction(newToTokenAccount.toString()))

  return await sendTransaction(connection, wallet, transaction, signers)
}

async function getTokenBalance(connection:any, tokenAccount:string){
  let info = await connection.getAccountInfo(new PublicKey(tokenAccount), commitment)
  const data = Buffer.from(info.data)
  let parsed = ACCOUNT_LAYOUT.decode(data)
  return parsed.amount
}

export async function unwrapWsol(
  connection: Connection,
  wallet: any,
  wsolAccount: any,
) {
  if (!wsolAccount) throw new Error('No any WSOL account')

  const transaction = new Transaction()
  const signers: Account[] = []

  const owner = wallet?.publicKey

  transaction.add(
    closeAccount({
      source: new PublicKey(wsolAccount),
      destination: owner,
      owner
    })
  )

  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function prepareTwoStepSwap(
  connection: Connection,
  wallet: any,
  fromMint: string,
  fromTokenAccount: string,
  middleMint: string,
  middleTokenAccount: string,
  toMint: string,
  toTokenAccount: string,
  needWrapAmount: number
) {
  const transaction = new Transaction()
  const signers: Account[] = []
  const owner = wallet.publicKey
  console.log('needWrapAmount:', needWrapAmount)
  if (fromMint === TOKENS.WSOL.mintAddress || fromMint === NATIVE_SOL.mintAddress) {
    await createAtaSolIfNotExistAndWrap(connection, fromTokenAccount, owner, transaction, signers, needWrapAmount)
  }
  if (middleMint === NATIVE_SOL.mintAddress) middleMint = TOKENS.WSOL.mintAddress
  if (toMint === NATIVE_SOL.mintAddress) toMint = TOKENS.WSOL.mintAddress

  await createAssociatedTokenAccountIfNotExist(middleTokenAccount, owner, middleMint, transaction)

  await createAssociatedTokenAccountIfNotExist(toTokenAccount, owner, toMint, transaction)

  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function twoStepSwap(
  connection: Connection,
  wallet: any,
  fromPoolInfo: any,
  toPoolInfo: any,
  fromCoinMint: string,
  midCoinMint: string,
  toCoinMint: string,
  fromTokenAccount: string,
  midTokenAccount:string,
  toTokenAccount: string,
  aIn: string,
  aMid: string,
  wsolAddress:string
)
{

  let transactionAll = new Transaction()
  let signersAll:Account[] = []
  let res = await swap(connection, 
    wallet,
    fromPoolInfo,
    fromCoinMint,
    midCoinMint,
    fromTokenAccount,
    midTokenAccount,
    aIn,
    aMid,
    wsolAddress,
    true
    )
  transactionAll.add(res.transaction)
  signersAll = [...signersAll, ...res.signers]

  res = await swap(connection, 
    wallet,
    toPoolInfo,
    midCoinMint,
    toCoinMint,
    midTokenAccount,
    toTokenAccount,
    aMid,
    '0',
    wsolAddress,
    true
    )
  
  transactionAll.add(res.transaction)
  signersAll = [...signersAll, ...res.signers]

  return await sendTransaction(connection, wallet, transactionAll, signersAll)
}

export async function swap(
  connection: Connection,
  wallet: any,
  poolInfo: any,
  fromCoinMint: string,
  toCoinMint: string,
  fromTokenAccount: string,
  toTokenAccount: string,
  aIn: string,
  aOut: string,
  wsolAddress: string,
  twoStepSwap: boolean = false
){
  const official = poolInfo.official
  const transaction = new Transaction()
  const signers: Account[] = []

  const owner = wallet.publicKey

  const from = getTokenByMintAddress(fromCoinMint)
  const to = getTokenByMintAddress(toCoinMint)
  if (!from || !to) {
    throw new Error('Miss token info')
  }
  // @ts-ignore
  const amountIn = new TokenAmount(aIn, from.decimals, false)
  // @ts-ignore
  const amountOut = new TokenAmount(aOut, to.decimals, false)

  let fromMint = fromCoinMint
  let toMint = toCoinMint

  if (fromMint === NATIVE_SOL.mintAddress) fromMint = TOKENS.WSOL.mintAddress
  if (toMint === NATIVE_SOL.mintAddress) toMint = TOKENS.WSOL.mintAddress

  let wrappedSolAccount: PublicKey | null = null
  let wrappedSolAccount2: PublicKey | null = null
  let newFromTokenAccount = PublicKey.default
  let newToTokenAccount = PublicKey.default 
  if(twoStepSwap == false)
  {
    console.log(fromCoinMint, wsolAddress)
    if(fromCoinMint === NATIVE_SOL.mintAddress && wsolAddress) {
      transaction.add(
        closeAccount({
          source: new PublicKey(wsolAddress),
          destination: owner,
          owner
        })
      )
    }
    if (fromCoinMint === NATIVE_SOL.mintAddress ) {
      wrappedSolAccount = await createTokenAccountIfNotExist(
        connection,
        null,
        owner,
        TOKENS.WSOL.mintAddress,
        getBigNumber(amountIn.wei) + 1e7,
        transaction,
        signers
      )
    }
    else{
      newFromTokenAccount = await createAssociatedTokenAccountIfNotExist(fromTokenAccount, owner, fromMint, transaction)
    }
    if (toCoinMint === NATIVE_SOL.mintAddress) {
      wrappedSolAccount2 = await createTokenAccountIfNotExist(
        connection,
        null,
        owner,
        TOKENS.WSOL.mintAddress,
        1e7,
        transaction,
        signers
      )
    }
    else{
      newToTokenAccount = await createAssociatedTokenAccountIfNotExist(toTokenAccount, owner, toMint, transaction)
    }
  }
  else
  {
    newFromTokenAccount = new PublicKey(fromTokenAccount)
    newToTokenAccount = new PublicKey(toTokenAccount)
  }

  if(poolInfo.version == 4){
    transaction.add(
      swapInstruction_v4(
        new PublicKey(poolInfo.programId),
        new PublicKey(poolInfo.ammId),
        new PublicKey(poolInfo.ammAuthority),
        new PublicKey(poolInfo.ammOpenOrders),
        new PublicKey(poolInfo.ammTargetOrders),
        new PublicKey(poolInfo.poolCoinTokenAccount),
        new PublicKey(poolInfo.poolPcTokenAccount),
        new PublicKey(poolInfo.serumProgramId),
        new PublicKey(poolInfo.serumMarket),
        new PublicKey(poolInfo.serumBids),
        new PublicKey(poolInfo.serumAsks),
        new PublicKey(poolInfo.serumEventQueue),
        new PublicKey(poolInfo.serumCoinVaultAccount),
        new PublicKey(poolInfo.serumPcVaultAccount),
        new PublicKey(poolInfo.serumVaultSigner),
        wrappedSolAccount ?? newFromTokenAccount,
        wrappedSolAccount2 ?? newToTokenAccount,
        owner,
        Math.floor(getBigNumber(amountIn.toWei())),
        Math.floor(getBigNumber(amountOut.toWei()))
      )
    )
  }
  else{
      
    const stateId = await getAMMGlobalStateAddress(official);
    const state_info = await getAMMGlobalStateAccount(connection, official);
    console.log("state_info", state_info)
    let feeTokenAccount = await getOneFilteredTokenAccountsByOwner(connection, state_info.feeOwner, new PublicKey(fromMint))
    let normal_dir = (fromCoinMint == poolInfo.coin.mintAddress)
    let poolFromAccount = normal_dir? poolInfo.poolCoinTokenAccount: poolInfo.poolPcTokenAccount
    let poolToAccount = normal_dir? poolInfo.poolPcTokenAccount: poolInfo.poolCoinTokenAccount

    feeTokenAccount = (await createAssociatedTokenAccountIfNotExist2(
                                        feeTokenAccount, 
                                        state_info.feeOwner, 
                                        owner,  
                                        fromMint, 
                                        transaction)).toString()

    transaction.add(
      official ? swapInstruction_v5(
        new PublicKey(poolInfo.ammId),
        new PublicKey(poolInfo.ammAuthority),
        
        owner,
        stateId,
        
        wrappedSolAccount ?? newFromTokenAccount,
        new PublicKey(poolFromAccount),
        new PublicKey(poolToAccount),
        wrappedSolAccount2 ?? newToTokenAccount,
        
        new PublicKey(poolInfo.lp.mintAddress),
        
        new PublicKey(feeTokenAccount),
        
        new PublicKey(poolInfo.programId),
        TOKEN_PROGRAM_ID,
        
        Math.floor(getBigNumber(amountIn.toWei())),
        Math.floor(getBigNumber(amountOut.toWei())),
        state_info.feeOwner
      )
      :
      swapInstruction_v5_NonOfficial(
        new PublicKey(poolInfo.ammId),
        new PublicKey(poolInfo.ammAuthority),
        
        owner,
        stateId,
        
        wrappedSolAccount ?? newFromTokenAccount,
        new PublicKey(poolFromAccount),
        new PublicKey(poolToAccount),
        wrappedSolAccount2 ?? newToTokenAccount,
        
        new PublicKey(poolInfo.lp.mintAddress),
        
        new PublicKey(feeTokenAccount),
        
        new PublicKey(poolInfo.programId),
        TOKEN_PROGRAM_ID,
        
        Math.floor(getBigNumber(amountIn.toWei())),
        Math.floor(getBigNumber(amountOut.toWei())),
        state_info.feeOwner
      )
    )
  }

  if (wrappedSolAccount) {
    transaction.add(
      closeAccount({
        source: wrappedSolAccount,
        destination: owner,
        owner
      })
    )
  }
  if (wrappedSolAccount2) {
    transaction.add(
      closeAccount({
        source: wrappedSolAccount2,
        destination: owner,
        owner
      })
    )
  }
  if(twoStepSwap){
    return {
      transaction, 
      signers
    }
  }
  else
  {
    return await sendTransaction(connection, wallet, transaction, signers)
  }
}

export async function place(
  connection: Connection,
  wallet: any,
  market: Market,
  asks: any,
  bids: any,
  fromCoinMint: string,
  toCoinMint: string,
  fromTokenAccount: string,
  toTokenAccount: string,
  amount: string,
  slippage: number
) {
  const forecastConfig = getOutAmount(market, asks, bids, fromCoinMint, toCoinMint, amount, slippage)

  const transaction = new Transaction()
  const signers: Account[] = []

  const owner = wallet.publicKey

  const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(connection, owner, 0)

  // const useFeeDiscountPubkey: PublicKey | null
  const openOrdersAddress: PublicKey = await createProgramAccountIfNotExist(
    connection,
    // @ts-ignore
    openOrdersAccounts.length === 0 ? null : openOrdersAccounts[0].address.toBase58(),
    owner,
    new PublicKey(SERUM_PROGRAM_ID_V3),
    null,
    _OPEN_ORDERS_LAYOUT_V2,
    transaction,
    signers
  )

  let wrappedSolAccount: PublicKey | null = null

  if (fromCoinMint === NATIVE_SOL.mintAddress) {
    let lamports
    if (forecastConfig.side === 'buy') {
      lamports = Math.round(forecastConfig.worstPrice * forecastConfig.amountOut * 1.01 * LAMPORTS_PER_SOL)
      if (openOrdersAccounts.length > 0) {
        lamports -= getBigNumber(openOrdersAccounts[0].quoteTokenFree)
      }
    } else {
      lamports = Math.round(forecastConfig.maxInAllow * LAMPORTS_PER_SOL)
      if (openOrdersAccounts.length > 0) {
        lamports -= getBigNumber(openOrdersAccounts[0].baseTokenFree)
      }
    }
    lamports = Math.max(lamports, 0) + 1e7

    wrappedSolAccount = await createTokenAccountIfNotExist(
      connection,
      null,
      owner,
      TOKENS.WSOL.mintAddress,
      lamports,
      transaction,
      signers
    )
  }

  const params = {
    owner,
    payer: wrappedSolAccount ?? new PublicKey(fromTokenAccount),
    side: forecastConfig.side as ("buy" | "sell"),
    price: forecastConfig.worstPrice,
    size: parseFloat((forecastConfig.side === 'buy' ? forecastConfig.amountOut: forecastConfig.maxInAllow).toFixed(6)),
    orderType: 'limit' as ("ioc" | "limit" | "postOnly"),
    openOrdersAddressKey: openOrdersAddress,
    feeDiscountPubkey: null
  }

  let {
    transaction: placeOrderTx,
    signers: placeOrderSigners,
  } = await market.makePlaceOrderTransaction(
    connection,
    params,
    120_000,
    120_000,
  );
  const matchOrderstransaction = market.makeMatchOrdersTransaction(5);
  transaction.add(matchOrderstransaction);
  transaction.add(placeOrderTx);
  transaction.add(market.makeMatchOrdersTransaction(5));
  signers.push(...placeOrderSigners);

  if (wrappedSolAccount) {
    transaction.add(
      closeAccount({
        source: wrappedSolAccount,
        destination: owner,
        owner
      })
    )
  }
  //need to remove on mainnet
  if(openOrdersAccounts.length == 0)
  {
    return await sendTransaction(connection, wallet, mergeTransactions([transaction]), [
      ...signers
    ])
  }

  let fromMint = fromCoinMint
  let toMint = toCoinMint

  if (fromMint === NATIVE_SOL.mintAddress) {
    fromMint = TOKENS.WSOL.mintAddress
  }
  if (toMint === NATIVE_SOL.mintAddress) {
    toMint = TOKENS.WSOL.mintAddress
  }

  const newFromTokenAccount = await createAssociatedTokenAccountIfNotExist(
    fromTokenAccount,
    owner,
    fromMint,
    transaction
  )
  const newToTokenAccount = await createAssociatedTokenAccountIfNotExist(
    toTokenAccount, 
    owner, 
    toMint, 
    transaction
  )

  const userAccounts = [newFromTokenAccount, newToTokenAccount]
  if (market.baseMintAddress.toBase58() === toMint && market.quoteMintAddress.toBase58() === fromMint) {
    userAccounts.reverse()
  }
  const baseTokenAccount = userAccounts[0]
  const quoteTokenAccount = userAccounts[1]

  let referrerQuoteWallet: PublicKey | null = null
  if (market.supportsReferralFees) {
    const quoteToken = getTokenByMintAddress(market.quoteMintAddress.toBase58())
    if (quoteToken?.referrer) {
      referrerQuoteWallet = new PublicKey(quoteToken?.referrer)
    }
  }

  const settleTransactions = await market.makeSettleFundsTransaction(
    connection,
    new OpenOrders(openOrdersAddress, { owner }, new PublicKey(SERUM_PROGRAM_ID_V3)),
    baseTokenAccount,
    quoteTokenAccount,
    referrerQuoteWallet
  )

  return await sendTransaction(connection, wallet, mergeTransactions([transaction, settleTransactions.transaction]), [
    ...signers,
    ...settleTransactions.signers
  ])
}

export function swapInstruction_v4(
  programId: PublicKey,
  // tokenProgramId: PublicKey,
  // amm
  ammId: PublicKey,
  ammAuthority: PublicKey,
  ammOpenOrders: PublicKey,
  ammTargetOrders: PublicKey,
  poolCoinTokenAccount: PublicKey,
  poolPcTokenAccount: PublicKey,
  // serum
  serumProgramId: PublicKey,
  serumMarket: PublicKey,
  serumBids: PublicKey,
  serumAsks: PublicKey,
  serumEventQueue: PublicKey,
  serumCoinVaultAccount: PublicKey,
  serumPcVaultAccount: PublicKey,
  serumVaultSigner: PublicKey,
  // user
  userSourceTokenAccount: PublicKey,
  userDestTokenAccount: PublicKey,
  userOwner: PublicKey,

  amountIn: number,
  minAmountOut: number
): TransactionInstruction {
  const dataLayout = struct([u8('instruction'), nu64('amountIn'), nu64('minAmountOut')])

  const keys = [
    // spl token
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    // amm
    { pubkey: ammId, isSigner: false, isWritable: true },
    { pubkey: ammAuthority, isSigner: false, isWritable: false },
    { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
    { pubkey: ammTargetOrders, isSigner: false, isWritable: true },
    { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
    // serum
    { pubkey: serumProgramId, isSigner: false, isWritable: false },
    { pubkey: serumMarket, isSigner: false, isWritable: true },
    { pubkey: serumBids, isSigner: false, isWritable: true },
    { pubkey: serumAsks, isSigner: false, isWritable: true },
    { pubkey: serumEventQueue, isSigner: false, isWritable: true },
    { pubkey: serumCoinVaultAccount, isSigner: false, isWritable: true },
    { pubkey: serumPcVaultAccount, isSigner: false, isWritable: true },
    { pubkey: serumVaultSigner, isSigner: false, isWritable: false },
    { pubkey: userSourceTokenAccount, isSigner: false, isWritable: true },
    { pubkey: userDestTokenAccount, isSigner: false, isWritable: true },
    { pubkey: userOwner, isSigner: true, isWritable: false }
  ]
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: 9,
      amountIn,
      minAmountOut
    },
    data
  )

  return new TransactionInstruction({
    keys,
    programId,
    data
  })
}

export function transfer(source: PublicKey, destination: PublicKey, owner: PublicKey, amount: number) {
  const dataLayout = struct([u8('instruction'), nu64('amount')])

  const keys = [
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false }
  ]

  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: 3,
      amount
    },
    data
  )

  return new TransactionInstruction({
    keys,
    programId: TOKEN_PROGRAM_ID,
    data
  })
}

export function memoInstruction(memo: string) {
  return new TransactionInstruction({
    keys: [],
    data: Buffer.from(memo, 'utf-8'),
    programId: MEMO_PROGRAM_ID
  })
}
export async function checkUnsettledInfo(connection: Connection, wallet: any, market: Market) {
  if (!wallet) return
  const owner = wallet.publicKey
  if (!owner) return
  const openOrderss = await market?.findOpenOrdersAccountsForOwner(connection, owner, 1000)
  if (!openOrderss?.length) return
  const baseTotalAmount = market.baseSplSizeToNumber(openOrderss[0].baseTokenTotal)
  const quoteTotalAmount = market.quoteSplSizeToNumber(openOrderss[0].quoteTokenTotal)
  const baseUnsettledAmount = market.baseSplSizeToNumber(openOrderss[0].baseTokenFree)
  const quoteUnsettledAmount = market.quoteSplSizeToNumber(openOrderss[0].quoteTokenFree)
  return {
    baseSymbol: getTokenByMintAddress(market.baseMintAddress.toString())?.symbol,
    quoteSymbol: getTokenByMintAddress(market.quoteMintAddress.toString())?.symbol,
    baseTotalAmount,
    quoteTotalAmount,
    baseUnsettledAmount,
    quoteUnsettledAmount,
    openOrders: openOrderss[0]
  }
}

export async function settleFund(
  connection: Connection,
  market: Market,
  openOrders: OpenOrders,
  wallet: any,
  baseMint: string,
  quoteMint: string,
  baseWallet: string,
  quoteWallet: string
) {
  const tx = new Transaction()
  const signs: Account[] = []

  const owner = wallet.publicKey

  let wrappedBaseAccount
  let wrappedQuoteAccount

  if (baseMint === TOKENS.WSOL.mintAddress) {
    wrappedBaseAccount = await createTokenAccountIfNotExist(
      connection,
      wrappedBaseAccount,
      owner,
      TOKENS.WSOL.mintAddress,
      1e7,
      tx,
      signs
    )
  }
  if (quoteMint === TOKENS.WSOL.mintAddress) {
    wrappedQuoteAccount = await createTokenAccountIfNotExist(
      connection,
      wrappedQuoteAccount,
      owner,
      TOKENS.WSOL.mintAddress,
      1e7,
      tx,
      signs
    )
  }

  const quoteToken = getTokenByMintAddress(quoteMint)

  const { transaction, signers } = await market.makeSettleFundsTransaction(
    connection,
    openOrders,
    wrappedBaseAccount ?? new PublicKey(baseWallet),
    wrappedQuoteAccount ?? new PublicKey(quoteWallet),
    quoteToken && quoteToken.referrer ? new PublicKey(quoteToken.referrer) : null
  )

  if (wrappedBaseAccount) {
    transaction.add(
      closeAccount({
        source: wrappedBaseAccount,
        destination: owner,
        owner
      })
    )
  }
  if (wrappedQuoteAccount) {
    transaction.add(
      closeAccount({
        source: wrappedQuoteAccount,
        destination: owner,
        owner
      })
    )
  }

  return await sendTransaction(connection, wallet, mergeTransactions([tx, transaction]), [...signs, ...signers])
}



export async function updateGlobalState(
  connection: Connection,
  wallet: any,
){
  
  const transaction = new Transaction()
  const signers: Account[] = []

  const owner = wallet.publicKey

  const swapProgramId = new PublicKey(NNI_LP_PROGRAM_ID_V1)
  const stateId = await getAMMGlobalStateAddress(true);
  const curStateOwner = owner;
  const newStateOwner = owner;
  const feeOwner = owner;

  const feeDenominator = 10000
  const fixedFeeNumerator = 20
  const returnFeeNumerator = 10
  const initialSupply = 1000000000
  const curveType: number = CurveType.ConstantProduct

  transaction.add(
    updateGlobalStateInstruction(
      swapProgramId,
      stateId,
      curStateOwner,
      newStateOwner,
      feeOwner,
      initialSupply,
      returnFeeNumerator,
      fixedFeeNumerator,
      feeDenominator,
      curveType
    )
  )
  return await sendTransaction(connection, wallet, transaction, signers)
}