import { Refs } from 'ancient-refs';

var refs = new Refs({}, {});

CollectionExtensions.addExtension(function(name, options) {
	var collection = this;
	
	refs.storages[this._ref] = this;
	refs.getters[this._ref] = (id, callback) => {
	  var document = this.findOne(id);
	  if (callback && document) callback(document); 
	  return document;
	};
	
	this.helpers({
		ref() {
			return refs.generate(collection._ref, this._id);
		}
	});
});

export { refs };