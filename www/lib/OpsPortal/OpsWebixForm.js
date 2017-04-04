
steal(
	// List your Controller's dependencies here:
	//        'OpsPortal/models/Projects.js',
	//        'appdev/widgets/ad_delete_ios/ad_delete_ios.js',
	// '//OpsPortal/views/OpsButtonBusy/OpsButtonBusy.ejs',
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
			AD.op.WebixForm = {


				/**
				 *  @function formDefinition
				 *
				 * generate a webix form definition from a given Model object.
				 *
				 * @codestart
				 *  var form = AD.op.WebixForm(Model, {
				 *      init: { view:'form', id :'formModel1'},
				 *      labels: { field_1:'Field One', field_2:'Field Two' },
				 *      ignoreFields: [ 'field_3', 'field_4' ]
				 *  })
				 * @codeend
				 */
				definition: function(Model, options) {

					options = options || { labels: {}, ignoreFields: [] };

					var config = options.init || { view: "form" };

					// must have view='form'
					config.view = config.view || 'form';

					// defaults for labels, ignoreFields
					options.labels = options.labels || {};
					options.ignoreFields = options.ignoreFields || [];


					// if no id given, then auto generate one:
					if (typeof config.id == 'undefined') {
						config.id = 'form' + AD.util.uuid();
					}


					// now build the Form Elements:
					config.elements = [];
					var fields = Model.describe();
					for (var f in fields) {
						if (options.ignoreFields.indexOf(f) == -1) {

							var el = {};
							switch (fields[f]) {
								case 'string':
								case 'text':
									el.view = 'text';
									break;

								case 'date':
									el.view = 'datepicker';
									el.timepicker = false;
									break;

								case 'datetime':
									el.view = 'datepicker';
									el.timepicker = true;
									break;

								default:
									el.view = 'text';
									break;
							}

							el.name = f;

							el.label = options.labels[f] || f;

							config.elements.push(el);
						}
					}


					// build rules
					config.rules = {};
					for (var f in Model.validations) {
						var rules = Model.validations[f];
						var rule = '';
						rules.forEach(function(r) {
							switch (r) {
								case 'notEmpty':
									rule = 'isNotEmpty';
									break;

								case 'email':
									rule = 'isEmail';
									break;

								case 'finite':
								case 'int':
								case 'integer':
								case 'float':
									rule = 'isNumber';
									break;

							}
						})

						if (rule != '') {
							config.rules[f] = rule;
						}
					}


					return config;
				},


				/**
				 * @function isValidationError
				 *
				 * scans the given error to see if it is a sails' respone about an invalid
				 * value from one of the form elements.
				 *
				 * @codestart
				 * var form = $$('formID');
				 * var values = form.getValues();
				 * model.attr(values);
				 * model.save()
				 * .fail(function(err){
				 *     if (!AD.op.WebixForm.isValidationError(err, form)) {
				 *         AD.error.log('Error saving current model ()', {error:err, values:values});
				 *     }
				 * })
				 * .then(function(newData){
				 * 
				 * });
				 * @codeend
				 *
				 * @param {obj} error  the error response object
				 * @param {obj} form   the webix form instance (or reference)
				 * @return {bool}      true if error was about a form element.  false otherwise.
				 */
				isValidationError: function(error, form) {

					// console.error('... isValidationError(): ', error);

					if (error) { 

						// dig down to sails provided error object:
						if ((error.error)
							&& (error.error == 'E_UNKNOWN')
							&& (error.raw)
							&& (error.raw.length > 0)) {

							error = error.raw[0]
						}

						// drill down to the embedded .err object if it exists
						if (error.err) {
							error = error.err;
						}


						if (((error.error)
								&& (error.error == 'E_VALIDATION'))
							|| ((error.code) && (error.code == 'E_VALIDATION'))) {

							var attrs = error.invalidAttributes;
							if (attrs) {

								var wasForm = false;
								for (var attr in attrs) {

									// if this is a field in the form:
									if (form.elements[attr]) {

										var errors = attrs[attr];
										var msg = [];
										errors.forEach(function(err) {
											msg.push(err.message);
										})

										form.markInvalid(attr, msg.join(', '));
										wasForm = true;
									}

								}

								if (wasForm) {
									return true;
								}
							}

						}
					}

					// if we missed updating our form with an error
					// this was not a validation error so return false
					return false


				}



			};

		});
	});