const app = require("./src/app");

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`Express API listening on port ${port}`);
});
