
steal(
	// List your Controller's dependencies here:
	function() {
		System.import('webix-opsportal').then(function() {


			// The OpsPortal will define a global namespace for our added utilities:
			if (typeof AD.op == 'undefined') AD.op = {};

			/**
			 * @class AD.op.WebixSearch
			 * @parent 
			 *
			 * This is a generic OpsPortal helper for generating a search box that has
			 * some default settings.
			 *
			 * We return a standard Webix.ui(search) widget, but with some additional
			 * features:
			 *
			 */
			AD.op.WebixSearch = function(options) {
				/*
				{
					id:"searchuser",
					container:"search1",
					view:"search",
					placeholder:"Search ...",
					width:220
				}
				*/
				var mySearch = webix.ui(options);

				mySearch.attachEvent("onKeyPress", function(e) {
					// on key press triggers BEFORE the value is updated.
					// console.log('e:', e);
					var _this = this;

					// so let's give the control a chance to actually translate this
					// press into it's current value.
					AD.sal.setImmediate(function() {

						// get the current value
						var value = _this.getValue();

						// call each of our filters with our current value:
						mySearch.AD._filters.forEach(function(cb) {
							cb(value);
						})

					})

					// value = value.toLowerCase();

					// _this.dom.userGrid.filter(function(obj){ //here it filters data!
					//     return obj.username.toLowerCase().indexOf(value)>=0;
					// })
				});

				mySearch.AD = {
					_filters: []
				};


				/**
				 * @function AD.filter
				 * add a filter to call when the search box is being updated.
				 * @param {fn} cb : the function to call.  It takes 1 parameter: value
				 */
				mySearch.AD.filter = function(cb) {
					mySearch.AD._filters.push(cb);
				}



				return mySearch;
			};

		});
	});