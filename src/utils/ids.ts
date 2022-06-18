import { PublicKey } from '@solana/web3.js'

export const CRP_LP_VERSION_V1 = 1001
export const CRP_LP_VERSION_V2 = 1002
export const LP_UPDATE_INTERVAL = 600000 // 10 min
export const TOKEN_UPDATE_INTERVAL = 600000 // 10 min
export const MARKET_UPDATE_INTERVAL = 12 * 60 * 60 * 1000

export const ENDPOINT_SRM = 'Serum Dex'
export const ENDPOINT_CRP = 'CropperFinance Pool'
export const ENDPOINT_RAY = 'Raydium Pool'
export const ENDPOINT_JUP = 'Jupiter Aggregator'

export const DEVNET_MODE = false;

export const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111')
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
export const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo')
export const RENT_PROGRAM_ID = new PublicKey('SysvarRent111111111111111111111111111111111')
export const CLOCK_PROGRAM_ID = new PublicKey('SysvarC1ock11111111111111111111111111111111')
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

export const SERUM_PROGRAM_ID_V2 = 'EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o'
export const SERUM_PROGRAM_ID_V3 = DEVNET_MODE? 'HVTwJAMWEVbvxpKTFw3pE95jbv91GdMS7axgUJmjCysi':'9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'

export const LIQUIDITY_POOL_PROGRAM_ID_V2 = 'RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr'
export const LIQUIDITY_POOL_PROGRAM_ID_V3 = '27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv'
export const LIQUIDITY_POOL_PROGRAM_ID_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'

export const NNI_LP_PROGRAM_ID_V1 = DEVNET_MODE? '3rvMbE3nNTCWxEm8awCm1wxEahvcNvneVM1wjLSb8WQ7': 'BUi3oUsRNfzRLn3usy117rWb8J4mYSdp7AyWwdyPDtit'//@zhaohui
export const CRP_LP_PROGRAM_ID_V1 = DEVNET_MODE? '7ZZJNL4xD8db6yrT46SeMFZXcVr9MLepGpEtnKW2k6sW': 'CTMAxxk34HjKWxQ3QLZK1HpaLXmBveao3ESePXbiyfzh'//@zhaohui
//export const LIQUIDITY_POOL_PROGRAM_ID_V5 ="";


export const STAKE_TIERS_PROGRAM_ID = DEVNET_MODE ? "94fsNRJx5pcXxcmWXW2RR3bHbT7SAmhfdZGxm4GLwC1" : "GfXYYi5TFPG5ixdfiXLQacgjZbatqpb9uZZPMTBxMVCx"
// export const STAKE_TIERS_POOL_ID = DEVNET_MODE ? "Anm6hayiLSEAEr7co6hRKcFKcvLk7Z2kEUenykEr7xwk" : "5mEH7a7abQwUEXqfusVepc3z9cHVQg8uhqTXdq47J91o"

//export const LAUNCHPAD_PROGRAM_ID = DEVNET_MODE ? "8VU8xv5rLX7hsUqeersNBywyyqusAA7D2HgTEsBe5u1K" : "8RLyySGyhM7RjaqUxtWJYvrfWaYyakizAS1v6jeP9kA7"
export const sss = process.env.LAUNCHPAD_DEVNET_PID
export const LAUNCHPAD_PROGRAM_ID = DEVNET_MODE ? "AET8pue9ELgQ8TAg2BncPDQzAzbqx4PXywEozh5cRtcd" : "F7avqjLHSPaURGqNrEmiUidnWCU4AQo1dkcgQwLRjtsU"

//"FBHjXGXUa65hSCzyfMhkcLzu2U3HByNqcWMuDUUHURLa"

export let FARM_VERSION = 2;//@Hongbo

export const FARM_PROGRAM_ID_VS = DEVNET_MODE ? [
    'ZLNzLaAgeKHLa4vatwcQUSgkTf3UUiD8uuLq3qh3BVR',
    'E94tgQNzn5JZtnVu7EvnYCQNCkwuyimWEdcW9rhSBMLX'
] : [
    'Atk6w6gXXQMNpaYzuxEBveeXnfx627oQRGRntUbZQcc4',
    'Atk6w6gXXQMNpaYzuxEBveeXnfx627oQRGRntUbZQcc4'
]//@Hongbo
export const FARM_PROGRAM_ID = FARM_PROGRAM_ID_VS[FARM_VERSION-1];//@Hongbo

export const FARM_INITIAL_SUPER_OWNER = DEVNET_MODE ? "4GJ3z4skEHJADz3MVeNYBg4YV8H27rBQey2YYdiPC8PA":"DjXkZxNWUoGsL87rbWRFVPmoxN1FKXUWpinUyN921PwQ";//@Hongbo
export const FARM_INITIAL_FEE_OWNER = DEVNET_MODE ? "4GJ3z4skEHJADz3MVeNYBg4YV8H27rBQey2YYdiPC8PA":"DjXkZxNWUoGsL87rbWRFVPmoxN1FKXUWpinUyN921PwQ";//@Hongbo
export const FARM_INITIAL_ALLOWED_CREATOR = FARM_INITIAL_SUPER_OWNER;//@Hongbo

export const STAKE_PROGRAM_ID = 'EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q'
export const STAKE_PROGRAM_ID_V4 = 'CBuCnLe26faBpcBP2fktp4rp8abpcAnTWft6ZrP5Q4T'
export const STAKE_PROGRAM_ID_V5 = '9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z'

export const IDO_PROGRAM_ID = '6FJon3QE27qgPVggARueB22hLvoh22VzJpXv4rBEoSLF'
export const IDO_PROGRAM_ID_V2 = 'CC12se5To1CdEuw7fDS27B7Geo5jJyL7t5UK2B44NgiH'
export const IDO_PROGRAM_ID_V3 = '9HzJyW1qZsEiSfMUf6L2jo3CcTKAyBmSyKdwQeYisHrC'

export const AMM_STATE_SEED = "AmmState";

export const AUTHORITY_AMM = 'amm authority'
export const AMM_ASSOCIATED_SEED = 'amm_associated_seed'
export const TARGET_ASSOCIATED_SEED = 'target_associated_seed'
export const WITHDRAW_ASSOCIATED_SEED = 'withdraw_associated_seed'
export const OPEN_ORDER_ASSOCIATED_SEED = 'open_order_associated_seed'
export const COIN_VAULT_ASSOCIATED_SEED = 'coin_vault_associated_seed'
export const PC_VAULT_ASSOCIATED_SEED = 'pc_vault_associated_seed'
export const LP_MINT_ASSOCIATED_SEED = 'lp_mint_associated_seed'
export const TEMP_LP_TOKEN_ASSOCIATED_SEED = 'temp_lp_token_associated_seed'


export const REMOVE_REWARDS_FARM_ADDRESS = 'DjXkZxNWUoGsL87rbWRFVPmoxN1FKXUWpinUyN921PwQ'

// devnet serum market ids
// dexProgramId = HVTwJAMWEVbvxpKTFw3pE95jbv91GdMS7axgUJmjCysi
// marketId - 2hEeVE354k6mpvHvzg8K8HvEAkL9HUMiZbcjarkuy7W7
// marketId - HPU7v2yCGM6sRujWEMaTPiiiX2qMb6fun3eWjTzSgSw1
// marketId - 3iCYi5bQxXN5X4omCxME1jj9D91vNpYYqzbiSw9u7tcG

