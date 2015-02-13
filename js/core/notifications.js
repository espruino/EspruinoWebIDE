/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.
 
 ------------------------------------------------------------------
  Display Notifications
 ------------------------------------------------------------------
**/
"use strict";

(function() {

  function init()
  {
    toastr.options = {
      "closeButton": false,
      "debug": false,
      "positionClass": "toast-bottom-right",
      "onclick": null,
      "showDuration": "300",
      "hideDuration": "1000",
      "timeOut": "5000",
      "extendedTimeOut": "5000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    }
  }

  Espruino.Core.Notifications = {
      init : init,
      success: function(msg, setStatus)
      {
        toastr.success(msg);
        Espruino.callProcessor("notification",{type:"success",msg:msg},function(){});
        if(setStatus)
          Espruino.Core.Status.setStatus(msg);
      },
      error: function(msg, setStatus)
      {
        toastr.error(msg);
        Espruino.callProcessor("notification",{type:"error",msg:msg},function(){});
        if(setStatus)
          Espruino.Core.Status.setStatus(msg);
      },
      warning: function(msg, setStatus)
      {
        Espruino.callProcessor("notification",{type:"warning",msg:msg},function(){});
        toastr.warning(msg);
        if(setStatus)
          Espruino.Core.Status.setStatus(msg);
      },
      info: function(msg, setStatus)
      {
        Espruino.callProcessor("notification",{type:"info",msg:msg},function(){});
        toastr.info(msg);
        if(setStatus)
          Espruino.Core.Status.setStatus(msg);
      }
  };
  
})();
