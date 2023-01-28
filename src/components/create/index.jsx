import { MenuItem, Select } from "@material-ui/core";
import { burnIndexedRequest, burnRequest, connectTezAccount, getChainID, getNextOperationIndex, mintIndexedRequest, mintRequest, keyRotateRequest, setAdminRequest } from "../../library/tezos";

import { SigningType } from "@airgap/beacon-sdk";
import { useState } from "react";
import useStyles from "./style";

const config = require(`../../library/config.${process.env.REACT_APP_ENV || "mainnet"}.json`);

const Create = () => {
  const classes = useStyles();
  const [operation, setOperation] = useState('mint');
  const [opData, setOpData] = useState('operation data');
  const [sig, setSig] = useState('your signature');
  const [tokenAddress, setTokenAddress] = useState(config.tokens[0].tokenAddr);
  const handleChange = (event) => {
    setOperation(event.target.value);
  };

  const handleMint = async (event) => {
    event.preventDefault();
    try {
      const tokenRecord = config.tokens.filter(t => t.tokenAddr === tokenAddress)[0];
      const multisigAddr = tokenRecord.multisigAddr;
      const tokenType = tokenRecord.tokenType ?? 'FA1.2';

      const [chainID, opID, { client, account }] = await Promise.all([getChainID(), getNextOperationIndex(multisigAddr), connectTezAccount()]);
      const data =
        tokenType === 'FA1.2' ?
        mintRequest(chainID, opID, tokenAddress, event.target.address.value, event.target.amount.value)
        : mintIndexedRequest(chainID, opID, tokenAddress, tokenRecord.tokenIndex, event.target.address.value, event.target.amount.value);
      const sig = await client.requestSignPayload({ signingType: SigningType.MICHELINE, payload: data.bytes });
      setSig(sig.signature)
      setOpData(data.operation)
    } catch (err) {
      console.log("Failed to create operation", err)
      alert("Failed to create operation")
    }
  };

  const mintBurn = (handler) => {
    return (
      <form onSubmit={handler}>
        <label className={classes.label}>
          Address:
        </label>
        <input className={classes.input} type="text" name="address" placeholder="Address" required />
        <label className={classes.label}>
          Amount:
        </label>
        <input className={classes.input} type="number" name="amount" placeholder="Amount" required />
        <input className={classes.input} type="submit" value="Sign" />
      </form>
    )
  }

  const handleBurn = async (event) => {
    event.preventDefault();
    try {
      const tokenRecord = config.tokens.filter(t => t.tokenAddr === tokenAddress)[0];
      const multisigAddr = tokenRecord.multisigAddr;
      const tokenType = tokenRecord.tokenType ?? 'FA1.2';

      const [chainID, opID, { client, account }] = await Promise.all([getChainID(), getNextOperationIndex(multisigAddr), connectTezAccount()])
      const data =
        tokenType === 'FA1.2' ?
          burnRequest(chainID, opID, tokenAddress, event.target.address.value, event.target.amount.value)
          : burnIndexedRequest(chainID, opID, tokenAddress, tokenRecord.tokenIndex, event.target.address.value, event.target.amount.value);
      const sig = await client.requestSignPayload({ signingType: SigningType.MICHELINE, payload: data.bytes });
      setSig(sig.signature)
      setOpData(data.operation)
    } catch (err) {
      console.log("Failed to create operation", err)
      alert("Failed to create operation")
    }
  };

  const rotateKeysForm = (handler) => {
    return (
      <form onSubmit={handler}>
        <label htmlFor="threshold" className={classes.label}>Threshold</label>
        <input className={classes.input} type="number" name="threshold" placeholder="2" required />
        <label htmlFor="keys" className={classes.label}>Keys</label>
        <input className={classes.input} type="text" name="keys" placeholder="edpk..., edpk..., edpk..." required />
        <input className={classes.input} type="submit" value="Sign" />
      </form>
    )
  }

  const handleRotateKeys = async (event) => {
    event.preventDefault();
    try {
      const multisigAddr = config.tokens.filter(t => t.tokenAddr === tokenAddress)[0].multisigAddr;
      const [chainID, opID, { client, account }] = await Promise.all([getChainID(), getNextOperationIndex(multisigAddr), connectTezAccount()])
      const data = keyRotateRequest(chainID, opID, event.target.threshold.value, event.target.keys.value.split(',').map(k => k.trim()))
      const sig = await client.requestSignPayload({ signingType: SigningType.MICHELINE, payload: data.bytes });
      setSig(sig.signature)
      setOpData(data.operation)
    } catch (err) {
      console.log("Failed to create operation", err)
      alert("Failed to create operation")
    }
  };

  const handleSetAdmin = async (event) => {
    event.preventDefault();
    try {
      const multisigAddr = config.tokens.filter(t => t.tokenAddr === tokenAddress)[0].multisigAddr;
      const [chainID, opID, { client, account }] = await Promise.all([getChainID(), getNextOperationIndex(multisigAddr), connectTezAccount()])
      const data = setAdminRequest(chainID, opID, event.target.admin.value)
      const sig = await client.requestSignPayload({ signingType: SigningType.MICHELINE, payload: data.bytes });
      setSig(sig.signature)
      setOpData(data.operation)
    } catch (err) {
      console.log("Failed to create operation", err)
      alert("Failed to create operation")
    }
  };

  const setAdmin = () => {
    return (
      <form onSubmit={handleSetAdmin}>
        <label className={classes.label}>
          Admin:
        </label>
        <input className={classes.input} type="text" name="admin" placeholder="New Admin Address" required />
        <input className={classes.input} type="submit" value="Sign" />
      </form>
    )
  }

  const renderForm = () => {
    switch (operation) {
      case "mint": return mintBurn(handleMint);
      case "burn": return mintBurn(handleBurn);
      case "setadmin": return setAdmin();
      case "rotatekeys": return rotateKeysForm(handleRotateKeys);
      default: return mintBurn(handleMint);
    }
  };

  return (
    <div className={classes.container}>
      <label htmlFor="token" className={classes.label}>Token</label>
      <Select
            className={classes.select}
            labelId="token"
            id="token"
            value={tokenAddress}
            label="token"
            onChange={(event) => { setTokenAddress(event.target.value) }}
        >
        {config.tokens.map(token => <MenuItem key={`menuItem${token.tokenName}`} value={token.tokenAddr}>{token.tokenName}</MenuItem>)}
      </Select>

      <label htmlFor="operations" className={classes.label}>Action</label>
      <Select
        className={classes.select}
        labelId="operations"
        id="operations"
        value={operation}
        label="Operation"
        onChange={handleChange}
      >
        <MenuItem value={"mint"}>Mint</MenuItem>
        <MenuItem value={"burn"}>Burn</MenuItem>
        <MenuItem value={"setadmin"}>Set Admin</MenuItem>
        <MenuItem value={"rotatekeys"}>Rotate Keys</MenuItem>
      </Select>

      {renderForm()}

      <div className={classes.display}>
        <label htmlFor="operation" className={classes.label}>Operation</label>
        <textarea name="operation" className={classes.input} readOnly style={{width: "600px"}} value={opData}></textarea>
        <br />
        <label htmlFor="signature" className={classes.label}>Signature</label>
        <input name="signature" className={classes.input} type="text" value={sig} readOnly style={{width: "600px"}}/>
      </div>
    </div>
  );
};

export default Create;
