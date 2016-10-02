/*
	Synchronizes two objects together using a strongly typed schema or creates a new object.
*/
var SyncMapJS = (function(){
	function SyncMapJS(){
		this.deleteMissingDPMPairs = true;
		this.deleteMatchingDPMPairs = false;
	}
	
	/*
		Synchronize two objects together or creates a new strongly typed object from the schema. 
		schema = the schema
		obj = the weakly typed object that contains the new properties.
		updateObj = the strongly typed object to be updated.
	*/
	SyncMapJS.prototype.syncObject = function(schema, obj, updateObj){
		return this.createTypedObjectTree(schema, obj, updateObj);
	}
	
	SyncMapJS.prototype.shallowMergeObject = function(obj, updateObj){
		for(var i in updateObj){
			obj[i] = updateObj[i];
		}
		return obj;
	}
	
	/*
		Creates a typed object and all of its children from the schema.
	*/
	SyncMapJS.prototype.createTypedObjectTree = function(schema, obj, updateObj){
		var typeObj = updateObj||this.createTypedObject(schema.type);
		for(var key in schema.properties){
			var property = schema.properties[key];
			switch(property.type){
				case "Number":
				case "String":
				case "Boolean":
					if(obj[key]!==undefined&&obj[key]!==null){
						typeObj[key] = obj[key];
					}
				break;
				case "Object":
					typeObj[key] = this.createTypedObjectTree(property, obj[key], typeObj[key]);
				break;
				case "Array":
					if(obj[key]){
						typeObj[key] = this.createTypedArray(property.items, obj[key]);
					}
				break;
				case "DPM":
					this.createTypedDynamicPropertyMapping(property.items, property.mapping, obj, typeObj);
				break;
				default:
					if(obj[key]){
						typeObj[key] = this.createTypedObjectTree(property, obj[key], updateObj?updateObj[key]:null);
					}
			}
		}
		return typeObj;
	}
	
	/*
		Creates a typed dynamic property mapping from the schema so associative arrays can be used.
	*/
	SyncMapJS.prototype.createTypedDynamicPropertyMapping = function(schema, mapping, obj, typeObj){
		if(typeObj && this.deleteMissingDPMPairs){
			for(var key in typeObj){
				if(!obj[key]){
					delete typeObj[key];
				}
			}
		}
		
		if(typeObj && this.deleteMatchingDPMPairs){
			for(var key in obj){
				console.log(typeObj[key]);
				if(typeObj[key]){
					delete typeObj[key];
				}
			}
			return;
		}
		
		for(var key in obj){
			if(mapping.test(key)){
				switch(schema.type){
					case "Number":
					case "String":
					case "Boolean":
						if(obj[key]!==undefined&&obj[key]!==null){
							typeObj[key] = obj[key];
						}
					break;
					case "Array":
						if(obj[key]){
							typeObj[key] = this.createTypedArray(schema.items, obj[key]);
						}
					break;
					default:
						if(obj[key]){
							typeObj[key] = this.createTypedObjectTree(schema, obj[key], typeObj?typeObj[key]:null);
						}
				}
			}
		}
	}

	/*
		Creates a typed array from the schema.
	*/
	SyncMapJS.prototype.createTypedArray = function(schema, array){
		switch(schema.type){
			case "Number":
			case "String":
			case "Boolean":
				return array;
			case "Array":
				var typeArray = [];
				for(var i=0;i<array.length;i++){
					typeArray.push(this.createTypedArray(schema.items, array[i]));
				}
				return typeArray;
			default:
				var typeArray = [];
				for(var i=0;i<array.length;i++){
					typeArray.push(this.createTypedObjectTree(schema, array[i], this.createTypedObject(schema.type)));
				}
				return typeArray;
		}
	}
	
	/*
		Creates a new typed object.
	*/
	SyncMapJS.prototype.createTypedObject = function(type){
		var classRef = typeof global==="undefined"?window:global;
		return new classRef[type]();
	}
	
	SyncMapJS.prototype.createSyncObject = function(schema, typeObj){
		return this.createObjectTree(schema, typeObj);
	}
	
	SyncMapJS.prototype.createObjectTree = function(schema, typeObj){
		var obj = {};
		
		for(var key in schema.properties){
			var property = schema.properties[key];
			switch(property.type){
				case "Number":
				case "String":
				case "Boolean":
					obj[key] = typeObj[key];
				break;
				case "Array":
					obj[key] = this.createArray(property.items, typeObj[key]);
				break;
				case "DPM":
					this.createObjectDynamicPropertyMapping(property.items, property.mapping, obj, typeObj);
				break;
				default:
					obj[key] = this.createObjectTree(property, typeObj[key]);
			}
		}
		return obj;
	}
	
	SyncMapJS.prototype.createArray = function(schema, array){
		switch(schema.type){
			case "Number":
			case "String":
			case "Boolean":
				return array;
			case "Array":
				var typeArray = [];
				for(var i=0;i<array.length;i++){
					typeArray.push(this.createArray(schema.items, array[i]));
				}
				return typeArray;
			default:
				var typeArray = [];
				for(var i=0;i<array.length;i++){
					typeArray.push(this.createObjectTree(schema, array[i]));
				}
				return typeArray;
		}
	}
	
	SyncMapJS.prototype.createObjectDynamicPropertyMapping = function(schema, mapping, obj, typeObj){
		for(var key in typeObj){
			if(mapping.test(key)){
				switch(schema.type){
					case "Number":
					case "String":
					case "Boolean":
						obj[key] = typeObj[key];
					break;
					case "Array":
						obj[key] = this.createArray(schema.items, typeObj[key]);
					break;
					default:
						obj[key] = this.createObjectTree(schema, typeObj[key]);
				}
			}
		}
	}
	
	return SyncMapJS;
})();

if (typeof window === 'undefined') {
	module.exports = SyncMapJS;
}