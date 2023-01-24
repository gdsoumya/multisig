import { connectTezAccount, getNextOperationIndex, submitMultisigOperation } from "../../library/tezos";

import { TezosMessageUtils } from "conseiljs";
import { useState } from "react";
import useStyles from "./style";

const Submit = () => {
  const classes = useStyles();
  const [count, setCount] = useState(1);
  const [opID, setOpID] = useState(0);
  const [rotateKeys, setRotateKeys] = useState(false);
  const handleSigs = (event) => {
    event.preventDefault();
    setCount(event.target.count.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const sigs = []
      for (let i = 1; i <= count; i++) {
        sigs.push({ signature: event.target[`signature${i}`].value, address: event.target[`address${i}`].value })

      }

      sigs.sort((a, b) => {
        console.log(TezosMessageUtils.writeAddress(a.address))
        // eslint-disable-next-line no-undef
        const a1 = BigInt("0x" + TezosMessageUtils.writeAddress(a.address))
        // eslint-disable-next-line no-undef
        const b1 = BigInt("0x" + TezosMessageUtils.writeAddress(b.address))

        if (a1 > b1) { return 1; }

        if (a1 < b1) { return -1; }

        return 0;
      })

      const client = await connectTezAccount();
      const opID = await getNextOperationIndex();

      await submitMultisigOperation(client, sigs, event.target.operation.value, rotateKeys ? 'rotate' : 'submit');

      alert("operation submitted")
      setOpID(opID);
    } catch (err) {
      console.log("Failed to submit operation", err)
      alert("Failed to submit operation")
    }
  };

  const renderForm = () => {
    let sigs = [];
    for (let i = 1; i <= count; i++) {
      sigs.push(
        <div key={`sigContainer${i}`}>
          <label htmlFor={`address${i}`} className={classes.label}>Address {i}</label>
          <input className={classes.input} type="text" name={`address${i}`} placeholder="Address" required />
          <label htmlFor={`signature${i}`} className={classes.label}>Signature {i}</label>
          <input className={classes.input} type="text" name={`signature${i}`} placeholder="Signature" required />
        </div>
      )
    }
    return (
      <form onSubmit={handleSubmit}>
        <label htmlFor="operation" className={classes.label}>Operation</label>
        <input className={classes.input} type="text" name="operation" placeholder="Operation" required />
        <br /><br />
        {sigs}

        <label htmlFor="rotateKeys" className={classes.label}>Rotate Keys?</label>
        <input
          type="checkbox"
          value={rotateKeys}
          onChange={() => setRotateKeys(!rotateKeys)}
          id="rotateKeys"
          name="rotateKeys"
        />
        <input className={classes.input} type="submit" value="Submit" />
      </form>
    )
  }
  return (
    <div className={classes.container}>
      <form onSubmit={handleSigs}>
        <label htmlFor="count" className={classes.label}>Signature Count</label>
        <input className={classes.input} type="number" min={1} name="count" placeholder="Signature Count" required />
        <input className={classes.input} type="submit" value="Set" />
      </form><br />
      {renderForm()}
      <div className={classes.opID}>Operation Index: {opID}</div>
    </div>
  );
};

export default Submit;
