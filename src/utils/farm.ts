import {Buffer} from 'buffer';
import { bool, publicKey, u32,struct,  u64, u8, u128} from '@project-serum/borsh'
// @ts-ignore
import { nu64, nu128 } from 'buffer-layout'
import {Connection, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY} from '@solana/web3.js';
import {
  Account,
  AccountInfo,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import {sendAndConfirmTransaction} from './send-and-confirm-transaction';
import {loadAccount} from './account';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createSplAccount } from './nni-swap';
import { createAssociatedTokenAccountIfNotExist, createProgramAccountIfNotExist, sendTransaction } from './web3';
import { FARM_INITIAL_FEE_OWNER, FARM_PROGRAM_ID, NNI_LP_PROGRAM_ID_V1, SYSTEM_PROGRAM_ID, FARM_VERSION, DEVNET_MODE } from './ids';
import { FarmInfo } from './farms';
import { getBigNumber } from './layouts';
import { TokenAmount } from './safe-math';
import { TOKENS } from './tokens';

export const PAY_FARM_FEE = 5000;
export const REWARD_MULTIPLER = 1000000000;
export const FARM_PREFIX = "cropperfarm";
export const LOCKED_TOKENA_LIST = [
  "CRP",
  "USDC",
  "USDT",
  "SOL",
  "ETH"
]
export const ALLOWED_TOKENB_LIST = [
  "CRP",
  "USDC",
  "USDT",
]
enum FarmInstruction
{
  SetProgramData = 0,
  InitializeFarm,
  Deposit,
  Withdraw,
  AddReward,
  PayFarmFee,
  RemoveRewards
}
export const FarmProgramAccountLayout = struct([
  u8('version'),
  publicKey('super_owner'),
  publicKey('fee_owner'),
  publicKey('allowed_creator'),
  publicKey('amm_program_id'),
  u64('farm_fee'),
  u64('harvest_fee_numerator'),
  u64('harvest_fee_denominator'),
  u64('reward_multipler'),
]);
export const FarmAccountLayout =  struct([
  u8('is_allowed'),
  u8('nonce'),
  publicKey('pool_lp_token_account'),
  publicKey('pool_reward_token_account'),
  publicKey('pool_mint_address'),
  publicKey('reward_mint_address'), 
  publicKey('token_program_id'),
  publicKey('owner'),
  u128('reward_per_share_net'),
  u64('last_timestamp'),
  u64('reward_per_timestamp_or_remained_reward_amount'),
  u64('start_timestamp'),
  u64('end_timestamp'),
])
;
export const UserInfoAccountLayout = struct([
  publicKey('wallet'),
  publicKey('farm_id'),
  u64('deposit_balance'),
  u64('reward_debt'),
]);



export function getPcBalance(poolInfo: any) {
  return parseFloat(new TokenAmount(poolInfo.pc.balance.wei, poolInfo.pc.decimals).toEther().toString())
}

export function getCoinBalance(poolInfo: any) {
  return parseFloat(new TokenAmount(poolInfo.coin.balance.wei, poolInfo.coin.decimals).toEther().toString())
}

export function getTotalSupply(poolInfo: any) {
  return parseFloat(new TokenAmount(poolInfo.lp.totalSupply.wei, poolInfo.lp.totalSupply.decimals).toEther().toString())
}


/**
 * Yield Farm class
 */
 export class FarmProgram {
  constructor(
    public version:number,
    public superOwner: PublicKey,
    public feeOwner: PublicKey,
    public allowedCreator: PublicKey,
    public ammProgramId:PublicKey,
    public farmFee: nu64,
    public harvestFeeNumerator: nu64,
    public harvestFeeDenominator: nu64,
    public rewardMultipler: nu64,
  ) {
    this.version = version;
    this.superOwner = superOwner;
    this.feeOwner = feeOwner;
    this.allowedCreator = allowedCreator;
    this.ammProgramId = ammProgramId;
    this.farmFee = farmFee;
    this.harvestFeeNumerator = harvestFeeNumerator;
    this.harvestFeeDenominator = harvestFeeDenominator;
    this.rewardMultipler = rewardMultipler;
  }

  static async loadProgramAccount(connection:Connection){
    const farmProgramId = new PublicKey(FARM_PROGRAM_ID);
    const seeds = [Buffer.from(FARM_PREFIX),farmProgramId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, farmProgramId);

    const data = await loadAccount(connection, programAccount, farmProgramId);
    const programData = FarmProgramAccountLayout.decode(data);
    
    
    let result = new FarmProgram(
      programData.version,
      programData.super_owner,
      programData.fee_owner,
      programData.allowed_creator,
      programData.amm_program_id,
      programData.farm_fee,
      programData.harvest_fee_numerator,
      programData.harvest_fee_denominator,
      programData.reward_multipler,
    );
    return result;
  }
  /**
   * Get the minimum balance for the farm account to be rent exempt
   *
   * @return Number of lamports required
   */
  static async getMinBalanceRentForExempt(
    connection: Connection,
  ): Promise<number> {
    return await connection.getMinimumBalanceForRentExemption(
      FarmProgramAccountLayout.span,
    );
  }
  static createSetProgramDataInstruction(
    programDataKey: PublicKey, 
    owner: Account, 
    superOwner: PublicKey,
    feeOwner: PublicKey,
    allowedCreator: PublicKey,
    ammProgramId: PublicKey,
    farmFee: number,
    harvestFeeNumerator: number,
    harvestFeeDenominator: number,
    farmProgramId: PublicKey,
  ): TransactionInstruction {
    const keys = [
      {pubkey: programDataKey, isSigner: false, isWritable: true},
      {pubkey: owner.publicKey, isSigner: true, isWritable: true},
      {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
      {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false},
      
    ];
    const commandDataLayout = struct([
      u8('instruction'),
      publicKey('super_owner'),
      publicKey('fee_owner'),
      publicKey('allowed_creator'),
      publicKey('amm_program_id'),
      nu64("farm_fee"),
      nu64("harvest_fee_numerator"),
      nu64("harvest_fee_denominator"),
    ]); 
    let data = Buffer.alloc(1024);
    {
      const encodeLength = commandDataLayout.encode(
        {
          instruction: FarmInstruction.SetProgramData, // InitializeFarm instruction
          super_owner:superOwner,
          fee_owner:feeOwner,
          allowed_creator:allowedCreator,
          amm_program_id:ammProgramId,
          farm_fee: farmFee,
          harvest_fee_numerator: harvestFeeNumerator,
          harvest_fee_denominator: harvestFeeDenominator,
        },
        data,
      );
      data = data.slice(0, encodeLength);
    }
    return new TransactionInstruction({
      keys,
      programId: farmProgramId,
      data,
    });
  }

  static async createDefaultProgramData(
    connection: Connection,
    owner: Account,
  ){
    const DEFAULT_SUPER_OWNER = owner.publicKey;
    const DEFAULT_FEE_OWNER = new PublicKey(FARM_INITIAL_FEE_OWNER);
    const DEFAULT_ALLOWED_CREATOR = DEFAULT_SUPER_OWNER;
    const DEFAULT_AMM_PROGRAM_ID = new PublicKey(NNI_LP_PROGRAM_ID_V1);
    const DEFAULT_FARM_FEE = 5000;
    const DEFAULT_HARVEST_FEE_NUMERATOR = 1;
    const DEFAULT_HARVEST_FEE_DENOMINATOR = 1000;
    return await FarmProgram.createOrSetProgramData(
      connection,
      owner,
      DEFAULT_SUPER_OWNER,
      DEFAULT_FEE_OWNER,
      DEFAULT_ALLOWED_CREATOR,
      DEFAULT_AMM_PROGRAM_ID,
      DEFAULT_FARM_FEE,
      DEFAULT_HARVEST_FEE_NUMERATOR,
      DEFAULT_HARVEST_FEE_DENOMINATOR
    )
  }
  static async createOrSetProgramData(
    connection: Connection,
    owner: Account,
    superOwner: PublicKey,
    feeOwner: PublicKey,
    allowedCreator: PublicKey,
    ammProgramId: PublicKey,
    farmFee: number,
    harvestFeeNumerator: number,
    harvestFeeDenominator: number,
  ){
    let farmProgramId = new PublicKey(FARM_PROGRAM_ID);

    const seeds = [Buffer.from(FARM_PREFIX),farmProgramId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, farmProgramId);

    let transaction;
    transaction = new Transaction();

    const instruction = FarmProgram.createSetProgramDataInstruction(
      programAccount,
      owner,
      superOwner,
      feeOwner,
      allowedCreator,
      ammProgramId,
      farmFee,
      harvestFeeNumerator,
      harvestFeeDenominator,
      farmProgramId
    );
    transaction.add(instruction);
    
    let tx = await sendTransaction(connection, owner, transaction, [
    
    ]);
    return tx;
  }

}
export class UserInfo {
  constructor(
    public userInfoId:PublicKey,
    public wallet: PublicKey,
    public farmId: PublicKey,
    public depositBalance:nu64,
    public rewardDebt:nu64,
  ){
    this.wallet = wallet;
    this.farmId = farmId;
    this.depositBalance = depositBalance;
    this.rewardDebt = rewardDebt;
  }
  /**
   * Get the minimum balance for the user info account to be rent exempt
   *
   * @return Number of lamports required
   */
   static async getMinBalanceRentForExemptUserInfo(
    connection: Connection,
  ): Promise<number> {
    return await connection.getMinimumBalanceForRentExemption(
      UserInfoAccountLayout.span,
    );
  }
}
/**
 * Yield Farm class
 */
export class YieldFarm {
  public isAllowed:boolean = false;
  public rewardPerTimestampOrRemainedRewardAmount: nu64 = 0;
  public rewardPerShareNet: nu128 = 0;
  public lastTimestamp: nu64 = 0;

  constructor(
    private connection: Connection,
    public farmId: PublicKey,
    public farmProgramId: PublicKey,
    public tokenProgramId: PublicKey,
    public lpTokenPoolMint: PublicKey,
    public rewardTokenPoolMint: PublicKey,
    public authority: PublicKey,
    public poolRewardTokenAccount: PublicKey,
    public poolLpTokenAccount: PublicKey,
    public nonce: number,
    public startTimestamp: nu64,
    public endTimestamp: nu64,
    public creator: Account,
  ) {
    this.connection = connection;
    this.farmId = farmId;
    this.farmProgramId = farmProgramId;
    this.tokenProgramId = tokenProgramId;
    this.lpTokenPoolMint = lpTokenPoolMint;
    this.rewardTokenPoolMint = rewardTokenPoolMint;
    this.authority = authority;
    this.poolRewardTokenAccount = poolRewardTokenAccount;
    this.poolLpTokenAccount = poolLpTokenAccount;
    this.nonce = nonce;
    this.startTimestamp = startTimestamp;
    this.endTimestamp = endTimestamp;
    this.creator = creator;
  }

  /**
   * Get the minimum balance for the farm account to be rent exempt
   *
   * @return Number of lamports required
   */
  static async getMinBalanceRentForExemptStakePool(
    connection: Connection,
  ): Promise<number> {
    return await connection.getMinimumBalanceForRentExemption(
      FarmAccountLayout.span,
    );
  }

  static createInitFarmInstruction(
    farmAccount: Account, // farm account 
    authority: PublicKey, //farm authority
    creator: Account,
    poolLpTokenAccount: PublicKey,
    poolRewardTokenAccount: PublicKey,
    poolMintAddress: PublicKey,
    rewardMintAddress: PublicKey,
    ammPubkey: PublicKey,
    nonce: number,
    farmProgramId: PublicKey,
    startTimestamp: number,
    endTimestamp: number,
    programAccount: PublicKey,
  ): TransactionInstruction {
    const keys = [
      {pubkey: farmAccount.publicKey, isSigner: true, isWritable: true},
      {pubkey: authority, isSigner: false, isWritable: false},
      {pubkey: creator.publicKey, isSigner: false, isWritable: false},
      {pubkey: poolLpTokenAccount, isSigner: true, isWritable: true},
      {pubkey: poolRewardTokenAccount, isSigner: true, isWritable: true},
      {pubkey: poolMintAddress, isSigner: false, isWritable: false},
      {pubkey: rewardMintAddress, isSigner: false, isWritable: false},
      {pubkey: ammPubkey, isSigner: false, isWritable: false},
      {pubkey: programAccount, isSigner: false, isWritable: true},
    ];
    
    const commandDataLayout = struct([
      u8('instruction'),
      u8('nonce'),
      nu64("start_timestamp"),
      nu64("end_timestamp"),
    ]); 
    let data = Buffer.alloc(1024);
    {
      const encodeLength = commandDataLayout.encode(
        {
          instruction: FarmInstruction.InitializeFarm, // InitializeFarm instruction
          nonce,
          start_timestamp: startTimestamp,
          end_timestamp: endTimestamp,
        },
        data,
      );
      data = data.slice(0, encodeLength);
    }
    return new TransactionInstruction({
      keys,
      programId: farmProgramId,
      data,
    });
  }
  static async getFilteredProgramAccounts(
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
  static async findUserInfoAccount(
    connection:Connection,
    farmProgramId:PublicKey,
    farmId:PublicKey,
    owner:PublicKey,
  ):Promise<UserInfo>{
    // stake user info account
    const filters = [
      {
        memcmp: {
          offset: 0,
          bytes: owner.toBase58()
        }
      },
      {
        dataSize: UserInfoAccountLayout.span
      }
    ]
    let farmUserAccountInfos = await YieldFarm.getFilteredProgramAccounts(connection, farmProgramId, filters)
    let userInfo:any;
    farmUserAccountInfos.forEach((farmUserAccountInfo) => {
      const { data} = farmUserAccountInfo.accountInfo
      const userInfoData = UserInfoAccountLayout.decode(data)
      const wallet = userInfoData.wallet;
      const _farmId = userInfoData.farmId.toBase58();
      const depositBalance = userInfoData.deposit_balance;
      const rewardDebt = userInfoData.reward_debt
      if(_farmId == farmId.toBase58())
      {
        userInfo = new UserInfo(farmUserAccountInfo.publicKey,wallet,farmId,depositBalance,rewardDebt);
      }
    })
    return userInfo;
  }
  static async findOrCreateUserInfoAccount(
    connection:Connection,
    farmProgramId:PublicKey,
    farmId:PublicKey,
    owner: Account,
  ):Promise<UserInfo> {
    let userInfo = await YieldFarm.findUserInfoAccount(connection,farmProgramId,farmId,owner.publicKey);
    if(userInfo != undefined){
      return userInfo;
    }

    // Allocate memory for the account
    const balanceNeeded = await YieldFarm.getMinBalanceRentForExemptStakePool(
      connection,
    );
    const newAccount = new Account();
    let transaction = new Transaction();
    
    transaction.add(
      SystemProgram.createAccount({ 
        fromPubkey: owner.publicKey,
        newAccountPubkey: newAccount.publicKey,
        lamports: balanceNeeded,
        space: UserInfoAccountLayout.span,
        programId: farmProgramId,
      }),
    );

    await sendAndConfirmTransaction(
      'create UserInfo Account',
      connection,
      transaction,
      owner,
      newAccount,
    );
    return new UserInfo(
      newAccount.publicKey,
      owner.publicKey,
      farmId,
      0,
      0,
    );
  }
  static async loadFarm(
    connection: Connection,
    farmId: PublicKey,
    farmProgramId: PublicKey,
  ): Promise<YieldFarm> {
    const data = await loadAccount(connection, farmId, farmProgramId);
    const farmData = FarmAccountLayout.decode(data);
    const [authority] = await PublicKey.findProgramAddress(
      [farmId.toBuffer()],
      farmProgramId,
    );
    const isAllowed = farmData.is_allowed;
    const nonce: number = farmData.nonce;
    const poolLpTokenAccount = farmData.pool_lp_token_account;
    const poolRewardTokenAccount = farmData.pool_reward_token_account;
    const lpTokenPoolMint = farmData.pool_mint_address;
    const rewardTokenPoolMint = farmData.reward_mint_address;
    const tokenProgramId = farmData.token_program_id;
    const owner = farmData.owner;
    const rewardPerShareNet = farmData.reward_per_share_net;
    const lastTimestamp = farmData.last_timestamp;
    const rewardPerTimestampOrRemainedRewardAmount = farmData.reward_per_timestamp_or_remained_reward_amount;
    const startTimestamp = farmData.start_timestamp;
    const endTimestamp = farmData.end_timestamp;
    const feeOwner = farmData.fee_owner;

    let farm = new YieldFarm(
      connection,
      farmId,
      farmProgramId,
      tokenProgramId,
      lpTokenPoolMint, 
      rewardTokenPoolMint,
      authority, 
      poolRewardTokenAccount, 
      poolLpTokenAccount, 
      nonce, 
      startTimestamp,
      endTimestamp,
      owner
    );
    farm.rewardPerShareNet = rewardPerShareNet;
    farm.lastTimestamp = lastTimestamp;
    farm.rewardPerTimestampOrRemainedRewardAmount = rewardPerTimestampOrRemainedRewardAmount;
    
    if(isAllowed > 0)
    {
      farm.isAllowed = true;
    }
    else{
      farm.isAllowed = false;
    }
    return farm;
  }
  static async createSPLTokenAccount(
    instructions:TransactionInstruction[],
    connection:Connection,
    payer:Account,
    owner:PublicKey,
    mint: PublicKey
  ){
    
    let accountRentExempt = await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
      );
    let newTokenAccount = await createSplAccount(
      instructions,
      payer.publicKey,
      accountRentExempt,
      mint,
      owner,
      AccountLayout.span
    );
    return newTokenAccount;
  }
  static async createFarmWithParams(
    connection:Connection,
    wallet:any,
    rewardMintPubkey:PublicKey,
    lpMintPubkey:PublicKey,
    ammPubkey:PublicKey,
    startTimestamp:number,
    endTimestamp:number,
  ){
    // if(DEVNET_MODE){
    //   endTimestamp = startTimestamp + 300; //temp
    // }
    

    const farmAccount = new Account();
    const farmProgramId = new PublicKey(FARM_PROGRAM_ID);

    let [authority, nonce] = await PublicKey.findProgramAddress(
      [farmAccount.publicKey.toBuffer()],
      farmProgramId,
    );
    return await YieldFarm.createFarm(
      connection,
      farmAccount,
      farmProgramId,
      TOKEN_PROGRAM_ID,
      lpMintPubkey,
      rewardMintPubkey,
      ammPubkey,
      authority,
      nonce,
      startTimestamp,
      endTimestamp,
      wallet
    );
  }
  static async createFarmAndAddRewardWithParams(
    connection:Connection,
    wallet:any,
    rewardMintPubkey:PublicKey,
    lpMintPubkey:PublicKey,
    ammPubkey:PublicKey,
    startTimestamp:number,
    endTimestamp:number,

    userRewardTokenAccount: PublicKey,
    amount: number,
  ){
    const farmAccount = new Account();
    const farmProgramId = new PublicKey(FARM_PROGRAM_ID);

    let [authority, nonce] = await PublicKey.findProgramAddress(
      [farmAccount.publicKey.toBuffer()],
      farmProgramId,
    );
    return await YieldFarm.createFarmAndAddReward(
      connection,
      farmAccount,
      farmProgramId,
      TOKEN_PROGRAM_ID,
      lpMintPubkey,
      rewardMintPubkey,
      ammPubkey,
      authority,
      nonce,
      startTimestamp,
      endTimestamp,
      wallet,

      userRewardTokenAccount,
      amount,
    );
  }
  static async createFarm(
    connection: Connection,
    farmAccount: Account,
    farmProgramId: PublicKey,
    tokenProgramId: PublicKey,
    lpTokenPoolMint: PublicKey,
    rewardTokenPoolMint: PublicKey,
    ammPubkey: PublicKey,
    authority: PublicKey,
    nonce: number,
    startTimestamp:number,
    endTimestamp:number,
    creator: Account,
  ): Promise<YieldFarm> {
    let instructions: TransactionInstruction[] = [];
    
    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    );
    let poolRewardTokenAccount = await createSplAccount(
      instructions,
      creator.publicKey,
      accountRentExempt,
      rewardTokenPoolMint,
      authority,
      AccountLayout.span
    );

    let poolLpTokenAccount = await createSplAccount(
      instructions,
      creator.publicKey,
      accountRentExempt,
      lpTokenPoolMint,
      authority,
      AccountLayout.span
    );

    // Allocate memory for the account
    const balanceNeeded = await YieldFarm.getMinBalanceRentForExemptStakePool(
      connection,
    );
    instructions.push(
      SystemProgram.createAccount({ 
        fromPubkey: creator.publicKey,
        newAccountPubkey: farmAccount.publicKey,
        lamports: balanceNeeded,
        space: FarmAccountLayout.span,
        programId: farmProgramId,
      }),
    );

    
    const seeds = [Buffer.from(FARM_PREFIX),farmProgramId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, farmProgramId);

    const instruction = YieldFarm.createInitFarmInstruction(
      farmAccount,
      authority, 
      creator, 
      poolLpTokenAccount.publicKey,  
      poolRewardTokenAccount.publicKey, 
      lpTokenPoolMint, 
      rewardTokenPoolMint, 
      ammPubkey, 
      nonce, 
      farmProgramId,
      startTimestamp,
      endTimestamp,
      programAccount
    );
    instructions.push(instruction);

    let transaction = new Transaction()
    instructions.forEach((inst)=>{
      transaction.add(inst)
    });

    let tx = await sendTransaction(connection, creator, transaction, [
      poolRewardTokenAccount,
      poolLpTokenAccount,
      farmAccount,
    ]);
    console.log("creating farm txid=",tx);

    //check transation

    const farm = new YieldFarm(
      connection,
      farmAccount.publicKey,
      farmProgramId,
      tokenProgramId,
      lpTokenPoolMint, 
      rewardTokenPoolMint, 
      authority, 
      poolRewardTokenAccount.publicKey, 
      poolLpTokenAccount.publicKey, 
      nonce, 
      startTimestamp,
      endTimestamp,
      creator
    );
    return farm;
  }
  
  
  public async addReward( 
    owner: Account,
    userRewardTokenAccount: PublicKey,
    amount: number,
  ) {
    let transaction;
    transaction = new Transaction();

    const seeds = [Buffer.from(FARM_PREFIX),this.farmProgramId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, this.farmProgramId);

    const instruction = YieldFarm.createAddRewardInstruction(
      this.farmId,
      this.authority,
      owner,
      userRewardTokenAccount,
      this.poolRewardTokenAccount,
      this.poolLpTokenAccount,
      this.lpTokenPoolMint,
      this.tokenProgramId,
      this.farmProgramId,
      amount,
      programAccount
    );
    transaction.add(instruction);
    
      
    let tx = await sendTransaction(this.connection, owner, transaction, [
      
    ]);
    return tx;
  }

  static async createFarmAndAddReward(
    connection: Connection,
    farmAccount: Account,
    farmProgramId: PublicKey,
    tokenProgramId: PublicKey,
    lpTokenPoolMint: PublicKey,
    rewardTokenPoolMint: PublicKey,
    ammPubkey: PublicKey,
    authority: PublicKey,
    nonce: number,
    startTimestamp:number,
    endTimestamp:number,
    creator: Account,
    
    userRewardTokenAccount: PublicKey,
    amount: number,
  ): Promise<YieldFarm> {
    let instructions: TransactionInstruction[] = [];
    
    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    );
    let poolRewardTokenAccount = await createSplAccount(
      instructions,
      creator.publicKey,
      accountRentExempt,
      rewardTokenPoolMint,
      authority,
      AccountLayout.span
    );

    let poolLpTokenAccount = await createSplAccount(
      instructions,
      creator.publicKey,
      accountRentExempt,
      lpTokenPoolMint,
      authority,
      AccountLayout.span
    );

    // Allocate memory for the account
    const balanceNeeded = await YieldFarm.getMinBalanceRentForExemptStakePool(
      connection,
    );
    instructions.push(
      SystemProgram.createAccount({ 
        fromPubkey: creator.publicKey,
        newAccountPubkey: farmAccount.publicKey,
        lamports: balanceNeeded,
        space: FarmAccountLayout.span,
        programId: farmProgramId,
      }),
    );

    
    const seeds = [Buffer.from(FARM_PREFIX),farmProgramId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, farmProgramId);

    const instruction = YieldFarm.createInitFarmInstruction(
      farmAccount,
      authority, 
      creator, 
      poolLpTokenAccount.publicKey,  
      poolRewardTokenAccount.publicKey, 
      lpTokenPoolMint, 
      rewardTokenPoolMint, 
      ammPubkey, 
      nonce, 
      farmProgramId,
      startTimestamp,
      endTimestamp,
      programAccount
    );
    instructions.push(instruction);

    const farm = new YieldFarm(
      connection,
      farmAccount.publicKey,
      farmProgramId,
      tokenProgramId,
      lpTokenPoolMint, 
      rewardTokenPoolMint, 
      authority, 
      poolRewardTokenAccount.publicKey, 
      poolLpTokenAccount.publicKey, 
      nonce, 
      startTimestamp,
      endTimestamp,
      creator
    );

    const addRewardInstruction = YieldFarm.createAddRewardInstruction(
      farm.farmId,
      farm.authority,
      creator,
      userRewardTokenAccount,
      farm.poolRewardTokenAccount,
      farm.poolLpTokenAccount,
      farm.lpTokenPoolMint,
      farm.tokenProgramId,
      farm.farmProgramId,
      amount,
      programAccount
    );
    instructions.push(addRewardInstruction);

    let transaction = new Transaction()
    instructions.forEach((inst)=>{
      transaction.add(inst)
    });

    let tx = await sendTransaction(connection, creator, transaction, [
      poolRewardTokenAccount,
      poolLpTokenAccount,
      farmAccount,
    ]);
    console.log("creating farm txid=",tx);

    //check transation
    return farm;
  }
  
  static createAddRewardInstruction(
    farmId: PublicKey, // farm account 
    authority: PublicKey, //farm authority
    depositor: Account,
    userRewardTokenAccount: PublicKey,
    poolRewardTokenAccount: PublicKey,
    poolLpTokenAccount: PublicKey,
    poolMint: PublicKey,
    tokenProgramId: PublicKey,
    farmProgramId: PublicKey,
    amount: number,
    programAccount: PublicKey,
  ): TransactionInstruction {
    let keys:any[] = [];
    if(FARM_VERSION === 1){
      keys = [
        {pubkey: farmId, isSigner: false, isWritable: true},
        {pubkey: authority, isSigner: false, isWritable: false},
        {pubkey: depositor.publicKey, isSigner: false, isWritable: false},
        {pubkey: userRewardTokenAccount, isSigner: false, isWritable: true},
        {pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true},
        {pubkey: poolMint, isSigner: false, isWritable: true},
        {pubkey: programAccount, isSigner: false, isWritable: true},
        {pubkey: tokenProgramId, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
      ];
    }
    else if(FARM_VERSION >= 2){
      keys = [
        {pubkey: farmId, isSigner: false, isWritable: true},
        {pubkey: authority, isSigner: false, isWritable: false},
        {pubkey: depositor.publicKey, isSigner: false, isWritable: false},
        {pubkey: userRewardTokenAccount, isSigner: false, isWritable: true},
        {pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true},
        {pubkey: poolLpTokenAccount, isSigner: false, isWritable: true},
        {pubkey: poolMint, isSigner: false, isWritable: true},
        {pubkey: programAccount, isSigner: false, isWritable: true},
        {pubkey: tokenProgramId, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
      ];
    }
    const commandDataLayout = struct([
      u8('instruction'),
      nu64('amount'),
    ]); 
    let data = Buffer.alloc(1024);
    {
      const encodeLength = commandDataLayout.encode(
        {
          instruction: FarmInstruction.AddReward, // InitializeFarm instruction
          amount:amount,
        },
        data,
      );
      data = data.slice(0, encodeLength);
    }
    return new TransactionInstruction({
      keys,
      programId: farmProgramId,
      data,
    });
  }
  public async payFarmFee(
    owner: Account,
    userUSDCTokenAccount: PublicKey,
    amount: number,
  ) {

    const programData = await FarmProgram.loadProgramAccount(this.connection);
    let transaction;
    transaction = new Transaction();

    let usdcATA = await YieldFarm.checkWalletATA(this.connection, programData.feeOwner, TOKENS.USDC.mintAddress);
    if(!usdcATA){
      usdcATA = await createAssociatedTokenAccountIfNotExist(
        null,
        programData.feeOwner,
        TOKENS.USDC.mintAddress,
        transaction
      )
    }

    const seeds = [Buffer.from(FARM_PREFIX),this.farmProgramId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, this.farmProgramId);

    const instruction = YieldFarm.createPayFarmFeeInstruction(
      this.farmId,
      this.authority,
      owner,
      userUSDCTokenAccount,
      usdcATA,
      this.tokenProgramId,
      this.farmProgramId,
      amount,
      programAccount
    );
    transaction.add(instruction);

    
    let tx = await sendTransaction(this.connection, owner, transaction, [
      
    ]);
    return tx;
    //check transation
  }
  static createPayFarmFeeInstruction(
    farmId: PublicKey, // farm account 
    authority: PublicKey, //farm authority
    depositor: Account,
    userUSDCTokenAccount: PublicKey,
    ownerFeeAccount: PublicKey,
    tokenProgramId: PublicKey,
    farmProgramId: PublicKey,
    amount: number,
    programAccount: PublicKey,
  ): TransactionInstruction {
    const keys = [
      {pubkey: farmId, isSigner: false, isWritable: true},
      {pubkey: authority, isSigner: false, isWritable: false},
      {pubkey: depositor.publicKey, isSigner: false, isWritable: false},
      {pubkey: userUSDCTokenAccount, isSigner: false, isWritable: true},
      {pubkey: ownerFeeAccount, isSigner: false, isWritable: true},
      {pubkey: programAccount, isSigner: false, isWritable: true},
      {pubkey: tokenProgramId, isSigner: false, isWritable: false},
    ];
    const commandDataLayout = struct([
      u8('instruction'),
      nu64('amount'),
    ]); 
    let data = Buffer.alloc(1024);
    {
      const encodeLength = commandDataLayout.encode(
        {
          instruction: FarmInstruction.PayFarmFee, // InitializeFarm instruction
          amount:amount,
        },
        data,
      );
      data = data.slice(0, encodeLength);
    }
    return new TransactionInstruction({
      keys,
      programId: farmProgramId,
      data,
    });
  }
  public static async  deposit( 
    connection: Connection,
    wallet: any ,
    farmInfo: FarmInfo,
    lpAccount: string | undefined | null,
    rewardAccount: string | undefined | null,
    infoAccount: string | undefined | null,
    amount: string | number
  ) {
    const programData = await FarmProgram.loadProgramAccount(connection);

    const value = getBigNumber(new TokenAmount(amount, farmInfo.lp.decimals, false).wei)
    const transaction = new Transaction()
    const signers: any = []
    const owner = wallet.publicKey
    const programId = new PublicKey(farmInfo.programId)
    const farmId = new PublicKey(farmInfo.poolId)
    const userLpAccount = await createAssociatedTokenAccountIfNotExist(
      lpAccount,
      owner,
      farmInfo.lp.mintAddress,
      transaction
    )

    // if no account, create new one
    const userRewardTokenAccount = await createAssociatedTokenAccountIfNotExist(
      rewardAccount,
      owner,
      farmInfo.reward.mintAddress,
      transaction
    )

    // if no userinfo account, create new one
    
    // const userInfoAccount = await createProgramAccountIfNotExist(
    //   connection,
    //   infoAccount,
    //   owner,
    //   programId,
    //   null,
    //   UserInfoAccountLayout,
    //   transaction,
    //   signers
    // )
    let userInfoKey:any = null;
    if(infoAccount){
      userInfoKey = new PublicKey(infoAccount);
    }
    else{
      if(FARM_VERSION === 1){
        // not fixed multiple stake accounts problem
        userInfoKey = await createProgramAccountIfNotExist(
          connection,
          infoAccount,
          owner,
          programId,
          null,
          UserInfoAccountLayout,
          transaction,
          signers
        );
      }
      else if(FARM_VERSION >= 2){
        const seeds = [Buffer.from(FARM_PREFIX),farmId.toBuffer(),owner.toBuffer()];
        const [foundUserInfoKey] = await PublicKey.findProgramAddress(seeds, programId);
        userInfoKey = foundUserInfoKey;
      }
    }

    const fetchFarm = await YieldFarm.loadFarm(
      connection,
      farmId,
      programId
    )
    let rewardATA = await YieldFarm.checkWalletATA(connection, programData.feeOwner, farmInfo.reward.mintAddress);
    if(!rewardATA){
      rewardATA = await createAssociatedTokenAccountIfNotExist(
        null,
        programData.feeOwner,
        farmInfo.reward.mintAddress,
        transaction
      )
    }

    const seeds = [Buffer.from(FARM_PREFIX),programId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, programId);
    
    const instruction = YieldFarm.createDepositInstruction(
      farmId,
      fetchFarm.authority,
      owner,
      userInfoKey,
      userLpAccount,
      userRewardTokenAccount,
      fetchFarm.poolLpTokenAccount,
      fetchFarm.poolRewardTokenAccount,
      fetchFarm.lpTokenPoolMint,
      rewardATA,
      TOKEN_PROGRAM_ID,
      programId,
      value,
      programAccount
    );
    transaction.add(instruction);

    
    return await sendTransaction(connection, wallet, transaction, signers);
  }
  public static async checkWalletATA(connection:Connection,walletPubkey:PublicKey,mint:string){
    let parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey,
      {
        programId: TOKEN_PROGRAM_ID
      },
      'confirmed'
    );
    let result:any = null;
    parsedTokenAccounts.value.forEach(async (tokenAccountInfo) => {
      const tokenAccountPubkey = tokenAccountInfo.pubkey
      const parsedInfo = tokenAccountInfo.account.data.parsed.info
      const mintAddress = parsedInfo.mint
      if(mintAddress === mint){
        result = tokenAccountPubkey;
      }
    });
    return result;
  }
  
  public static async migrate(
    connection: Connection,
    wallet: any ,
    oldFarmInfo: FarmInfo,
    newFarmInfo: FarmInfo,
    lpAccount: string | undefined | null,
    rewardAccount: string | undefined | null,
    infoAccount: string | undefined | null,
    amount: string,
  ){
    
    const programData = await FarmProgram.loadProgramAccount(connection);

    const value = getBigNumber(new TokenAmount(amount, oldFarmInfo.lp.decimals, false).wei)
    const transaction = new Transaction()
    const signers: any = []
    const owner = wallet.publicKey
    const atas: string[] = []
    const programId = new PublicKey(oldFarmInfo.programId)
    const oldFarmId = new PublicKey(oldFarmInfo.poolId)

    const userLpAccount = await createAssociatedTokenAccountIfNotExist(
      lpAccount,
      owner,
      oldFarmInfo.lp.mintAddress,
      transaction,
      atas
    )

    // if no account, create new one
    const userRewardTokenAccount = await createAssociatedTokenAccountIfNotExist(
      rewardAccount,
      owner,
      oldFarmInfo.reward.mintAddress,
      transaction,
      atas
    )

    let userInfoKey:any = null;
    if(infoAccount){
      userInfoKey = new PublicKey(infoAccount);
    }
    else{
      if(FARM_VERSION === 1){
        // not fixed multiple stake accounts problem
        userInfoKey = await createProgramAccountIfNotExist(
          connection,
          infoAccount,
          owner,
          programId,
          null,
          UserInfoAccountLayout,
          transaction,
          signers
        );
      }
      else if(FARM_VERSION >= 2){
        const seeds = [Buffer.from(FARM_PREFIX),oldFarmId.toBuffer(),owner.toBuffer()];
        const [foundUserInfoKey] = await PublicKey.findProgramAddress(seeds, programId);
        userInfoKey = foundUserInfoKey;
      }
    }

    let [authority] = await PublicKey.findProgramAddress(
      [oldFarmId.toBuffer()],
      programId,
    );

    let rewardATA = await YieldFarm.checkWalletATA(connection, programData.feeOwner, oldFarmInfo.reward.mintAddress);
    if(!rewardATA){
      rewardATA = await createAssociatedTokenAccountIfNotExist(
        null,
        programData.feeOwner,
        oldFarmInfo.reward.mintAddress,
        transaction
      )
    }

    const seeds = [Buffer.from(FARM_PREFIX),programId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, programId);
    const withdrawInstruction = YieldFarm.createWithdrawInstruction(
      oldFarmId,
      authority,
      owner,
      userInfoKey,
      userLpAccount,
      userRewardTokenAccount,
      new PublicKey(oldFarmInfo.poolLpTokenAccount),
      new PublicKey(oldFarmInfo.poolRewardTokenAccount),
      new PublicKey(oldFarmInfo.lp.mintAddress),
      rewardATA,
      TOKEN_PROGRAM_ID,
      programId,
      value,
      programAccount
    );
    transaction.add(withdrawInstruction);


    const newFarmId = new PublicKey(newFarmInfo.poolId)
    
    let newUserInfoKey:any = null;
    if(FARM_VERSION === 1){
      // not fixed multiple stake accounts problem
      newUserInfoKey = await createProgramAccountIfNotExist(
        connection,
        null,
        owner,
        programId,
        null,
        UserInfoAccountLayout,
        transaction,
        signers
      );
    }
    else if(FARM_VERSION >= 2){
      const seeds = [Buffer.from(FARM_PREFIX),newFarmId.toBuffer(),owner.toBuffer()];
      const [foundUserInfoKey] = await PublicKey.findProgramAddress(seeds, programId);
      newUserInfoKey = foundUserInfoKey;
    }

    const fetchFarm = await YieldFarm.loadFarm(
      connection,
      newFarmId,
      programId
    )
    
    const depositInstruction = YieldFarm.createDepositInstruction(
      newFarmId,
      fetchFarm.authority,
      owner,
      newUserInfoKey,
      userLpAccount,
      userRewardTokenAccount,
      fetchFarm.poolLpTokenAccount,
      fetchFarm.poolRewardTokenAccount,
      fetchFarm.lpTokenPoolMint,
      rewardATA,
      TOKEN_PROGRAM_ID,
      programId,
      value,
      programAccount
    );
    transaction.add(depositInstruction);

    return await sendTransaction(connection, wallet, transaction, signers);
  }
  public static async withdraw( 
    connection: Connection,
    wallet: any ,
    farmInfo: FarmInfo,
    lpAccount: string | undefined | null,
    rewardAccount: string | undefined | null,
    infoAccount: string | undefined | null,
    amount: string
  ) {
    const programData = await FarmProgram.loadProgramAccount(connection);

    const value = getBigNumber(new TokenAmount(amount, farmInfo.lp.decimals, false).wei)
    const transaction = new Transaction()
    const signers: any = []
    const owner = wallet.publicKey
    const atas: string[] = []
    const programId = new PublicKey(farmInfo.programId)
    const farmId = new PublicKey(farmInfo.poolId)

    const userLpAccount = await createAssociatedTokenAccountIfNotExist(
      lpAccount,
      owner,
      farmInfo.lp.mintAddress,
      transaction,
      atas
    )

    // if no account, create new one
    const userRewardTokenAccount = await createAssociatedTokenAccountIfNotExist(
      rewardAccount,
      owner,
      farmInfo.reward.mintAddress,
      transaction,
      atas
    )

    let userInfoKey:any = null;
    if(infoAccount){
      userInfoKey = new PublicKey(infoAccount);
    }
    else{
      if(FARM_VERSION === 1){
        // not fixed multiple stake accounts problem
        userInfoKey = await createProgramAccountIfNotExist(
          connection,
          infoAccount,
          owner,
          programId,
          null,
          UserInfoAccountLayout,
          transaction,
          signers
        );
      }
      else if(FARM_VERSION >= 2){
        const seeds = [Buffer.from(FARM_PREFIX),farmId.toBuffer(),owner.toBuffer()];
        const [foundUserInfoKey] = await PublicKey.findProgramAddress(seeds, programId);
        userInfoKey = foundUserInfoKey;
      }
    }

    let [authority] = await PublicKey.findProgramAddress(
      [farmId.toBuffer()],
      programId,
    );

    let rewardATA = await YieldFarm.checkWalletATA(connection, programData.feeOwner, farmInfo.reward.mintAddress);
    if(!rewardATA){
      rewardATA = await createAssociatedTokenAccountIfNotExist(
        null,
        programData.feeOwner,
        farmInfo.reward.mintAddress,
        transaction
      )
    }

    const seeds = [Buffer.from(FARM_PREFIX),programId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, programId);
    const instruction = YieldFarm.createWithdrawInstruction(
      farmId,
      authority,
      owner,
      userInfoKey,
      userLpAccount,
      userRewardTokenAccount,
      new PublicKey(farmInfo.poolLpTokenAccount),
      new PublicKey(farmInfo.poolRewardTokenAccount),
      new PublicKey(farmInfo.lp.mintAddress),
      rewardATA,
      TOKEN_PROGRAM_ID,
      programId,
      value,
      programAccount
    );
    transaction.add(instruction);
    return await sendTransaction(connection, wallet, transaction, signers);
  }
  public static async removeRewards( 
    connection: Connection,
    wallet: any ,
    farmInfo: FarmInfo,
    rewardAccount: string | undefined | null,
  ) {
    const transaction = new Transaction()
    const signers: any = []
    const owner = wallet.publicKey
    const atas: string[] = []
    const programId = new PublicKey(farmInfo.programId)
    const farmId = new PublicKey(farmInfo.poolId)

    // if no account, create new one
    const userRewardTokenAccount = await createAssociatedTokenAccountIfNotExist(
      rewardAccount,
      owner,
      farmInfo.reward.mintAddress,
      transaction,
      atas
    )
    let [authority] = await PublicKey.findProgramAddress(
      [farmId.toBuffer()],
      programId,
    );

    const seeds = [Buffer.from(FARM_PREFIX),programId.toBuffer()];
    const [programAccount] = await PublicKey.findProgramAddress(seeds, programId);
    const instruction = YieldFarm.createRemoveRewardsInstruction(
      farmId,
      authority,
      owner,
      userRewardTokenAccount,
      new PublicKey(farmInfo.poolRewardTokenAccount),
      TOKEN_PROGRAM_ID,
      programId,
      programAccount
    );
    transaction.add(instruction);
    return await sendTransaction(connection, wallet, transaction, signers);
  }
  static createDepositInstruction(
    farmId: PublicKey, // farm account 
    authority: PublicKey, //farm authority
    depositor: PublicKey,
    userInfoAccount:PublicKey,
    userLpTokenAccount: PublicKey,
    userRewardTokenAccount: PublicKey,
    poolLpTokenAccount: PublicKey,
    poolRewardTokenAccount: PublicKey,
    poolLpTokenMint: PublicKey,
    feeOwner: PublicKey,
    tokenProgramId: PublicKey,
    farmProgramId: PublicKey,
    amount: number,
    programAccount: PublicKey, 
  ): TransactionInstruction {
    
    const keys = [
      {pubkey: farmId, isSigner: false, isWritable: true},
      {pubkey: authority, isSigner: false, isWritable: false},
      {pubkey: depositor, isSigner: true, isWritable: false},
      {pubkey: userInfoAccount, isSigner: false, isWritable: true},
      {pubkey: userLpTokenAccount, isSigner: false, isWritable: true},
      {pubkey: poolLpTokenAccount, isSigner: false, isWritable: true},
      {pubkey: userRewardTokenAccount, isSigner: false, isWritable: true},
      {pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true},
      {pubkey: poolLpTokenMint, isSigner: false, isWritable: true},
      {pubkey: feeOwner, isSigner: false, isWritable: true},
      {pubkey: programAccount, isSigner: false, isWritable: true},
      {pubkey: tokenProgramId, isSigner: false, isWritable: false},
      {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
      {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
      {pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false},
    ];
    const commandDataLayout = struct([
      u8('instruction'),
      nu64('amount'),
    ]); 
    let data = Buffer.alloc(1024);
    {
      const encodeLength = commandDataLayout.encode(
        {
          instruction: FarmInstruction.Deposit, // InitializeFarm instruction
          amount:amount,
        },
        data,
      );
      data = data.slice(0, encodeLength);
    }
    return new TransactionInstruction({
      keys,
      programId: farmProgramId,
      data,
    });
  }
  static createWithdrawInstruction(
    farmId: PublicKey, // farm account 
    authority: PublicKey, //farm authority
    owner: PublicKey,
    userInfoAccount: PublicKey,
    userLpTokenAccount: PublicKey,
    userRewardTokenAccount: PublicKey,
    poolLpTokenAccount: PublicKey,
    poolRewardTokenAccount: PublicKey,
    poolLpTokenMint: PublicKey,
    feeOwner: PublicKey,
    tokenProgramId: PublicKey,
    farmProgramId: PublicKey,
    amount: number,
    programAccount: PublicKey,
  ): TransactionInstruction {
    const keys = [
      {pubkey: farmId, isSigner: false, isWritable: true},
      {pubkey: authority, isSigner: false, isWritable: false},
      {pubkey: owner, isSigner: true, isWritable: false},
      {pubkey: userInfoAccount, isSigner: false, isWritable: true},
      {pubkey: userLpTokenAccount, isSigner: false, isWritable: true},
      {pubkey: poolLpTokenAccount, isSigner: false, isWritable: true},
      {pubkey: userRewardTokenAccount, isSigner: false, isWritable: true},
      {pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true},
      {pubkey: poolLpTokenMint, isSigner: false, isWritable: true},
      {pubkey: feeOwner, isSigner: false, isWritable: true},
      {pubkey: programAccount, isSigner: false, isWritable: true},
      {pubkey: tokenProgramId, isSigner: false, isWritable: false},
      {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
    ];
    const commandDataLayout = struct([
      u8('instruction'),
      nu64('amount'),
    ]); 
    let data = Buffer.alloc(1024);
    {
      const encodeLength = commandDataLayout.encode(
        {
          instruction: FarmInstruction.Withdraw, // InitializeFarm instruction
          amount:amount,
        },
        data,
      );
      data = data.slice(0, encodeLength);
    }
    return new TransactionInstruction({
      keys,
      programId: farmProgramId,
      data,
    });
  }
  static createRemoveRewardsInstruction(
    farmId: PublicKey, // farm account 
    authority: PublicKey, //farm authority
    owner: PublicKey,
    userRewardTokenAccount: PublicKey,
    poolRewardTokenAccount: PublicKey,
    tokenProgramId: PublicKey,
    farmProgramId: PublicKey,
    programAccount: PublicKey,
  ): TransactionInstruction {
    const keys = [
      {pubkey: farmId, isSigner: false, isWritable: true},
      {pubkey: authority, isSigner: false, isWritable: false},
      {pubkey: owner, isSigner: true, isWritable: false},
      {pubkey: userRewardTokenAccount, isSigner: false, isWritable: true},
      {pubkey: poolRewardTokenAccount, isSigner: false, isWritable: true},
      {pubkey: programAccount, isSigner: false, isWritable: true},
      {pubkey: tokenProgramId, isSigner: false, isWritable: false},
    ];
    const commandDataLayout = struct([
      u8('instruction'),
    ]); 
    let data = Buffer.alloc(1024);
    {
      const encodeLength = commandDataLayout.encode(
        {
          instruction: FarmInstruction.RemoveRewards,
        },
        data,
      );
      data = data.slice(0, encodeLength);
    }
    return new TransactionInstruction({
      keys,
      programId: farmProgramId,
      data,
    });
  }
}
