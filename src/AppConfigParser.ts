import fs from "fs";
import path from "path";

import {
  AppConfigHolder,
  CSSLoaderOption,
  CSSLoaderOptions,
  CSSConfiguration,
  AppConfiguration,
  CSSConfigHolder,
  CSSLoaderType,
} from "./types";

const defaultCSSLoaderOptions: Required<CSSLoaderOptions> = {
  css: {},
  postcss: {},
  sass: {},
  less: {},
  stylus: {},
};

const defaultCSSConfiguration: Required<CSSConfiguration> = {
  loaderOptions: defaultCSSLoaderOptions,
};

const defaultAppConfiguration: Required<AppConfiguration> = {
  outputDir: "dist",
  assetsDir: "static",
  publicPath: "/",
  css: defaultCSSConfiguration,
};

class CSSConfigParser implements CSSConfigHolder {
  private loaderOptions: CSSLoaderOptions;

  constructor({ loaderOptions = {} }: CSSConfiguration = {}) {
    this.loaderOptions = loaderOptions;
  }

  public getLoaderOption(loaderType: CSSLoaderType): CSSLoaderOption {
    const currentLoaderOption = this.loaderOptions[loaderType];
    const defaultLoaderOption = defaultCSSLoaderOptions[loaderType];

    return currentLoaderOption
      ? { ...defaultLoaderOption, ...currentLoaderOption }
      : { ...defaultLoaderOption };
  }
}

export default class AppConfigParser implements AppConfigHolder {
  private outputDir?: string;

  private assetsDir?: string;

  private publicPath?: string;

  private css?: CSSConfigParser;

  constructor(private rootPath: string) {
    this.init();
  }

  private init() {
    const appConfigFilename = path.resolve(this.rootPath, "app.config.js");

    if (fs.existsSync(appConfigFilename)) {
      const {
        outputDir = "",
        assetsDir = "",
        publicPath = "",
        css = {},
      }: /* eslint-disable @typescript-eslint/no-var-requires */
      AppConfiguration = require(appConfigFilename);

      this.outputDir = outputDir;
      this.assetsDir = assetsDir;
      this.publicPath = publicPath;
      this.css = new CSSConfigParser(css);
    }
  }

  public getOutputDir(): string {
    return this.outputDir || defaultAppConfiguration.outputDir;
  }

  public getAssetsDir(): string {
    return this.assetsDir || defaultAppConfiguration.assetsDir;
  }

  public getPublicPath(): string {
    return this.publicPath || defaultAppConfiguration.publicPath;
  }

  public getCSSConfig(): CSSConfigHolder {
    return this.css || new CSSConfigParser();
  }
}
