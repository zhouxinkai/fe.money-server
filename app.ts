import Koa = require('koa');
import routes from './routes';
import middlewares from './middlewares';
import compress = require('koa-compress');
import bodyParser = require('koa-bodyparser');

const app = new Koa();

app.use(compress());
app.use(bodyParser());
app.use(middlewares);
app.use(routes);

export default app;
