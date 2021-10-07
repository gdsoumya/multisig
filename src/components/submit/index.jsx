import { connectTezAccount, getNextOperationIndex, submitMultisigOperation } from "../../library/tezos";

import { useState } from "react";
import useStyles from "./style";

const Submit = () => {
  const classes = useStyles();
  const [count, setCount] = useState(1);
  const [opID, setOpID] = useState(0);
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
      const client = await connectTezAccount()
      const opID = await getNextOperationIndex()
      await submitMultisigOperation(client, sigs, event.target.operation.value)
      alert("operation submitted")
      setOpID(opID)
    } catch (err) {
      console.log("Failed to submit operation", err)
      alert("Failed to submit operation")
    }
  };

  const renderForm = () => {
    let sigs = [];
    for (let i = 1; i <= count; i++) {
      sigs.push(
        <div>
          <label className={classes.label}>
            Address {i}:
          </label>
          <input className={classes.input} type="text" name={`address${i}`} placeholder="Address" required />
          <label className={classes.label}>
            Signature {i}:
          </label>
          <input className={classes.input} type="text" name={`signature${i}`} placeholder="Signature" required />
        </div>
      )
    }
    return (
      <form onSubmit={handleSubmit}>
        <br />
        <label className={classes.label}>
          Operation:
        </label>
        <input className={classes.input} type="text" name="operation" placeholder="Operation" required />
        <br /><br />
        {sigs}
        <input className={classes.input} type="submit" value="Submit" />
      </form>
    )
  }
  return (
    <div className={classes.container}>
      <form onSubmit={handleSigs}>
        <label className={classes.label}>
          Signature Count:
        </label>
        <input className={classes.input} type="number" min={1} name="count" placeholder="Signature Count" required />
        <input className={classes.input} type="submit" value="Submit" />
      </form><br />
      {renderForm()}
      <div className={classes.opID}>Your Operation Index: {opID}</div>
    </div>
  );
};

export default Submit;