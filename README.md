# koala-event

Manage NodeJS Events by extending EventEmitter to support Koa-like middleware.

## Install 

Currently not on NPM - just hosted here.

```
npm i cavejay/koala-event
```

## Usage

The KoalaEvent Class enables the equivalent of `koa.use(fn)`.
```js
var EventEmitter = require("events").EventEmitter;
const { KoalaEvent, EventRouter } = require("../koala-event");

var emitter = new EventEmitter();
var eventHandler = new KoalaEvent();

// This function will be run on all emitted events.
eventHandler.use(async function test1(ctx, next) {
  console.log("Print the event Context", ctx);
  await next();
});

/**
 * ctx provided to functions is: 
 * {
 *  event: <Original Event String>,
 *  data: <Original Event's accompanying data>
 * }
 */

// Once the middleware/.use()s are applied then, overwrite an emitter with the an emitter that handles 
// This is similar to Koa's callback()
emitter.emit = eventHandler.newEmitter(emitter);

// Proceed as normal
emitter.emit("test", "hi");
emitter.emit("something", "else");
emitter.emit("something", "else again");
```

The EventRouter Class is very similar to koa-mount's` mount('uri', fn)`. This is an effective replacement for normal events, but supports mutation of context through multiple listeners - similar to processing of a Koa request.

```js
var emitter = new EventEmitter();
const e = new EventRouter();

e.on("test", (ctx, next) => {
  console.log(ctx);
});

e.on("test", () => {
  console.log("I won't appear") // test's first middleware doesn't continue the flow"
})

e.on("something", (ctx, next) => {
  console.log(ctx);
  ctx.secret = "hi"; // Add the 'secret' after showing the initial ctx
  next(); // to continue processing listeners to the 'something' event
});

e.on("something", (ctx, next) => {
  console.log(ctx.secret); // the secret appended during an earlier middleware is present.
});

emitter.emit = e.newEmitter(emitter);

emitter.emit("test", "hi");
emitter.emit("something", "else");
emitter.emit("something", "again");
emitter.emit("nothing", 122); // nothing has no listener. We could make a global listener using .use (just like Koa) should we want to.
```