// 1. init
const Web3 = require('web3');
const web3 = new Web3("wss://rinkeby.infura.io/ws/v3/744af3a0bd80453aab09e238f7b926a1");

// Create a contract with address of WETH:
const contractABI = require("./ABI.json");
const contractAddress = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
const contract = new web3.eth.Contract(contractABI, contractAddress);
// Query the balance of any wallet address

const getBalanceFunc = async (walletAddress) => {

    const balance = await web3.eth.getBalance(walletAddress);
    console.log(web3.utils.fromWei(balance)); // => 3.205916957829876507 (đúng)
    contract.methods
        .balanceOf(walletAddress)
        .call().then(result => {
            console.log(`${walletAddress}: `, web3.utils.fromWei(result)) // => 0 Sai
        })

}
getBalanceFunc("0xbe0eb53f46cd790cd13851d5eff43d12404d33e8");

//Create a function to query event “transfer” on the last 100 block
const getEvent = async () => {
    const lastest = await web3.eth.getBlockNumber();
    const result = await contract.getPastEvents("Transfer", {
        fromBlock: lastest - 100,
        toBlock: lastest
    })
    // console.log(result);
}
getEvent();
//Create a function to listen to event “transfer”
const listenEvent = async () => {
    const options = {
        fromBlock: 0
    }
    contract.events.Transfer(options)
        .on('data', event => console.log("data: ", event))
        .on('changed', changed => console.log("changed: ", changed))
        .on('error', err => console.log('error: ', err.message, err.stack))
        .on('connected', str => console.log("connected:", str))
}
// listenEvent();
// multicall
const {
    Multicall,
} = require('ethereum-multicall');
const multicall = new Multicall({ web3Instance: web3, tryAggregate: true });
const multicallSmartContract = async (walletAddresses) => {
    const contractCallContext = walletAddresses.map((address, i) => {
        return {
            reference: i,
            contractAddress,
            abi: contractABI,
            calls: [{ reference: 'balance' + i, methodName: 'balanceOf', methodParameters: [address] }]
        }
    });
    const balanceList = await multicall.call(contractCallContext);
    const balanceWallet = [];
    for (const [key, objRes] of Object.entries(balanceList.results)) {
        const balanceHex = objRes.callsReturnContext[0].returnValues[0].hex;
        balanceWallet.push({
            [walletAddresses[balanceWallet.length]]: web3.utils.fromWei(balanceHex)
        });
    }
    console.log(`WETH Wallet Balance: `, balanceWallet);
}
multicallSmartContract([
    '0x0bEe24D48E22A7a161D0B6B576775315890CE7C4',
    '0x7edB83209611f18386f67CDeE63BAEe695fA0aab',
    "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
    "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
    "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
    "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
    "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB",
    "0x617F2E2fD72FD9D5503197092aC168c91465E7f2",
    "0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678",
    "0x0A098Eda01Ce92ff4A4CCb7A4fFFb5A43EBC70DC",
]);