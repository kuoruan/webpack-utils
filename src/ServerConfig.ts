import path from "path";

import { RunScriptWebpackPlugin } from "run-script-webpack-plugin";
import webpack from "webpack";
import { merge } from "webpack-merge";
import NodeExternals from "webpack-node-externals";

import BaseConfig, { EntryObject, TargetObject } from "./BaseConfig";
import NoopPlugin from "./NoopPlugin";

export default class ServerConfig extends BaseConfig {
  private devRunScript = true;

  private runScriptArgs: string[] = [];

  constructor(rootPath: string, entry: EntryObject) {
    super(rootPath, entry, true);
  }

  public setDevRunScript(run: boolean): ServerConfig {
    this.devRunScript = run;
    return this;
  }

  public setRunScriptArgs(args: string[]): ServerConfig {
    this.runScriptArgs = args.slice();
    return this;
  }

  public setAlias(name: string, path: string): ServerConfig {
    super.setAlias(name, path);
    return this;
  }

  public setAliases(aliases: Record<string, string>): ServerConfig {
    super.setAliases(aliases);
    return this;
  }

  public setDevHMREnabled(enabled: boolean): ServerConfig {
    super.setDevHMREnabled(enabled);
    return this;
  }

  public setTarget(target: TargetObject): ServerConfig {
    super.setTarget(target);
    return this;
  }

  protected getCommonConfig(): webpack.Configuration {
    const baseCommon = super.getCommonConfig();

    const rootPath = this.getRootPath();

    const appConfig = this.getAppConfig();

    return merge(baseCommon, {
      name: "server",
      output: {
        path: path.resolve(rootPath, appConfig.getDistDir(), "server"),
        publicPath: appConfig.getPublicPath(),
      },
      module: {
        rules: [
          {
            test: /\.s?[ac]ss$/,
            use: "null-loader", // ignore css files
          },
        ],
      },
      node: {
        __dirname: false,
        __filename: false,
      },
    });
  }

  // https://docs.nestjs.com/recipes/hot-reload
  protected getDevConfig(): webpack.Configuration {
    const commonConfig = this.getCommonConfig();

    const baseDevConfig = super.getDevConfig();

    const appConfig = this.getAppConfig();

    return merge(commonConfig, baseDevConfig, {
      target: this.getTarget(),
      watch: this.isDevHMREnabled(),
      entry: [
        (this.isDevHMREnabled() && "webpack/hot/signal") || "",
        ...this.getEntry(),
      ].filter(Boolean),
      output: {
        filename: "[name].js",
        chunkFilename: path.join(
          appConfig.getAssetsDir(),
          "js",
          "[name].chunk.js"
        ),
      },
      externals: [
        NodeExternals({
          // load non-javascript files with extensions
          // https://github.com/liady/webpack-node-externals#how-can-i-bundle-required-assets-ie-css-files-from-node_modules
          allowlist: ["webpack/hot/signal", /\.(?!(?:jsx?|json)$).{1,5}$/i],
        }),
      ],
      plugins: [
        new webpack.WatchIgnorePlugin({
          paths: [/\.d\.ts$/],
        }),
        (this.devRunScript &&
          new RunScriptWebpackPlugin({
            name: "main.js",
            args: this.runScriptArgs,
            signal: true,
            restartable: true,
          })) ||
          new NoopPlugin(),
      ],
    });
  }

  protected getProdConfig(): webpack.Configuration {
    const commonConfig = this.getCommonConfig();

    const baseProdConfig = super.getProdConfig();

    const appConfig = this.getAppConfig();

    return merge(commonConfig, baseProdConfig, {
      target: this.getTarget(),
      entry: this.getEntry(),
      output: {
        filename: "[name].js",
        library: "[name]",
        chunkFilename: path.join(
          appConfig.getAssetsDir(),
          "js",
          "[name].[contenthash:7].chunk.js"
        ),
      },
    });
  }

  public toConfig(): webpack.Configuration {
    return this.isDevelopment() ? this.getDevConfig() : this.getProdConfig();
  }
}
