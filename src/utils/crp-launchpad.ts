// @ts-ignore 
import launchpad_idl from './crp-launchpad-idl.json' 
 
import * as anchor from '@project-serum/anchor'; 
import bs58 from 'bs58'; 
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token"; 
const { BN, web3, Program, Provider } = anchor 
const { SystemProgram, Keypair, Transaction } = web3 
const utf8 = anchor.utils.bytes.utf8; 
 
   
export const LAUNCHPAD_TAG = "launchpad"; 
export const USER_TAG = "user"; 
export const PROJECT_TAG = "project"; 
export const PROJECT_VAULT_TAG = "project-vault"; 
export const TREASURY_VAULT_TAG = "treasury-vault"; 
export const USER_PROJECT_TOKEN_TAG = "user-project-token"; 
export const DENOMINATOR = 1_000_000_000; 
 
import { Connection, PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction} from '@solana/web3.js'; 
import moment from 'moment'; 
import { LAUNCHPAD_PROGRAM_ID } from './ids'; 
 
export let LaunchpadProgram:any = null 
 
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
  const program = new (anchor as any).Program(launchpad_idl, new PublicKey(LAUNCHPAD_PROGRAM_ID), provider); 
  LaunchpadProgram = program 
} 
 
export async function getLaunchpadAddress(){ 
  const [launchpad, bump] = await anchor.web3.PublicKey.findProgramAddress( 
    [utf8.encode('launchpad')], 
    LaunchpadProgram.programId 
  ); 
  return launchpad 
} 
 
export async function getProjectAddress(mint: anchor.web3.PublicKey){ 
  const [project, bump] = await anchor.web3.PublicKey.findProgramAddress( 
    [utf8.encode('project'), mint.toBuffer() ], 
    LaunchpadProgram.programId 
  ); 
  return project 
} 
 
export async function getUser(mint: anchor.web3.PublicKey, wallet: any = LaunchpadProgram.provider.wallet){ 
  const [userKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(USER_TAG), wallet.publicKey.toBuffer(), mint.toBuffer()], 
      LaunchpadProgram.programId) 
  return await LaunchpadProgram.account.userAccount.fetchNullable(userKey) 
} 
 
 
export async function createLaunchpad( 
  treasury: anchor.web3.PublicKey = LaunchpadProgram.provider.wallet.publicKey, 
  wallet: any = LaunchpadProgram.provider.wallet, 
  signers = [] 
) { 
  const [globalStateKey] =  
      await anchor.web3.PublicKey.findProgramAddress( 
        [Buffer.from(LAUNCHPAD_TAG)], 
        LaunchpadProgram.programId, 
      ); 
  let txHash = await LaunchpadProgram.rpc.setLaunchpad( 
    { 
      accounts: { 
        authority: wallet.publicKey, 
        launchpad: globalStateKey, 
        treasury, 
        systemProgram: SystemProgram.programId, 
        rent: SYSVAR_RENT_PUBKEY, 
      }, 
      signers 
    } 
  ).catch((e:any) => { 
    console.log("createLaunchpad error =", e); 
  }); 
  console.log("txHash =", txHash); 
} 
 
export async function getLaunchpad(){ 
  const launchpadAddress = await getLaunchpadAddress(); 
   
  return await LaunchpadProgram.account.launchpadAccount.fetchNullable(launchpadAddress) 
} 
 
 
export async function getProject(mint: string){ 
  const projectAddress = await getProjectAddress(new PublicKey(mint)); 
   
  return await LaunchpadProgram.account.projectAccount.fetchNullable(projectAddress) 
} 
 
export async function getAllProjects(){ 
  try{ 
    const data = await LaunchpadProgram.account.projectAccount.all() 
    return data 
  } 
  catch{ 
 
  } 
  return null 
} 
 
export async function getProjectFormatted(mint: string){ 
  try{ 
    const data = await getProject(mint) 
    return { 
      date_preparation: time2str(data.prepareDate), 
      date_whitelist_start: time2str(data.wlStartDate), 
      date_whitelist_end: time2str(data.wlEndDate), 
      date_sale_start: time2str(data.saleStartDate), 
      date_sale_end: time2str(data.saleEndDate), 
      date_distribution: time2str(data.distributionDate), 
      token_price: data.tokenPrice.toString() / DENOMINATOR, 
      price_token_mint: data.saleMint.toString(), 
       
      total_deposit_amount: data.depositAmount.toString(), 
      total_paid_amount: data.paidAmount.toString(), 
      total_claimed_amount: data.claimedAmount.toString(), 
      total_registered_user: data.subscribed.toString(), 
 
    } 
  } 
  catch(e) { 
    console.log("getProjectFormatted",e) 
  } 
  return {} 
} 
 
 
const datetime_format = 'YYYY-MM-DD HH:mm:ss' 
export function str2time(date:string){ 
  return new BN(moment(date, datetime_format).format("X")) 
} 
 
export function time2str(date: any){ 
  return moment(new Date(date * 1000)).format(datetime_format) 
} 
function formatProjectParams( 
  prepareDate: any, 
  whiltelistStartDate: any, 
  whiltelistEndDate: any, 
  saleStartDate: any, 
  saleEndDate: any, 
  distributionDate: any, 
   
  tokenPrice: any, 
){ 
  return [ 
    str2time(prepareDate), 
    str2time(whiltelistStartDate), 
    str2time(whiltelistEndDate), 
    str2time(saleStartDate), 
    str2time(saleEndDate), 
    str2time(distributionDate), 
     
    new BN(Math.ceil(tokenPrice * DENOMINATOR)), 
  ] 
} 
 
export async function saveProject( 
  projectMint: string, 
  priceTokenMint: string, 
 
  prepareDate: string, 
  whiltelistStartDate: string, 
  whiltelistEndDate: string, 
  saleStartDate: string, 
  saleEndDate: string, 
  distributionDate: string, 
   
  tokenPrice: number, 
  wallet: any = LaunchpadProgram.provider.wallet, 
  signers = [] 
) 
{ 
  const [launchpadKey] =  
      await anchor.web3.PublicKey.findProgramAddress( 
        [Buffer.from(LAUNCHPAD_TAG)], 
        LaunchpadProgram.programId, 
      ); 
  const [projectAddress] = await anchor.web3.PublicKey.findProgramAddress( 
    [Buffer.from(PROJECT_TAG), new PublicKey(projectMint).toBuffer() ], 
    LaunchpadProgram.programId 
  ); 
  const launchpadData = await LaunchpadProgram.account.launchpadAccount.fetch(launchpadKey); 
  const treasury = launchpadData.treasury; 
 
  const [treasuryVault] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(TREASURY_VAULT_TAG), projectAddress.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const paramFormatted = formatProjectParams(   
    prepareDate, 
    whiltelistStartDate, 
    whiltelistEndDate, 
    saleStartDate, 
    saleEndDate, 
    distributionDate, 
     
    tokenPrice, 
  ); 
  let txHash = await LaunchpadProgram.rpc.setProject( 
    ...paramFormatted, 
    { 
      accounts: { 
        authority: wallet.publicKey, 
        launchpad: launchpadKey, 
        project: projectAddress, 
        projectMint: new PublicKey(projectMint), 
        saleMint: new PublicKey(priceTokenMint), 
        treasury, 
        treasuryVault, 
        systemProgram: SystemProgram.programId, 
        tokenProgram: TOKEN_PROGRAM_ID, 
        rent: SYSVAR_RENT_PUBKEY, 
      }, 
      signers 
    } 
  ).catch((e:any) => { 
    console.log("e =", e); 
  }); 
  console.log("txHash =", txHash); 
} 
 
 
export async function depositProjectToken( 
  projectMint: PublicKey, 
  userVault: PublicKey, 
  amount:any, 
  wallet: any = LaunchpadProgram.provider.wallet, 
  signers = [] 
) { 
  const [projectKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(PROJECT_TAG), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const [projectVaultKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(PROJECT_VAULT_TAG), projectKey.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const depositAmount = new anchor.BN(amount) 
 
  let txHash = await LaunchpadProgram.rpc.depositProjectToken( 
    depositAmount, 
    { 
      accounts: { 
        project: projectKey, 
        projectMint: projectMint, 
        projectVault: projectVaultKey, 
        userVault: userVault, 
        authority: wallet.publicKey, 
        systemProgram: SystemProgram.programId, 
        rent: SYSVAR_RENT_PUBKEY, 
        tokenProgram: TOKEN_PROGRAM_ID, 
      }, 
      signers 
    } 
  ).catch((e:any) => { 
    console.log("e =", e); 
  }); 
  console.log("txHash =", txHash); 
  return { 
    amount:amount, 
    success: true, 
    txId:txHash, 
    hash:"" 
  } 
} 
 
export async function withdrawProjectToken( 
  projectMint: PublicKey, 
  userVault: PublicKey, 
  amount:any, 
  wallet: any = LaunchpadProgram.provider.wallet, 
  signers = [] 
) { 
  const [projectKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(PROJECT_TAG), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const [projectVaultKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(PROJECT_VAULT_TAG), projectKey.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const withdrawAmount = new anchor.BN(amount) 
   
  let txHash = await LaunchpadProgram.rpc.withdrawProjectToken( 
    withdrawAmount, 
    { 
      accounts: { 
        project: projectKey, 
        projectVault: projectVaultKey, 
        userVault: userVault, 
        authority: wallet.publicKey, 
        systemProgram: SystemProgram.programId, 
        rent: SYSVAR_RENT_PUBKEY, 
        tokenProgram: TOKEN_PROGRAM_ID, 
      }, 
      signers 
    } 
  ).catch((e:any) => { 
    console.log("e =", e); 
  }); 
  console.log("txHash =", txHash); 
  return { 
    amount:amount, 
    success: true, 
    txId:txHash, 
    hash:"" 
  } 
} 
 
export async function subscribeToWhitelist( 
  projectMint: PublicKey, 
  userProjectToken: PublicKey, 
  wallet: any = LaunchpadProgram.provider.wallet, 
  signers: any[] = [] 
) { 
  const [projectKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(PROJECT_TAG), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const [userKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(USER_TAG), wallet.publicKey.toBuffer(), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const instructions:TransactionInstruction[] = [] 
  if(!userProjectToken){ 
    const userProjectTokenKeypair = await createSPLTokenAccount(instructions, LaunchpadProgram.provider.connection,  LaunchpadProgram.provider.wallet.publicKey, LaunchpadProgram.provider.wallet.publicKey, projectMint); 
    userProjectToken = userProjectTokenKeypair.publicKey; 
    signers.push(userProjectTokenKeypair) 
  } 
  let txHash = await LaunchpadProgram.rpc.registerUser( 
    { 
      accounts: { 
        authority: wallet.publicKey, 
        project: projectKey, 
        user: userKey, 
        projectMint: projectMint, 
        userProjectToken, 
        systemProgram: SystemProgram.programId, 
        rent: SYSVAR_RENT_PUBKEY, 
        tokenProgram: TOKEN_PROGRAM_ID, 
        clock: SYSVAR_CLOCK_PUBKEY 
      }, 
      signers, 
      instructions 
    } 
  ).catch((e:any) => { 
    console.log("e =", e); 
    return { 
      amount: 0, 
      success: false, 
      txId: "", 
    } 
  }); 
  console.log("txHash =", txHash); 
  return { 
    amount: 0, 
    success: true, 
    txId: txHash, 
  } 
} 
 
export const isSubscribed = async ( 
  projectMint: PublicKey, 
  wallet: any = LaunchpadProgram.provider.wallet, 
) => { 
  const [userKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(USER_TAG), wallet.publicKey.toBuffer(), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  let userData = null; 
  try { 
    userData = await LaunchpadProgram.account.userAccount.fetch(userKey); 
  } catch {} 
   
  return userData !== null; 
} 
 
 
export async function buyTokens( 
  projectMint: PublicKey, 
  priceMint: PublicKey, 
  userSaleTokenAccount: PublicKey, 
  amount:any, 
  wallet: any = LaunchpadProgram.provider.wallet, 
  signers: any[] = [] 
) { 
  if(amount <= 0) { 
    return { 
      amount:0, 
      success: false, 
      txId:"", 
      hash:"" 
    } 
  } 
  const payableAmount = new anchor.BN(amount) 
  const [projectKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(PROJECT_TAG), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const [userKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(USER_TAG), wallet.publicKey.toBuffer(), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const [treasuryVault] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(TREASURY_VAULT_TAG), projectKey.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const userBefore = await LaunchpadProgram.account.userAccount.fetch(userKey) 
 
  const instructions:TransactionInstruction[] = [] 
  if(!userSaleTokenAccount){ 
    const userSaleTokenKeypair = await createSPLTokenAccount(instructions, LaunchpadProgram.provider.connection,  LaunchpadProgram.provider.wallet.publicKey, LaunchpadProgram.provider.wallet.publicKey, priceMint); 
    userSaleTokenAccount = userSaleTokenKeypair.publicKey; 
    signers.push(userSaleTokenKeypair) 
  } 
   
  let txHash = await LaunchpadProgram.rpc.pay( 
    payableAmount, 
    { 
      accounts: { 
        project: projectKey, 
        user: userKey, 
        treasuryVault, 
        userVault: userSaleTokenAccount, 
        authority: wallet.publicKey, 
        tokenProgram: TOKEN_PROGRAM_ID, 
      }, 
      signers, 
      instructions 
    } 
  ).catch((e:any) => { 
    console.log("e =", e); 
    return { 
      amount:0, 
      success: false, 
      txId:txHash, 
      hash:"" 
    } 
  }); 
  console.log("txHash =", txHash); 
  const showAmount = amount 
  return { 
    amount:showAmount, 
    success: true, 
    txId:txHash, 
    hash:"" 
  } 
} 
 
export async function createSPLTokenAccount( 
    instructions:TransactionInstruction[], 
    connection:Connection, 
    payer:PublicKey, 
    owner:PublicKey, 
    mint: PublicKey 
  ){ 
     
    let accountRentExempt = await connection.getMinimumBalanceForRentExemption( 
      AccountLayout.span 
      ); 
    let newTokenAccount = await createSplAccount( 
      instructions, 
      payer, 
      accountRentExempt, 
      mint, 
      owner, 
      AccountLayout.span 
    ); 
    return newTokenAccount; 
  } 
 
export function createSplAccount( 
  instructions: TransactionInstruction[], 
  payer: PublicKey, 
  accountRentExempt: number, 
  mint: PublicKey, 
  owner: PublicKey, 
  space: number 
) { 
  const account = new Keypair(); 
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
 
export async function claimTokens( 
  projectMint: PublicKey, 
  projectTokenAccount: PublicKey, 
  wallet: any = LaunchpadProgram.provider.wallet, 
  signers = [] 
) { 
  const [launchpadKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(LAUNCHPAD_TAG)], 
      LaunchpadProgram.programId, 
    ); 
  const [projectKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(PROJECT_TAG), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const [projectVaultKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(PROJECT_VAULT_TAG), projectKey.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const [userKey] =  
    await anchor.web3.PublicKey.findProgramAddress( 
      [Buffer.from(USER_TAG), wallet.publicKey.toBuffer(), projectMint.toBuffer()], 
      LaunchpadProgram.programId, 
    ); 
  const userBefore = await LaunchpadProgram.account.userAccount.fetch(userKey) 
   
  let txHash = await LaunchpadProgram.rpc.claimProjectToken( 
    { 
      accounts: { 
        launchpad: launchpadKey, 
        project: projectKey, 
        user: userKey, 
        projectVault: projectVaultKey, 
        userVault: projectTokenAccount, 
        authority: wallet.publicKey, 
        clock: SYSVAR_CLOCK_PUBKEY, 
        tokenProgram: TOKEN_PROGRAM_ID, 
      }, 
      signers 
    } 
  ).catch((e:any) => { 
    console.log("e =", e); 
    return { 
      amount:0, 
      success: false, 
      txId:"", 
      hash:"" 
    } 
  }); 
  console.log("txHash =", txHash); 
 
  const userAfter = await LaunchpadProgram.account.userAccount.fetch(userKey) 
  const amount = userAfter.claimedAmount.toNumber() - userBefore.claimedAmount.toNumber() 
  return { 
    amount:amount, 
    success: true, 
    txId:txHash, 
    hash:"" 
  } 
}