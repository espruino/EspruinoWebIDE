(function($, window, document, undefined){

	var Splitster = function(el, options)
	{
		var self = this;
        var $el = $(el);

        // Setup instance
        self.el = el;
        self.opts = $.extend( {}, $.fn.splitster.defaults, options );

        // Initialize
        self._init();

        // Return configures component
        return self;
	}

	Splitster.prototype = {

		// Private methods
		_init: function()
		{
			var self = this;
			var $el = $(self.el);

			// Setup markup
			$el.addClass("splitster").addClass("splitster--" + self.opts.orientation);
			$el.find("> *").addClass("splitster__pane");
			$el.find("> *:first-child").after("<div class='splitster__bar' style='width:" + self.opts.barWidth + "px;height:" + self.opts.barWidth + "px;' />");

			self.pane1 = $el.find("> .splitster__pane:first-child").get(0);
			self.pane2 = $el.find("> .splitster__pane:last-child").get(0);
			self.bar = $el.find("> .splitster__bar").get(0);

			var dragOpts = self._getDraggableOptions();

			$(self.bar).draggable(dragOpts);

			if(self.opts.draggable){
				$(self.opts.draggable).draggable(dragOpts).addClass("splitster__draggable");
			}

			self._updateSplit();

			$(window).on("resize.splitster", function(){
				self._updateSplit();
			});
		},

		_getDraggableOptions: function()
		{
			var self = this;
			var $el = $(self.el);

			return {
				helper: "clone",
				containment: ".splitster",
				appendTo: ".splitster",
				axis: self.opts.orientation == "vertical" ? "x" : "y",
				cancel: "a",
				start: function(e, ui)
				{
					$(ui.helper).addClass("splitster__bar--ghost").empty();
				},
				stop: function(e, ui)
				{
					// Recalculate the split
					if(self.opts.orientation == "vertical")
					{
						var elWidth = $el.width();
						var offset = ui.position.left + (self.opts.barWidth / 2);
						self.opts.splitPos = (100 / elWidth) * offset;
					}
					else
					{
						var elHeight = $el.height();
						var offset = ui.position.top + (self.opts.barWidth / 2);
						self.opts.splitPos = (100 / elHeight) * offset;
					}

					// Update the split
					self._updateSplit();
				}
			};
		},

		_updateSplit: function()
		{
			var self = this;
			var $el = $(self.el);
			var $bar = $(self.bar);
			var $pane1 = $(self.pane1);
			var $pane2 = $(self.pane2);

			var halfBarWidth = self.opts.barWidth / 2;

			if(self.opts.orientation == "vertical")
			{
				var elWidth = $el.width();
				var splitPos = (elWidth / 100) * self.opts.splitPos;

				var pane1Width = Math.floor(splitPos - halfBarWidth);
				var pane2Width = elWidth - pane1Width - self.opts.barWidth;

				$pane1.css({
					"width": pane1Width + "px",
					"height": "100%",
					"top": 0,
					"left": 0
				});

				$pane2.css({
					"width": pane2Width + "px",
					"height": "100%",
					"top": 0,
					"left": (pane1Width + self.opts.barWidth) + "px"
				});

				$bar.css({
					"top": 0,
					"left": pane1Width + "px"
				});
			}
			else
			{
				var elHeight = $el.height();
				var splitPos = (elHeight / 100) * self.opts.splitPos;

				var pane1Height = Math.floor(splitPos - halfBarWidth);
				var pane2Height = elHeight - pane1Height - self.opts.barWidth;

				$pane1.css({
					"width": "100%",
					"height": pane1Height + "px",
					"top": 0,
					"left": 0
				});

				$pane2.css({
					"width": "100%",
					"height": pane2Height + "px",
					"top": (pane1Height + self.opts.barWidth) + "px",
					"left": 0
				});

				$bar.css({
					"top": pane1Height + "px",
					"left": 0
				});
			}
		},

		// Public methods
		orientation: function(orientation)
		{
			var self = this;
			var $el = $(self.el);

			// Add / remove classes
			$el.removeClass("splitster--" + self.opts.orientation);
			self.opts.orientation = orientation;
			$el.addClass("splitster--" + self.opts.orientation);

			// Change the dragging axis
			$(self.bar).draggable("option", "axis", self.opts.orientation == "vertical" ? "x" : "y");

			// Update the split
			self._updateSplit();
		},

		barWidth: function(barWidth)
		{
			var self = this;
			var $el = $(self.el);

			// Store new width
			self.opts.barWidth = barWidth;

			// Update bar size
			$(self.bar).css({"width":barWidth+"px", "height":barWidth+"px"});

			// Update the split
			self._updateSplit();
		},

		draggable: function(selector)
		{
			var self = this;
			var $el = $(self.el);

			// Destroy the current draggable
			if(self.opts.draggable)
			{
				$(self.opts.draggable).draggable("destroy").removeClass("splitster__draggable");
			}

			self.opts.draggable = selector;

			if(self.opts.draggable)
			{
				$(self.opts.draggable).draggable(self._getDraggableOptions()).addClass("splitster__draggable");
			}
		}

	}

	$.fn.splitster = function(o)
	{
		var args = arguments;
        if (typeof o === 'string') 
        {
            var api = this.splitsterApi();
            if (api[o]) 
            {
                return api[o].apply(api, Array.prototype.slice.call(args, 1));
            } 
            else 
            {
                $.error('Method ' + o + ' does not exist on jQuery.splitster');
            }
        }
        else if (typeof o === 'object' || !o) 
        {
            return this.each(function () 
            {
                $(this).data("splitster_api", new Splitster(this, o));
            });
        }
	}

	$.fn.splitsterApi = function () 
	{
        //ensure there's only 1
        if (this.length != 1) 
        {
            throw "Requesting the API can only match one element";
        }

        //ensure thsi is a splitster
        if (this.data("splitster_api") === null) 
        {
            return undefined;
        }

        return this.data("splitster_api");
    };

	$.fn.splitster.defaults = 
	{
	    orientation: "vertical",
	    barWidth: 6,
	    splitPos: 50
	};

}(jQuery, window, document));