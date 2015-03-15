/// <reference path="../../definitions/es6-promise.d.ts" />

module formsjs {

  export class ValidationService {

    protected strings_:Strings;

    constructor(strings?:Strings) {
      this.strings_ = strings || new Strings();
    }

    public get strings():Strings {
      return this.strings_;
    }
    public set strings(value:Strings) {
      this.strings_ = value;
    }

    /*
     public validate(formData:any, validationSchema:ValidationSchema):Promise<any> {
     var flattenedFieldNames:Array<string> = Flatten.flatten(formData);

     flattenedFieldNames.forEach((fieldName:string) => {
     this.validateField(fieldName, formData, validationSchema);
     });

     return null; // TODO
     }
     */

    /**
     * Validates an individual attribute (specified by fieldName) according to the provided validation rules.
     *
     * @param fieldName Name of attribute in formData object
     * @param formData Form data
     * @param validationSchema See {@link ValidationSchema}
     * @returns Promise that resolves/rejects based on validation outcome.
     */
    public validateField(fieldName:string, formData:any, validationSchema:ValidationSchema):Promise<any> {
      // TODO Sanitize/escape incoming fieldName to avoid disallowed characters (e.g. ".", "[0]")
      // See https://github.com/bvaughn/angular-form-for/blob/type-script/source/utils/nested-object-helper.ts#L30

      var value:any = formData[fieldName];
      var validatableAttribute:ValidatableAttribute = validationSchema[fieldName];

      var promise:Promise<any> =
        new ValidationPromiseBuilder()
          .add(new RequiredValidator(this.strings).validate(value, formData, validatableAttribute))
          .add(new TypeValidator(this.strings).validate(value, formData, validatableAttribute))
          .add(new MinMaxValidator(this.strings).validate(value, formData, validatableAttribute))
          .add(new EnumValidator(this.strings).validate(value, formData, validatableAttribute))
          .add(new PatternValidator(this.strings).validate(value, formData, validatableAttribute))
          .add(new CustomValidator(this.strings).validate(value, formData, validatableAttribute))
          .build();

      return promise;
    }
  }
}