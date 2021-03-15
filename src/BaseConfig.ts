import path from "path";

import { CleanWebpackPlugin } from "clean-webpack-plugin";
import StylelintPlugin from "stylelint-webpack-plugin";
import webpack from "webpack";

import AppConfig from "./AppConfig";
import EnvHolder from "./EnvHolder";

export default abstract class BaseConfig {
  private aliasMap: Map<string, string>;

  private appConfig: AppConfig;

  private envHolder: EnvHolder;

  private isDev: boolean;

  private devHMREnabled = true;

  protected constructor(
    protected rootPath: string,
    protected isServer: boolean = false
  ) {
    if (!process.env.NODE_ENV) {
      throw new Error(
        "The process.env.NODE_ENV environment variable is required but was not specified."
      );
    }

    this.isDev = process.env.NODE_ENV !== "production";

    this.aliasMap = new Map([
      ["@", path.resolve(rootPath, "./src")],
      ["~", path.resolve(rootPath)],
    ]);

    this.appConfig = new AppConfig(rootPath);

    this.envHolder = new EnvHolder(rootPath, this.appConfig);
  }

  public setAlias(
    alias: string,
    path: string | ((rootPath: string) => string)
  ): BaseConfig {
    if (!alias || !path) {
      throw new TypeError("invalid arguments");
    }

    let targetPath: string;
    if (typeof path === "function") {
      targetPath = String(path(this.rootPath));
    } else {
      targetPath = String(path);
    }

    this.aliasMap.set(alias, targetPath);
    return this;
  }

  public setDevHMREnabled(enabled: boolean): BaseConfig {
    this.devHMREnabled = enabled;
    return this;
  }

  public abstract setTarget(target: string): BaseConfig;

  protected isDevelopment(): boolean {
    return this.isDev;
  }

  protected getAppConfig(): AppConfig {
    return this.appConfig;
  }

  protected getEnvHolder(): EnvHolder {
    return this.envHolder;
  }

  public isDevHMREnabled(): boolean {
    return this.devHMREnabled;
  }

  protected getCommonConfig(): webpack.Configuration {
    const assetsDir = this.appConfig.getAssetsDir();

    const stringifiedEnv = this.envHolder.getStringified();

    return {
      resolve: {
        alias: Object.fromEntries<string>(this.aliasMap),
        roots: [this.rootPath],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      module: {
        rules: [
          {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                cacheDirectory: true,
              },
            },
          },
          {
            test: /\.js$/,
            enforce: "pre",
            use: "source-map-loader",
          },
          {
            test: /\.(png|jpe?g|gif)$/i,
            exclude: /node_modules/,
            use: {
              loader: "url-loader",
              options: {
                limit: 8192,
                emitFile: !this.isServer,
                name: path.join(
                  assetsDir,
                  "img",
                  this.isDev ? "[name].[ext]" : "[name].[contenthash:7].[ext]"
                ),
              },
            },
          },
          {
            test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
            use: {
              loader: "file-loader",
              options: {
                emitFile: !this.isServer,
                outputPath: path.join(assetsDir, "media"),
                name: this.isDev
                  ? "[name].[ext]"
                  : "[name].[contenthash:7].[ext]",
              },
            },
          },
          {
            test: /\.svg$/i,
            exclude: /node_modules/,
            use: [
              "@svgr/webpack",
              {
                loader: "url-loader",
                options: {
                  limit: 8192,
                  emitFile: !this.isServer,
                  outputPath: path.join(assetsDir, "img"),
                  name: this.isDev
                    ? "[name].[ext]"
                    : "[name].[contenthash:7].[ext]",
                },
              },
            ],
          },
          {
            test: /\.(woff2?|eot|ttf|otf)$/i,
            use: [
              {
                loader: "file-loader",
                options: {
                  emitFile: !this.isServer,
                  outputPath: path.join(assetsDir, "fonts"),
                  name: this.isDev
                    ? "[name].[ext]"
                    : "[name].[contenthash:7].[ext]",
                },
              },
            ],
          },
        ],
      },
      plugins: [
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin({
          ...stringifiedEnv,
          __isClient__: JSON.stringify(!this.isServer),
          __isServer__: JSON.stringify(this.isServer),
        }),
      ],
      stats: {
        all: false,
        assets: true,
        assetsSort: "!size",
        errors: true,
      },
    };
  }

  protected getDevConfig(): webpack.Configuration {
    return {
      mode: "development",
      devtool: "eval-cheap-module-source-map",
      module: {
        rules: [
          {
            test: /.[jt]sx?$/,
            exclude: /node_modules/,
            enforce: "pre",
            use: "eslint-loader",
          },
        ],
      },
      plugins: [
        new StylelintPlugin(),
        new webpack.HotModuleReplacementPlugin(),
      ],
    };
  }

  protected getProdConfig(): webpack.Configuration {
    return {
      mode: "production",
      devtool: "nosources-source-map",
      performance: {
        hints: false,
      },
      optimization: {
        minimize: true,
      },
    };
  }

  abstract toConfig(): webpack.Configuration;
}
