/* global describe, beforeEach, afterEach, it */
var params = require('../..');
var koa = require('koa');
var bodyparser = require('koa-bodyparser');
var qs = require('koa-qs');
var axios = require('axios');
var should = require('should');

// should always return an instance

describe('koaMiddleware', function () {
  var ctx;

  beforeEach(function () {
    ctx = {};
    ctx.port = 3001;
    ctx.url = 'http://localhost:' + ctx.port;
    ctx.app = new koa(); // eslint-disable-line new-cap
    qs(ctx.app);
    ctx.app.use(bodyparser());
    ctx.app.use(function (ctx, next) {
      ctx.params = { id: 'id' };
      return next();
    });
    ctx.app.use(params.koaMiddleware());
  });

  afterEach(function () {
    ctx.server.close();
  });

  describe('req.parameters.all()', function () {
    it('should return `all` params', function (done) {
      ctx.app.use(function (ctx, next) {
        ctx.body = ctx.parameters.all();
      });
      ctx.server = ctx.app.listen(ctx.port);

      axios.post(ctx.url + '/?p1=1&p2=2', { a1: 1, a2: 2 }).then((res) => {
        should(res.data).eql({ a1: 1, a2: 2, p1: '1', p2: '2', id: 'id' });
        done();
      });
    });
  });

  describe('req.parameters.permit()', function () {
    it('should return `permit` selected params', function (done) {
      ctx.app.use(function (ctx, next) {
        ctx.body = ctx.parameters.permit('p1', 'a2').value();
      });
      ctx.server = ctx.app.listen(ctx.port);

      axios.post(ctx.url + '/?p1=1&p2=2', { a1: 1, a2: 2 }).then((res) => {
        should(res.data).eql({ p1: '1', a2: 2 });
        done();
      });
    });
  });

  describe('req.parameters.require()', function () {
    it('should return a `params` object of the required key', function (done) {
      ctx.app.use(function (ctx, next) {
        ctx.body = ctx.parameters.require('p1').all();
      });
      ctx.server = ctx.app.listen(ctx.port);

      axios.post(ctx.url + '/?p1[s1]=1&p2=2', { p1: { s2: 2 }, a2: 2 }).then((res) => {
        should(res.data).eql({ s2: 2, s1: '1' });
        done();
      });
    });

    it('should throw an exception if the required key does not exist', function (done) {
      ctx.app.use(async function (ctx, next) {
        try {
          await next();
        } catch (err) {
          ctx.response.status = 500;
          ctx.response.body = err.message;
        }
      });
      ctx.app.use(function (ctx, next) {
        ctx.body = ctx.parameters.require('xx').all();
      });
      ctx.server = ctx.app.listen(ctx.port);

      axios.post(ctx.url + '/?p1=1', { a1: 1 }).catch((err) => {
        should(err.response.status).eql(500);
        should(err.response.data).equal('param `xx` required');
        done();
      });
    });
  });
});
