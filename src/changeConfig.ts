import {ConfigFile} from '@salesforce/core';

export default class ChangeConfig extends ConfigFile<object> {

  public static getFileName() {
    return 'changeConfig.json';
  }

  public static getDefaultOptions(): ConfigFile.Options {
    return super.getDefaultOptions(true, ChangeConfig.getFileName());
  }

}
