#!/usr/bin/env node
/* This uses node.s to launch electron, so we can use NPM to
run this as a command (see package.json) */

// It just returns a path
var electronPath = require( 'electron-prebuilt' ) ;

var childProcess = require( 'child_process' ) ;

// Adjust the command line arguments: remove the "node <code.js>" part
console.log(process.argv);
var args = process.argv.slice( 2 ) ;  
// ... and insert the root path of our application (it's the parent directory)
// as the first argument
args.unshift( __dirname );
args.unshift( "./electron-app.js" );
console.log(args);

// Run electron
childProcess.spawn( electronPath , args , { stdio: 'inherit' } ) ;  
