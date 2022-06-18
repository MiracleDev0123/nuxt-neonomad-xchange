// @ts-ignore
import * as anchor from '@project-serum/anchor';

// @ts-ignore
import * as serumCmn from "@project-serum/common";

import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
const { BN, web3, Program, Provider } = anchor
const { PublicKey, SystemProgram, Keypair, Transaction } = web3
const utf8 = anchor.utils.bytes.utf8;

function getNumber (num: number) {
  return new BN(num * 10 ** 9)
}

const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
}

import waggle_farm_idl from '@/utils/cropper_staking.json'
import { Account, Connection } from '@solana/web3.js';
import { createSplAccount } from './nni-swap';
import { createAssociatedTokenAccountIfNotExist2, sendTransaction } from './web3';
import { STAKE_TIERS_PROGRAM_ID } from './ids';
import moment from 'moment';
let StakingProgram:any = null

export function setAnchorProvider(
  connection: Connection,
  wallet: any,
) {

  const provider = new anchor.Provider(
    connection,
    wallet,
    anchor.Provider.defaultOptions(),
  );
  // Generate the program client from IDL.
  const program = new (anchor as any).Program(waggle_farm_idl, new PublicKey(STAKE_TIERS_PROGRAM_ID), provider);
  StakingProgram = program

}

export interface ExtraRewardConfigs{
  duration: any
  extraPercentage: any
}

export async function getFarmStateAddress(){
  const [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('state')],
    StakingProgram.programId
  );
  return stateSigner
}

async function getExtraRewardAddress(){
  const [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('extra')],
    StakingProgram.programId
  );
  return stateSigner
}

async function getPoolAddressFromMint(mint:string){
  const [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [new PublicKey(mint).toBuffer()],
    StakingProgram.programId
  );
  return stateSigner
}
const ACC_PRECISION = new BN(100 * 1000 * 1000 * 1000);
const FULL_100 = new BN (100 * 1000 * 1000 * 1000);
export function estimateRewards(
  stateData:any,
  extraConfigData:any,
  poolData:any,
  userData:any,
){
  const currentTimeStamp = Math.ceil(new Date().getTime() / 1000);

  const duration = new BN(Math.max(currentTimeStamp - poolData.lastRewardTime, 0))

  const reward_per_share = stateData.tokenPerSecond.mul(duration).mul(ACC_PRECISION).div(poolData.amount);
  const acc_reward_per_share = poolData.accRewardPerShare.add(reward_per_share);

  let extraPercentage = new BN(0)
  extraConfigData.configs.forEach((item:any)=>{
    if(item.duration.toString() === userData.lockDuration.toString())
    {
      extraPercentage = item.extraPercentage
      return;
    }
  })

  const pending_amount = userData.amount.mul( acc_reward_per_share).div(ACC_PRECISION).sub(userData.rewardDebt);
  const extra_amount = userData.extraReward.add(pending_amount.mul(extraPercentage).div(FULL_100));
  const total_reward = userData.rewardAmount.add(pending_amount).add(extra_amount)

  return total_reward.toString()
}


export function estimateRewardsPerSec(
  stateData:any,
  extraConfigData:any,
  poolData:any,
  userData:any,
){
  const currentTimeStamp = Math.ceil(new Date().getTime() / 1000);

  const duration = new BN(Math.max(currentTimeStamp - poolData.lastRewardTime, 0))

  const reward_per_share = stateData.tokenPerSecond.mul(duration).mul(ACC_PRECISION).div(poolData.amount);
  const acc_reward_per_share = poolData.accRewardPerShare.add(reward_per_share);

  let extraPercentage = new BN(0)
  extraConfigData.configs.forEach((item:any)=>{
    if(item.duration.toString() === userData.lockDuration.toString())
    {
      extraPercentage = item.extraPercentage
      return;
    }
  })

  const pending_amount = userData.amount.mul( acc_reward_per_share).div(ACC_PRECISION).sub(userData.rewardDebt);
  const extra_amount = userData.extraReward.add(pending_amount.mul(extraPercentage).div(FULL_100));
  const total_reward = userData.rewardAmount.add(pending_amount).add(extra_amount)
  return ((total_reward / 1000000000) / ((currentTimeStamp - poolData.lastRewardTime.toString()) * 1000));
}

export async function createFarmState(
  connection:Connection,
  wallet: any,
  tokenPerSecond: number,
  rewardMint: string,
)
{
  const transaction = new Transaction()
  const signers: Account[] = []

  const [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('state')],
    StakingProgram.programId
  );

  const stateRewardVault = await createAssociatedTokenAccountIfNotExist2(
    null,
    stateSigner,
    wallet.publicKey,
    rewardMint,
    transaction
  )

  transaction.add(
    StakingProgram.instruction.createState(stateBump, new BN(tokenPerSecond), {
      accounts: {
        state: stateSigner,
        rewardMint: rewardMint,
        rewardVault: stateRewardVault,
        authority: wallet.publicKey,
        ...defaultAccounts
      }
    })
  )

  // const stateInfo = await StakingProgram.account.stateAccount.fetch(stateSigner)
  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function getFarmState(){
  const stateSigner = await getFarmStateAddress();
  return await StakingProgram.account.stateAccount.fetchNullable(stateSigner)
}

export async function getExtraRewardConfigs(){
  const [extraRewardSigner, extraRewardBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('extra')],
    StakingProgram.programId
  );
  const extraRewardConfigs = await StakingProgram.account.extraRewardsAccount.fetchNullable(extraRewardSigner)
  // assert.ok(extraRewardConfigs.configs.length === 3)
  // assert.ok(new BN(1).eq(extraRewardConfigs.configs[1].duration))
  // assert.ok(getNumber(50).eq(extraRewardConfigs.configs[1].extraPercentage))
  return extraRewardConfigs
}


export async function createExtraReward(
  connection:Connection,
  wallet: any,
){
  const transaction = new Transaction()
  const signers: Account[] = []

  const [extraRewardSigner, extraRewardBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('extra')],
    StakingProgram.programId
  );
  console.log(extraRewardSigner.toString(), extraRewardBump)

  const tx = await StakingProgram.instruction.createExtraRewardConfigs(extraRewardBump,
    [
      { duration: new BN(43200 * 60), extraPercentage: new BN(0) },
      { duration: new BN(129600 * 60), extraPercentage: new BN(10 * 1000 * 1000 * 1000) },
      { duration: new BN(259200 * 60), extraPercentage: new BN(30 * 1000 * 1000 * 1000) },
      { duration: new BN(525600 * 60), extraPercentage: new BN(100 * 1000 * 1000 * 1000) }
    ],
    {
      accounts: {
        extraRewardAccount: extraRewardSigner,
        authority: wallet.publicKey,
        ...defaultAccounts
      },
    })
  transaction.add(tx)
  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function setExtraReward(
  connection:Connection,
  wallet: any,
  extraRewards: ExtraRewardConfigs[],
)
{

  const transaction = new Transaction()
  const signers: Account[] = []

  const [extraRewardSigner, extraRewardBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('extra')],
    StakingProgram.programId
  );

  transaction.add(StakingProgram.instruction.setExtraRewardConfigs(extraRewards, {
    accounts: {
      extraRewardAccount: extraRewardSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    },
  }))
  return await sendTransaction(connection, wallet, transaction, signers)

}


export async  function  fundToProgram(
  connection:Connection,
  wallet: any,
  poolSigner: string,
  masterRewardVault:string,
  amount:any
) {

  const transaction = new Transaction()
  const signers: Account[] = []

  const stateSigner = await getFarmStateAddress()
  const state = await getFarmState()
  // await rewardMint.mintTo(stateRewardVault, wallet, [provider.wallet], getNumber(10000).toString())
  const tx = StakingProgram.instruction.fundRewardToken(new BN(amount), {
    accounts: {
      pool: poolSigner,
      state: stateSigner,
      rewardVault: state.rewardVault,
      userVault: masterRewardVault,
      authority: wallet.publicKey,
      ...defaultAccounts
    }
  })
  transaction.add(tx)
  return await sendTransaction(connection, wallet, transaction, signers)

}


export async function getAllPools(){
  const pools = await StakingProgram.account.farmPoolAccount.all()
  return pools
}

export async function createPool(
  connection:Connection,
  wallet: any,
  rewardMint: string,
  pools: any[]
) {

  const transaction = new Transaction()
  const signers: Account[] = []
  

  const [poolSigner, poolBump] = await anchor.web3.PublicKey.findProgramAddress(
    [new PublicKey(rewardMint).toBuffer()],
    StakingProgram.programId
  );
  const stateSigner = await getFarmStateAddress()

  const poolVault = await createAssociatedTokenAccountIfNotExist2(
    null, 
    poolSigner, 
    wallet.publicKey,  
    rewardMint, 
    transaction)


  // let pools = await StakingProgram.account.farmPoolAccount.all()
  transaction.add(
    StakingProgram.instruction.createPool(poolBump, new BN('0'), new BN('0'), {
      accounts: {
        pool: poolSigner,
        state: stateSigner,
        mint: rewardMint,
        vault: poolVault,
        authority: wallet.publicKey,
        ...defaultAccounts
      },
      remainingAccounts: pools.map(p => ({
        pubkey: p.publicKey,
        isWritable: true,
        isSigner: false
      }))
    })
  )
  // let stateInfo = await program.account.stateAccount.fetch(stateSigner)
  // let poolInfo = await program.account.farmPoolAccount.fetch(poolSigner)
  // assert.ok(poolInfo.point.eq(stateInfo.totalPoint))
  // assert.ok(poolInfo.point.eq(new BN('0')))
  // assert.ok(poolInfo.amountMultipler.eq(new BN(0)))
  return await sendTransaction(connection, wallet, transaction, signers)
}
export async function closePool(
  connection:Connection,
  wallet: any,
  poolSigner:string,
  pools:any[]
){
  const transaction = new Transaction()
  const signers: Account[] = []

  const stateSigner = await getFarmStateAddress()
  
  StakingProgram.instruction.closePool({
    accounts: {
      pool: new PublicKey(poolSigner),
      state: stateSigner,
      authority: wallet,
      ...defaultAccounts
    },
    remainingAccounts: pools.map(p => ({
      pubkey: p.publicKey,
      isWritable: true,
      isSigner: false
    }))
  })
  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function changePoolAmountMultipler(
  connection:Connection,
  wallet: any,
  poolSigner:string,
) {
  
  const transaction = new Transaction()
  const signers: Account[] = []

  const stateSigner = await getFarmStateAddress()

  const tx = StakingProgram.instruction.changePoolAmountMultipler(new BN(1), {
    accounts: {
      pool: new PublicKey(poolSigner),
      state: stateSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    }
  })

  transaction.add(tx);

  return await sendTransaction(connection, wallet, transaction, signers)
}
export async function changeTokenPerSecond(
  connection:Connection,
  wallet: any,
  pools:any[]
){
  const transaction = new Transaction()
  const signers: Account[] = []

  const stateSigner = await getFarmStateAddress()
  const tx = StakingProgram.instruction.changeTokensPerSecond(new BN(40), {
    accounts: {
      state: stateSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    },
    remainingAccounts: pools.map(p => ({
      pubkey: p.publicKey,
      isWritable: true,
      isSigner: false
    }))
  })

  transaction.add(tx);
  return await sendTransaction(connection, wallet, transaction, signers)
}
export async function changePoolPoint(
  connection:Connection,
  wallet: any,
  poolSigner: string,
) {

  const transaction = new Transaction()
  const signers: Account[] = []
  
  const stateSigner = await getFarmStateAddress()

  let pools = await getAllPools()
  
  const ix = StakingProgram.instruction.changePoolPoint(new BN(1000), {
    accounts: {
      pool: new PublicKey(poolSigner),
      state: stateSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    },
    remainingAccounts: pools.map((p : any) => ({
      pubkey: p.publicKey,
      isWritable: true,
      isSigner: false
    }))
  })
  transaction.add(ix);
  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function getPoolUserAccount(
  wallet: any,
  poolSigner: any,
){
  
  const [poolUserAccount, bump1] = await PublicKey.findProgramAddress([
    poolSigner.toBuffer(), wallet.publicKey.toBuffer()
  ], StakingProgram.programId)

  return await StakingProgram.account.farmPoolUserAccount.fetchNullable(poolUserAccount)
}

const ONE_YEAR_SECOND = 365 * 24 * 3600;
export const TIERS_XCRP = [0, 200, 2000]
export function calculateTiers(amount: number, lockDuration: number)
{
  const rate = Number((lockDuration / ONE_YEAR_SECOND).toFixed(3));
  const xCRP = rate * amount;
  let i = 0;
  for(; i < TIERS_XCRP.length; i ++)
  {
    if (TIERS_XCRP[i] > xCRP) {
      break;
    }
  }
  i --;
  return {
    xCRP: Number(xCRP.toFixed(2)), 
    tiers: i,
  };
}

export async function stake (
  connection:Connection,
  wallet: any,

  poolSigner:string,

  rewardMint: string,
  poolVault: string,

  rewardUserVault: string,

  amount:any, 
  lock = 0
) {

  const transaction = new Transaction()
  const signers: Account[] = []

  const stateSigner = await getFarmStateAddress()
  const extraRewardSigner = await getExtraRewardAddress()
  // const poolSigner = await getPoolAddressFromMint(rewardMint)

  const [userAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), wallet.publicKey.toBuffer()
  ], StakingProgram.programId)
  
  const userAccountData = await StakingProgram.account.farmPoolUserAccount.fetchNullable(userAccount)
  if(!userAccountData){
    console.log("You are the new user to stake")
    transaction.add( StakingProgram.instruction.createUser(bump1, {
      accounts: {
        user: userAccount,
        state: stateSigner,
        pool: poolSigner,
        authority: wallet.publicKey,
        ...defaultAccounts
      }
    }));
  }
  

  transaction.add(StakingProgram.instruction.stake(new BN(amount), new BN(lock), {
    accounts: {
      mint: rewardMint,
      extraRewardAccount: extraRewardSigner,
      poolVault: poolVault,
      userVault: rewardUserVault,
      user: userAccount,
      state: stateSigner,
      pool: poolSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    }
  }));

  /*? projectMint ? */
  let txHash = await sendTransaction(connection, wallet, transaction, signers);
  
  return txHash;
}

export async function unstake (
  connection:Connection,
  wallet: any,
  
  poolSigner:string,
  rewardMint: string,
  poolVault: string,
  rewardUserVault:string,
  amount: number
) {

  const transaction = new Transaction()
  const signers: Account[] = []
  
  const stateSigner = await getFarmStateAddress()
  const programState = await getFarmState()
  
  const extraRewardSigner = await getExtraRewardAddress()
  // const poolSigner = await getPoolAddressFromMint(rewardMint)

  const [poolUserAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), wallet.publicKey.toBuffer()
  ], StakingProgram.programId)


  transaction.add(StakingProgram.instruction.unstake(new BN(amount), {
    accounts: {
      mint: rewardMint,
      extraRewardAccount: extraRewardSigner,
      poolVault: poolVault,
      userVault: rewardUserVault,
      user: poolUserAccount,
      state: stateSigner,
      pool: poolSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    }
  }))
  
  transaction.add(StakingProgram.instruction.harvest({
    accounts: {
      mint: rewardMint,
      extraRewardAccount: extraRewardSigner,
      rewardVault: programState.rewardVault,
      userVault: rewardUserVault,
      user: poolUserAccount,
      state: stateSigner,
      pool: poolSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    }
  }))
  
  
  /*? projectMint ? */
  let txHash = await sendTransaction(connection, wallet, transaction, signers);
  

  return txHash;

}

export async function harvest (
  connection:Connection,
  wallet: any,
  poolSigner: string,
  rewardMint: string,
  rewardUserVault: string,
  stateRewardVault: string
) {

  const transaction = new Transaction()
  const signers: Account[] = []

  const stateSigner = await getFarmStateAddress()
  const extraRewardSigner = await getExtraRewardAddress()
  // const poolSigner = await getPoolAddressFromMint(rewardMint)

  const [poolUserAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), wallet.publicKey.toBuffer()
  ], StakingProgram.programId)



  const tx = StakingProgram.instruction.harvest({
    accounts: {
      mint: rewardMint,
      extraRewardAccount: extraRewardSigner,
      rewardVault: stateRewardVault,
      userVault: rewardUserVault,
      user: poolUserAccount,
      state: stateSigner,
      pool: poolSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    }
  });
  
  transaction.add(tx);
  
  return await sendTransaction(connection, wallet, transaction, signers)
}
