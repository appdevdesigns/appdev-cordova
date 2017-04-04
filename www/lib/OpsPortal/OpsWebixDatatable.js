
steal(
	// List your Controller's dependencies here:
	function() {
		System.import('webix-opsportal').then(function() {

			// The OpsPortal will define a global namespace for our added utilities:
			if (typeof AD.op == 'undefined') AD.op = {};

			/**
			 * @class AD.op.WebixDatatable
			 * @parent can.Control
			 *
			 * Middleware to merge a can.List with a Webix Datatable/Datagrid component.
			 *
			 * The webix datatable should respond to changes posted in the List.
			 *
			 */
			AD.op.WebixDatatable = can.Control.extend({
				// Static Properties
			}, {

					// Instance Properties:

					init: function(element, options) {
						var _this = this;
						options = AD.defaults({

							webixConfig: {},     // passed directly to webix.datatable

						}, options);
						this.options = options;

						// Call parent init
						this._super(element, options);

						this.initDOM();
					},


					initDOM: function() {
						var _this = this;




					}



				});

		});
	});