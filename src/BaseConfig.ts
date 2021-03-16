import path from "path";

import { CleanWebpackPlugin } from "clean-webpack-plugin";
import ESLintPlugin from "eslint-webpack-plugin";
import StylelintPlugin from "stylelint-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";

import AppConfig from "./AppConfig";
import EnvHolder from "./EnvHolder";
import NoopPlugin from "./NoopPlugin";

export type EntryObject =
  | string
  | string[]
  | ((isDevelopment: boolean) => string | string[]);

export type TargetObject = string | ((isDevelopment: boolean) => string);

export default abstract class BaseConfig {
  private entry: string[] = [];

  private alias: Record<string, string> = {};

  private appConfig: AppConfig;

  private envHolder: EnvHolder;

  private dev: boolean;

  private devHMREnabled = true;

  private target: string;

  protected constructor(
    private rootPath: string,
    entry: EntryObject,
    private server: boolean = false
  ) {
    if (!process.env.NODE_ENV) {
      throw new Error(
        "The process.env.NODE_ENV environment variable is required but was not specified."
      );
    }

    const dev = process.env.NODE_ENV !== "production";

    const e = typeof entry === "function" ? entry(dev) : entry;

    this.entry = Array.isArray(e) ? e.slice() : Array.from<string>([e]);

    this.dev = dev;

    this.appConfig = new AppConfig(rootPath);

    this.envHolder = new EnvHolder(rootPath, this.appConfig);

    this.target = server ? "node" : "web";
  }

  protected setAlias(name: string, target: string): void {
    if (!name || !target) {
      throw new TypeError("invalid arguments");
    }

    this.alias[name] = target.startsWith("/")
      ? path.resolve(target)
      : path.resolve(this.rootPath, target);
  }

  protected setAliases(aliases: Record<string, string>): void {
    this.alias = {};

    for (const name in aliases) {
      let target: string;
      if (name && (target = aliases[name])) {
        this.setAlias(name, target);
      }
    }
  }

  protected setDevHMREnabled(enabled: boolean): void {
    this.devHMREnabled = enabled;
  }

  protected setTarget(target: TargetObject): void {
    this.target =
      typeof target === "function" ? target(this.dev) : String(target);
  }

  protected isServer(): boolean {
    return this.server;
  }

  protected isDevelopment(): boolean {
    return this.dev;
  }

  protected getTarget(): string {
    return this.target;
  }

  protected getRootPath(): string {
    return this.rootPath;
  }

  protected getEntry(): string[] {
    return this.entry.map((e) =>
      e.startsWith("/") ? path.resolve(e) : path.resolve(this.rootPath, e)
    );
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
        alias: this.alias,
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
                emitFile: !this.server,
                name: path.join(
                  assetsDir,
                  "img",
                  this.dev ? "[name].[ext]" : "[name].[contenthash:7].[ext]"
                ),
              },
            },
          },
          {
            test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
            use: {
              loader: "file-loader",
              options: {
                emitFile: !this.server,
                outputPath: path.join(assetsDir, "media"),
                name: this.dev
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
                  emitFile: !this.server,
                  outputPath: path.join(assetsDir, "img"),
                  name: this.dev
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
                  emitFile: !this.server,
                  outputPath: path.join(assetsDir, "fonts"),
                  name: this.dev
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
          __isClient__: JSON.stringify(!this.server),
          __isServer__: JSON.stringify(this.server),
        }),
      ],
      stats: {
        all: false,
        assets: true,
        assetsSort: "size",
        entrypoints: true,
        errors: true,
        timings: true,
        warnings: true,
      },
    };
  }

  protected getDevConfig(): webpack.Configuration {
    return {
      mode: "development",
      devtool: "eval-cheap-module-source-map",
      plugins: [
        (this.devHMREnabled && new webpack.HotModuleReplacementPlugin()) ||
          new NoopPlugin(),
        new ESLintPlugin({
          extensions: ["js", "jsx", "ts", "tsx"],
          emitError: true,
          emitWarning: true,
          failOnError: false,
          failOnWarning: false,
        }),
        new StylelintPlugin({
          emitError: true,
          emitWarning: true,
          failOnError: false,
          failOnWarning: false,
        }),
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
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              format: {
                comments: this.server ? false : "some",
              },
            },
            extractComments: false,
          }),
        ],
      },
    };
  }

  abstract toConfig(): webpack.Configuration;
}
