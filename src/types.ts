export type CSSLoaderType = "css" | "postcss" | "sass" | "less" | "stylus";

export type CSSLoaderOption = Record<string, unknown>;

export type CSSLoaderOptions = Partial<Record<CSSLoaderType, CSSLoaderOption>>;

export type CSSConfiguration = {
  loaderOptions?: CSSLoaderOptions;
};

export type AppConfiguration = {
  outputDir?: string;

  assetsDir?: string;

  publicPath?: string;

  css?: CSSConfiguration;
};

export type CSSConfigHolder = {
  getLoaderOption(loaderType: CSSLoaderType): CSSLoaderOption;
};

export type AppConfigHolder = {
  getOutputDir(): string;
  getAssetsDir(): string;
  getPublicPath(): string;
  getCSSConfig(): CSSConfigHolder;
};

export type RawEnv = {
  NODE_ENV: string;
  BUILD_TIME: string;
  PUBLIC_URL: string;
  [key: string]: string | undefined;
};

export type StringifiedEnv = Record<string, Record<keyof RawEnv, string>>;

export type EnvHolder = {
  getRaw(): RawEnv;
  getStringified(): StringifiedEnv;
};
