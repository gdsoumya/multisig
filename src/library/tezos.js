import { DAppClient, TezosOperationType } from "@airgap/beacon-sdk";
import { TezosMessageUtils, TezosNodeReader } from "conseiljs";
import { JSONPath } from "jsonpath-plus";

const config = require(`./config.${process.env.REACT_APP_ENV || "mainnet"}.json`);

export const connectTezAccount = async () => {
  const client = new DAppClient({ name: "Multisig" });
  const network = config.network === "mainnet" ? "mainnet" : "ghostnet";
  await client.requestPermissions({ network: { type: network } });
  const account = await client.getActiveAccount();

  console.log(`connected to ${network} at ${config.rpc} as ${account["address"]}`)

  return { client, account: account["address"] };
};

export const getNextOperationIndex = async () => {
  const multisigStorage = await TezosNodeReader.getContractStorage(config.rpc, config.multisigAddr);

  return (Number(JSONPath({ path: "$.args[0].args[0].int", json: multisigStorage })[0]) + 1);
};

export const composeTransferRequest = (
  chainId,
  operationIndex,
  sourceAddress,
  destinationAddress,
  tokenBalance
) => {
  return `{ "prim": "Pair", "args": [ { "string": "${chainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, [ { "prim": "DROP" }, { "prim": "NIL", "args": [ { "prim": "operation" } ] }, { "prim": "PUSH", "args": [ { "prim": "address" }, { "string": "${config.tokenAddr}" } ] }, { "prim": "CONTRACT", "args": [ { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "int" } ] } ] } ], "annots": [ "%transfer" ] }, { "prim": "IF_NONE", "args": [ [ { "prim": "PUSH", "args": [ { "prim": "int" }, { "int": "10" } ] }, { "prim": "FAILWITH" } ], [] ] }, { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "0" } ] }, { "prim": "PUSH", "args": [ { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "nat" } ] } ] }, { "prim": "Pair", "args": [ { "string": "${sourceAddress}" }, { "prim": "Pair", "args": [ { "string": "${destinationAddress}" }, { "int": "${tokenBalance}" } ] } ] } ] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" } ] ] } ] }`;
};

export const packTransferRequest = (
  chainId,
  operationIndex,
  sourceAddress,
  destinationAddress,
  tokenBalance
) => {
  const encodedChainId = TezosMessageUtils.writeBufferWithHint(
    chainId,
    "chain_id"
  ).toString("hex");

  const transferOperation = `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, [ { "prim": "DROP" }, { "prim": "NIL", "args": [ { "prim": "operation" } ] }, { "prim": "PUSH", "args": [ { "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(
    config.tokenAddr
  )}" } ] }, { "prim": "CONTRACT", "args": [ { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "int" } ] } ] } ], "annots": [ "%transfer" ] }, { "prim": "IF_NONE", "args": [ [ { "prim": "PUSH", "args": [ { "prim": "int" }, { "int": "10" } ] }, { "prim": "FAILWITH" } ], [] ] }, { "prim": "PUSH", "args": [ { "prim": "mutez" }, { "int": "0" } ] }, { "prim": "PUSH", "args": [ { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "pair", "args": [ { "prim": "address" }, { "prim": "nat" } ] } ] }, { "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(
    sourceAddress
  )}" }, { "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(
    destinationAddress
  )}" }, { "int": "${tokenBalance}" } ] } ] } ] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" } ] ] } ] }`;

  return TezosMessageUtils.writePackedData(transferOperation, "");
};

export const transferRequest = (
  chainId,
  operationIndex,
  sourceAddress,
  destinationAddress,
  tokenBalance
) => {
  return {
    operation: composeTransferRequest(
      chainId,
      operationIndex,
      sourceAddress,
      destinationAddress,
      tokenBalance
    ),
    bytes: packTransferRequest(
      chainId,
      operationIndex,
      sourceAddress,
      destinationAddress,
      tokenBalance
    ),
  };
};

export const composeMintRequest = (
  chainId,
  operationIndex,
  destinationAddress,
  tokenBalance
) => {
  return `{ "prim": "Pair", "args": [{ "string": "${chainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "string": "${config.tokenAddr}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }], "annots": ["%mint"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }, { "prim": "Pair", "args": [{ "string": "${destinationAddress}" }, { "int": "${tokenBalance}" }] }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;
};

export const packMintRequest = (
  chainId,
  operationIndex,
  destinationAddress,
  tokenBalance
) => {
  const encodedChainId = TezosMessageUtils.writeBufferWithHint(
    chainId,
    "chain_id"
  ).toString("hex");

  const mintOperation = `{ "prim": "Pair", "args": [{ "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(
    config.tokenAddr
  )}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }], "annots": ["%mint"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }, { "prim": "Pair", "args": [{ "bytes": "${TezosMessageUtils.writeAddress(
    destinationAddress
  )}" }, { "int": "${tokenBalance}" }] }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;

  return TezosMessageUtils.writePackedData(mintOperation, "");
};

export const mintRequest = (
  chainId,
  operationIndex,
  destinationAddress,
  tokenBalance
) => {
  return {
    operation: composeMintRequest(
      chainId,
      operationIndex,
      destinationAddress,
      tokenBalance
    ),
    bytes: packMintRequest(
      chainId,
      operationIndex,
      destinationAddress,
      tokenBalance
    ),
  };
};

export const composeBurnRequest = (
  chainId,
  operationIndex,
  destinationAddress,
  tokenBalance
) => {
  return `{ "prim": "Pair", "args": [{ "string": "${chainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "string": "${config.tokenAddr}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }], "annots": ["%burn"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }, { "prim": "Pair", "args": [{ "string": "${destinationAddress}" }, { "int": "${tokenBalance}" }] }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;
};

export const packBurnRequest = (
  chainId,
  operationIndex,
  destinationAddress,
  tokenBalance
) => {
  const encodedChainId = TezosMessageUtils.writeBufferWithHint(
    chainId,
    "chain_id"
  ).toString("hex");

  const burnOperation = `{ "prim": "Pair", "args": [{ "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(
    config.tokenAddr
  )}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }], "annots": ["%burn"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "pair", "args": [{ "prim": "address" }, { "prim": "nat" }] }, { "prim": "Pair", "args": [{ "bytes": "${TezosMessageUtils.writeAddress(
    destinationAddress
  )}" }, { "int": "${tokenBalance}" }] }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;

  return TezosMessageUtils.writePackedData(burnOperation, "");
};

export const burnRequest = (
  chainId,
  operationIndex,
  destinationAddress,
  tokenBalance
) => {
  return {
    operation: composeBurnRequest(
      chainId,
      operationIndex,
      destinationAddress,
      tokenBalance
    ),
    bytes: packBurnRequest(
      chainId,
      operationIndex,
      destinationAddress,
      tokenBalance
    ),
  };
};

export const composeSetAdminRequest = (
  chainId,
  operationIndex,
  destinationAddress
) => {
  return `{ "prim": "Pair", "args": [{ "string": "${chainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "string": "${config.tokenAddr}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "address" }], "annots": ["%setAdministrator"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "string": "${destinationAddress}" }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;
};

export const packSetAdminRequest = (
  chainId,
  operationIndex,
  destinationAddress
) => {
  const encodedChainId = TezosMessageUtils.writeBufferWithHint(
    chainId,
    "chain_id"
  ).toString("hex");

  const adminOperation = `{ "prim": "Pair", "args": [{ "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [{ "int": "${operationIndex}" }, [{ "prim": "DROP" }, { "prim": "NIL", "args": [{ "prim": "operation" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(
    config.tokenAddr
  )}" }] }, { "prim": "CONTRACT", "args": [{ "prim": "address" }], "annots": ["%setAdministrator"] }, { "prim": "IF_NONE", "args": [ [{ "prim": "PUSH", "args": [{ "prim": "int" }, { "int": "10" }] }, { "prim": "FAILWITH" }], [] ] }, { "prim": "PUSH", "args": [{ "prim": "mutez" }, { "int": "0" }] }, { "prim": "PUSH", "args": [{ "prim": "address" }, { "bytes": "${TezosMessageUtils.writeAddress(
    destinationAddress
  )}" }] }, { "prim": "TRANSFER_TOKENS" }, { "prim": "CONS" }] ] }] }`;

  return TezosMessageUtils.writePackedData(adminOperation, "");
};

export const setAdminRequest = (
  chainId,
  operationIndex,
  destinationAddress
) => {
  return {
    operation: composeSetAdminRequest(
      chainId,
      operationIndex,
      destinationAddress
    ),
    bytes: packSetAdminRequest(chainId, operationIndex, destinationAddress),
  };
};

export const composeKeyRotateRequest = (
    chainId,
    operationIndex,
    threshold,
    keys
  ) => {
    const encodedChainId = TezosMessageUtils.writeBufferWithHint(chainId, "chain_id").toString("hex");

    return `{ "prim": "Pair", "args": [ { "bytes": "${encodedChainId}" }, { "prim": "Pair", "args": [ { "int": "${operationIndex}" }, { "prim": "Pair", "args": [ { "int": "${threshold}" }, [ ${keys.map(k => `{ "bytes": "${TezosMessageUtils.writePublicKey(k)}" }`).join(', ')} ] ] } ] } ] }`;
  };
  
  export const packKeyRotateRequest = (chainId, operationIndex, threshold, keys) => {
    const operation = composeKeyRotateRequest(chainId, operationIndex, threshold, keys);
  
    return TezosMessageUtils.writePackedData(operation, "");
  };
  
  export const keyRotateRequest = (chainId, operationIndex, threshold, keys) => {
    return {
      operation: composeKeyRotateRequest(chainId, operationIndex, threshold, keys),
      bytes: packKeyRotateRequest(chainId, operationIndex, threshold, keys),
    };
  };

export const submitMultisigOperation = async (
  { client, account },
  signatures,
  operation,
  entrypoint = 'submit'
) => {
  const params = `{ "prim": "Pair", "args": [ [ ${signatures.map((s) =>`{ "prim": "Elt", "args": [{ "string": "${s.address}" }, { "string": "${s.signature}" }] }`).join(", ")} ], ${operation} ] }`;

  const res = await interact({ client, account }, [
    {
      to: config.multisigAddr,
      amtInMuTez: 0,
      entrypoint,
      parameters: params,
    },
  ]);
  if (res.status !== "applied") {
    throw new Error("TEZOS TX FAILED");
  }
  return res;
};

export const executeMultisigOperation = async ({ client, account }, id) => {
  const res = await interact({ client, account }, [
    {
      to: config.multisigAddr,
      amtInMuTez: 0,
      entrypoint: "execute",
      parameters: `{"int": "${id}"}`,
    },
  ]);
  if (res.status !== "applied") {
    throw new Error("TEZOS TX FAILED");
  }
  return res;
};

export const getChainID = async () => {
  return TezosNodeReader.getChainId(config.rpc);
};

export const interact = async (
  { client, account },
  operations,
  extraGas = 500,
  extraStorage = 50
) => {
  try {
    let ops = [];
    operations.forEach((op) => {
      ops.push({
        kind: TezosOperationType.TRANSACTION,
        amount: op.amtInMuTez,
        destination: op.to,
        source: account,
        parameters: {
          entrypoint: op.entrypoint,
          value: JSON.parse(op.parameters),
        },
      });
    });

    let head = 0;
    try { head = (await TezosNodeReader.getBlockHead(config.rpc)).header.level; } catch { }

    const result = await client.requestOperation({ operationDetails: ops, });

    if (head > 0) {
        try {
            await TezosNodeReader.awaitOperationConfirmation(config.rpc, head, result["transactionHash"], 7);
        } catch { }
    }

    return result["transactionHash"];
  } catch (err) {
    console.error(err);
    throw err;
  }
};
