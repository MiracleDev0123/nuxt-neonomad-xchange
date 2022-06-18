import {
Account,
AccountInfo,
Connection,
PublicKey,
SystemProgram,
Transaction,
SYSVAR_RENT_PUBKEY,
TransactionInstruction
} from '@solana/web3.js'
import { Token, AccountLayout, MintLayout } from "@solana/spl-token";
import { bool, publicKey, struct, u32, u64, u8,  } from '@project-serum/borsh'
import {TOKEN_PROGRAM_ID} from '@/utils/ids'

// @ts-ignore
import { nu64, blob } from 'buffer-layout'

export const LIQUIDITY_TOKEN_PRECISION = 8
export const DEFAULT_DENOMINATOR = 10000

export function createSplAccount(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  accountRentExempt: number,
  mint: PublicKey,
  owner: PublicKey,
  space: number
) {
  const account = new Account();
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: accountRentExempt,
      space,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  instructions.push(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      account.publicKey,
      owner
    )
  );

  return account;
}

export const GLOBAL_STATE_LAYOUT = struct([
  u8("isInitialized"),
  publicKey("stateOwner"),
  publicKey("feeOwner"),

  u64("initialSupply"),
  
  u64('returnFeeNumerator'),
  u64('fixedFeeNumerator'),
  u64('feeDenominator'),
  
  u8('curveType'),
  blob(32, 'curveParameters'),
]);

export const CRP_AMM_LAYOUT_V1 =  struct(
  [
    u8('version'),
    u8('isInitialized'),
    u8('nonce'),
    publicKey('ammId'),
    publicKey('dexProgramId'),
    publicKey('serumMarket'),
    publicKey('tokenProgramId'),
    publicKey('poolCoinTokenAccount'),
    publicKey('poolPcTokenAccount'),
    publicKey('lpMintAddress'),
    publicKey('coinMintAddress'),
    publicKey('pcMintAddress')
  ]
);
export enum CurveType {
  ConstantProduct,
  ConstantPrice,
  Stable,
  Offset
}
export const updateGlobalStateInstruction = (
  swapProgramId: PublicKey,
  stateId: PublicKey,
  curStateOwner: PublicKey,
  newStateOwner: PublicKey,
  feeOwner: PublicKey,
  
  initialSupply: number,
  returnFeeNumerator: number,
  fixedFeeNumerator: number,
  feeDenominator: number,

  curveType: number = CurveType.ConstantProduct,
  curveParameters: number = 0
): TransactionInstruction => {
  const keys = [
    { pubkey: stateId, isSigner: false, isWritable: true },
    { pubkey: curStateOwner, isSigner: true, isWritable: false },
    { pubkey: newStateOwner, isSigner: false, isWritable: false },
    { pubkey: feeOwner, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];
  const commandDataLayout = struct([
    u8("instruction"),
    nu64("initialSupply"),
    nu64("returnFeeNumerator"),
    nu64("fixedFeeNumerator"),
    nu64("feeDenominator"),
    u8('curveType'),
    blob(32, 'curveParameters'),
  ]);
  // package curve parameters
  // NOTE: currently assume all curves take a single parameter, u64 int
  //       the remaining 24 of the 32 bytes available are filled with 0s
  let curveParams = Buffer.from([curveParameters]);
  let curveParamsBuffer = Buffer.alloc(32);
  curveParams.copy(curveParamsBuffer);

  let data = Buffer.alloc(1024);
  {
    const encodeLength = commandDataLayout.encode(
      {
        instruction: 6, // instruction
        initialSupply,
        returnFeeNumerator,
        fixedFeeNumerator,
        feeDenominator,
        curveType,
        curveParameters: curveParamsBuffer,
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const createLiquidityPool = (
  tokenSwapAccount: Account,
  authority: PublicKey,
  stateId:  PublicKey,
  ammId:PublicKey,
  tokenAccountA: PublicKey,
  tokenAccountB: PublicKey,
  tokenPool: PublicKey,
  tokenAccountPool: PublicKey,
  tokenProgramId: PublicKey,
  swapProgramId: PublicKey,
  dexProgramId: PublicKey,
  marketId:PublicKey,
  nonce: number,
  owner:PublicKey,
): TransactionInstruction => {
  const keys = [
    { pubkey: tokenSwapAccount.publicKey, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: stateId, isSigner: false, isWritable: false },
    { pubkey: ammId, isSigner: false, isWritable: false },
    { pubkey: tokenAccountA, isSigner: false, isWritable: false },
    { pubkey: tokenAccountB, isSigner: false, isWritable: false },
    { pubkey: tokenPool, isSigner: false, isWritable: true },
    { pubkey: tokenAccountPool, isSigner: false, isWritable: true },

    { pubkey: marketId, isSigner: false, isWritable: false },

    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    { pubkey: dexProgramId, isSigner: false, isWritable: false },
    { pubkey: owner, isSigner: true, isWritable: false },
  ];

  const commandDataLayout = struct([
    u8("instruction"),
    u8("nonce"),
  ]);
  let data = Buffer.alloc(1024);
  {
    const encodeLength = commandDataLayout.encode(
      {
        instruction: 0, // InitializeSwap instruction
        nonce,
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const depositInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  stateId:  PublicKey,
  sourceA: PublicKey,
  sourceB: PublicKey,
  intoA: PublicKey,
  intoB: PublicKey,
  poolToken: PublicKey,
  poolAccount: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  poolTokenAmount: number,
  maximumTokenA: number,
  maximumTokenB: number
): TransactionInstruction => {
  const dataLayout = struct([
    u8("instruction"),
    nu64("poolTokenAmount"),
    nu64("maximumTokenA"),
    nu64("maximumTokenB"),
  ]);
  let data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 2, // Deposit instruction
      poolTokenAmount,
      maximumTokenA,
      maximumTokenB

    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: stateId, isSigner: false, isWritable: false },
    { pubkey: sourceA, isSigner: false, isWritable: true },
    { pubkey: sourceB, isSigner: false, isWritable: true },
    { pubkey: intoA, isSigner: false, isWritable: true },
    { pubkey: intoB, isSigner: false, isWritable: true },
    { pubkey: poolToken, isSigner: false, isWritable: true },
    { pubkey: poolAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const withdrawInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  stateId:  PublicKey,
  poolMint: PublicKey,
  sourcePoolAccount: PublicKey,
  fromA: PublicKey,
  fromB: PublicKey,
  userAccountA: PublicKey,
  userAccountB: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  poolTokenAmount: number | nu64,
  minimumTokenA: number | nu64,
  minimumTokenB: number | nu64
): TransactionInstruction => {
  const dataLayout = struct([
    u8("instruction"),
    nu64("poolTokenAmount"),
    nu64("minimumTokenA"),
    nu64("minimumTokenB"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 3, // Withdraw instruction
      poolTokenAmount: poolTokenAmount,
      minimumTokenA: minimumTokenA,
      minimumTokenB: minimumTokenB,
    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: false, isWritable: false },
    { pubkey: stateId, isSigner: false, isWritable: false },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: sourcePoolAccount, isSigner: false, isWritable: true },
    { pubkey: fromA, isSigner: false, isWritable: true },
    { pubkey: fromB, isSigner: false, isWritable: true },
    { pubkey: userAccountA, isSigner: false, isWritable: true },
    { pubkey: userAccountB, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const swapInstruction_v5 = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  stateId:  PublicKey,
  userSource: PublicKey,
  poolSource: PublicKey,
  poolDestination: PublicKey,
  userDestination: PublicKey,
  poolMint: PublicKey,
  feeTokenAccount: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  amountIn: number | nu64,
  minimumAmountOut: number | nu64,
  feeOwner: PublicKey
): TransactionInstruction => {
  const dataLayout = struct([
    u8("instruction"),
    nu64("amountIn"),
    nu64("minimumAmountOut"),
  ]);
  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },

    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: stateId, isSigner: false, isWritable: false },
    
    { pubkey: userSource, isSigner: false, isWritable: true },
    { pubkey: poolSource, isSigner: false, isWritable: true },
    { pubkey: poolDestination, isSigner: false, isWritable: true },
    { pubkey: userDestination, isSigner: false, isWritable: true },
    
    { pubkey: poolMint, isSigner: false, isWritable: true },
    
    { pubkey: feeTokenAccount, isSigner: false, isWritable: true },
    { pubkey: feeOwner, isSigner: false, isWritable: true },

    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  // optional depending on the build of token-swap program
  // if (programOwner) {
  //   keys.push({ pubkey: programOwner, isSigner: false, isWritable: true });
  // }

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 1, // Swap instruction
      amountIn,
      minimumAmountOut,
    },
    data
  );

  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const swapInstruction_v5_NonOfficial = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userTransferAuthority: PublicKey,
  stateId:  PublicKey,
  userSource: PublicKey,
  poolSource: PublicKey,
  poolDestination: PublicKey,
  userDestination: PublicKey,
  poolMint: PublicKey,
  feeTokenAccount: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  amountIn: number | nu64,
  minimumAmountOut: number | nu64,
  feeOwner: PublicKey
): TransactionInstruction => {
  const dataLayout = struct([
    u8("instruction"),
    nu64("amountIn"),
    nu64("minimumAmountOut"),
  ]);
  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },

    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: stateId, isSigner: false, isWritable: false },
    
    { pubkey: userSource, isSigner: false, isWritable: true },
    { pubkey: poolSource, isSigner: false, isWritable: true },
    { pubkey: poolDestination, isSigner: false, isWritable: true },
    { pubkey: userDestination, isSigner: false, isWritable: true },
    
    { pubkey: poolMint, isSigner: false, isWritable: true },
    
    { pubkey: feeTokenAccount, isSigner: false, isWritable: true },

    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];

  // optional depending on the build of token-swap program
  // if (programOwner) {
  //   keys.push({ pubkey: programOwner, isSigner: false, isWritable: true });
  // }

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 1, // Swap instruction
      amountIn,
      minimumAmountOut,
    },
    data
  );

  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};
  