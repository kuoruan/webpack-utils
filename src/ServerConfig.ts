import path from "path";

import { RunScriptWebpackPlugin } from "run-script-webpack-plugin";
import webpack from "webpack";
import { merge } from "webpack-merge";
import NodeExternals from "webpack-node-externals";

import BaseConfig from "./BaseConfig";
import NoopPlugin from "./NoopPlugin";

export default class ServerConfig extends BaseConfig {
  private devRunScript = true;

  private runScriptArgs: string[] = [];

  private target = "node";

  constructor(protected rootPath: string, private entry: string) {
    super(rootPath, true);
  }

  public setDevRunScript(run: boolean): ServerConfig {
    this.devRunScript = run;
    return this;
  }

  public setRunScriptArgs(args: string[]): ServerConfig {
    this.runScriptArgs = args.slice();
    return this;
  }

  public setTarget(target: string): ServerConfig {
    this.target = target;
    return this;
  }

  protected getCommonConfig(): webpack.Configuration {
    const baseCommon = super.getCommonConfig();

    const appConfig = this.getAppConfig();

    return merge(baseCommon, {
      name: "server",
      output: {
        path: path.resolve(this.rootPath, appConfig.getDistDir(), "server"),
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
      target: this.target,
      watch: this.isDevHMREnabled(),
      entry: [
        (this.isDevHMREnabled() && "webpack/hot/signal") || "",
        path.resolve(this.rootPath, this.entry),
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
      target: this.target,
      entry: path.resolve(this.rootPath, this.entry),
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
