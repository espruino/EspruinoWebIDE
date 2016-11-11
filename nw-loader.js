#!/usr/bin/env node
/* This uses node.js to launch nw.js, so we can use NPM to
run this as a command (see package.json) */

// It just returns a path
var nwPath = require.resolve( 'nw/bin/nw' );
var childProcess = require( 'child_process' ) ;

// Adjust the command line arguments: remove the "node <code.js>" part
var args = process.argv.slice( 2 ) ;
// ... and insert the root path of our application as the first argument
args.unshift( __dirname );

// Run electron
console.log('Loading nw.js...');
console.log(nwPath);
var p = childProcess.spawn( nwPath , args , { stdio: 'inherit' } ) ;
// handle close
p.on('close', function(code) {
  console.log('Child process ended with code ' + code);
});
