const params = require('..');
const koa = require('koa');
const bodyparser = require('koa-bodyparser');
const qs = require('koa-qs');

const app = koa();
qs(app); // required for nested query string objects
app.use(bodyparser()); // required for params to include request body objects
app.use(params());
app.use(function* () {
  this.body = this.params.all();
});
app.listen(3001);
