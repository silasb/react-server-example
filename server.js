var http = require('http'),
    browserify = require('browserify'),
    literalify = require('literalify'),
    React = require('react'),
    // This is our React component, shared by server and browser thanks to browserify
    MyApp = require('./myApp')

var express = require('express');
var app = express();

var pub = __dirname + '/public';
app.use(express.static(pub));

app.set('view engine', 'jade');

app.set('views', __dirname + '/views');

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, 'Something broke!');
});

app.get('/', function(req, res) {
   var props = {items: [0, 1, '</script>', '<!--inject!-->']}

   var myAppHtml = React.renderComponentToString(MyApp(props))

   res.setHeader('Content-Type', 'text/html')

   res.render('index', {myAppHtml: {test: myAppHtml, props: safeStringify(props)}})
   // res.end(
   //    // <html>, <head> and <body> are for wusses

   //    // Include our static React-rendered HTML in our content div. This is
   //    // the same div we render the component to on the client side, and by
   //    // using the same initial data, we can ensure that the contents are the
   //    // same (React is smart enough to ensure no rendering will actually occur
   //    // on page load)
   //    '<div id=content>' + myAppHtml + '</div>' +

   //    // We'll load React from a CDN - you don't have to do this,
   //    // you can bundle it up or serve it locally if you like
   //    '<script src=//fb.me/react-0.9.0.min.js></script>' +

   //    // Then the browser will fetch the browserified bundle, which we serve
   //    // from the endpoint further down. This exposes our component so it can be
   //    // referenced from the next script block
   //    '<script src=/bundle.js></script>' +

   //    // This script renders the component in the browser, referencing it
   //    // from the browserified bundle, using the same props we used to render
   //    // server-side. We could have used a window-level variable, or even a
   //    // JSON-typed script tag, but this option is safe from namespacing and
   //    // injection issues, and doesn't require parsing
   //    '<script>' +
   //      'var MyApp = require("./myApp.js"), container = document.getElementById("content");' +
   //      'React.renderComponent(MyApp(' + safeStringify(props) + '), container)' +
   //    '</script>'
   //  )
})

app.get('/bundle.js', function(req, res) {
  res.setHeader('Content-Type', 'text/javascript')

  // Here we invoke browserify to package up our component.
  // DON'T do it on the fly like this in production - it's very costly -
  // either compile the bundle ahead of time, or use some smarter middleware
  // (eg browserify-middleware).
  // We also use literalify to transform our `require` statements for React
  // so that it uses the global variable (from the CDN JS file) instead of
  // bundling it up with everything else
  browserify()
    .transform(literalify.configure({react: 'window.React'}))
    .require('./myApp.js')
    .bundle()
    .pipe(res)
})

app.listen(3000)

// A utility function to safely escape JSON for embedding in a <script> tag
function safeStringify(obj) {
  return JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--')
}
