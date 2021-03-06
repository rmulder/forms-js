/// <reference path="../../definitions/es6-promise.d.ts" />

module formsjs {

  export class Flatten {

    /**
     * Return a (1-dimensional) array of keys representing an object.
     *
     * <p>For example, <code>{foo: {bar: 'baz'}}</code> will become flattened into <code>'['foo', 'foo.bar']</code>.
     *
     * <p>Arrays can also be flattened.
     * Their flattened keys will take the form of 'myArray[0]' and 'myArray[0].myNestedProperty'.
     */
    public static flatten(object:any):Array<string> {
      var keys:Array<string> = [];

      var innerFlatten = (data:any, prefix:string) => {
        var objectIsArray = Array.isArray(data);
        var prefix:string = prefix ? prefix + ( objectIsArray ? '[' : '.' ) : '';
        var suffix:string = objectIsArray ? ']' : '';

        if (data) {
          for (var prop in data) {
            var path:string = prefix + prop + suffix;
            var value:any = data[prop];

            if (typeof value === 'object') {
              innerFlatten(value, path);
            }

            keys.push(path);
          }
        }
      };

      innerFlatten(object, '');

      return keys;
    }

    /**
     * Returns the property value of the flattened key or undefined if the property does not exist.
     *
     * <p>For example, the key 'foo.bar' would return "baz" for the object <code>{foo: {bar: "baz"}}</code>.
     * The key 'foo[1].baz' would return 2 for the object <code>{foo: [{bar: 1}, {baz: 2}]}</code>.
     */
    public static read(flattenedKey:string, object:any):any {
      var keys:Array<string> = flattenedKey.split(/[\.\[\]]/);

      while (keys.length > 0) {
        var key:any = keys.shift();

        // Keys after array will be empty
        if (!key) {
          continue;
        }

        // Convert array indices from strings ('0') to integers (0)
        if (key.match(/^[0-9]+$/)) {
          key = parseInt(key);
        }

        // Short-circuit if the path being read doesn't exist
        if (!object.hasOwnProperty(key)) {
          return undefined;
        }

        object = object[key];
      }

      return object;
    }

    /**
     * Writes a value to the location specified by a flattened key and creates nested structure along the way as needed.
     *
     * <p>For example, writing "baz" to the key 'foo.bar' would result in an object <code>{foo: {bar: "baz"}}</code>.
     * Writing 3 to the key 'foo[0].bar' would result in an object <code>{foo: [{bar: 3}]}</code>.
     */
    public static write(value:any, flattenedKey:string, object:any):void {
      var currentKey:any;
      var keyIndexStart = 0;

      for (var charIndex = 0, length = flattenedKey.length; charIndex < length; charIndex++) {
        var character = flattenedKey.charAt(charIndex);

        switch(character) {
          case '[':
            currentKey = flattenedKey.substring(keyIndexStart, charIndex);

            this.createPropertyIfMissing_(currentKey, object, Array);
            break;
          case ']':
            currentKey = flattenedKey.substring(keyIndexStart, charIndex);
            currentKey = parseInt(currentKey); // Convert index from string to int

            // Special case where we're targeting this object in the array
            if (charIndex === length - 1) {
              object[currentKey] = value;
            } else {

              // If this is the first time we're accessing this Array key we may need to initialize it.
              if (!object[currentKey] && charIndex < length - 1) {
                switch(flattenedKey.charAt(charIndex + 1)) {
                  case '[':
                    object[currentKey] = [];
                    break;
                  case '.':
                    object[currentKey] = {};
                    break;
                }
              }

              object = object[currentKey];
            }
            break;
          case '.':
            currentKey = flattenedKey.substring(keyIndexStart, charIndex);

            // Don't do anything with empty keys that follow Array indices (e.g. anArray[0].aProp)
            if (currentKey) {
              this.createPropertyIfMissing_(currentKey, object, Object);
            }
            break;
          default:
            continue; // Continue to iterate...
            break;
        }

        keyIndexStart = charIndex + 1;

        if (currentKey) {
          object = object[currentKey];
        }
      }

      if (keyIndexStart < flattenedKey.length) {
        currentKey = flattenedKey.substring(keyIndexStart, flattenedKey.length);

        object[currentKey] = value;
      }
    }

    /**
     * Helper method for initializing a missing property.
     *
     * @throws Error if unrecognized property specified
     * @throws Error if property already exists of an incorrect type
     */
    private static createPropertyIfMissing_(key:string, object:any, propertyType:any):void {
      switch(propertyType) {
        case Array:
          if (!object.hasOwnProperty(key)) {
            object[key] = [];
          } else if (!(object[key] instanceof Array)) {
            throw Error('Property already exists but is not an Array');
          }
          break;
        case Object:
          if (!object.hasOwnProperty(key)) {
            object[key] = {};
          } else if (typeof object[key] !== 'object') {
            throw Error('Property already exists but is not an Object');
          }
          break;
        default:
          throw Error('Unsupported property type');
          break;
      }
    }
  }
}