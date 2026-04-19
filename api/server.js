const { createApp } = require("../dist/app.cjs");

let appPromise = null;

async function getApp() {
  if (appPromise) return appPromise;
  appPromise = createApp().then(({ app }) => app);
  return appPromise;
}

module.exports = async (req, res) => {
  const app = await getApp();
  app(req, res);
};
