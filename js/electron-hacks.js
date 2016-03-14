/** Quick hack so that if we're running under electron, `module` doesn't get defined, so
libraries like jquery/etc think they are still in the browser and work correctly. */
if (typeof module === 'object') {
  window.module = module; 
  module = undefined;
}
