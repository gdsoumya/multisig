import useStyles from "./style";

const Header = () => {
  const classes = useStyles();
  return (
    <div className={classes.header}>
      <div className={classes.container}>
        <h1 className={classes.title}>MultiSig</h1>
        <div className={classes.menu}>
          <a href="/create" className={classes.menuItem}>
            Create
          </a>
          <a href="/Submit" className={classes.menuItem}>
            Submit
          </a>
          <a href="/execute" className={classes.menuItem}>
            Execute
          </a>
          <a href="/rotate" className={classes.menuItem}>
            Rotate
          </a>
        </div>
      </div>
    </div>
  );
};

export default Header;
