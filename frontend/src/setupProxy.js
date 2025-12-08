module.exports = function(app) {
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
      res.setHeader(
        'Content-Security-Policy',
        "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * ws://* wss://*; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:;"
      );
    }
    next();
  });
};