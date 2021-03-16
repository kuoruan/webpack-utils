import path from "path";

import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import AssetsPlugin from "assets-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";
import { merge } from "webpack-merge";

import BaseConfig, { EntryObject, TargetObject } from "./BaseConfig";

export default class ClientConfig extends BaseConfig {
  constructor(rootPath: string, entry: EntryObject) {
    super(rootPath, entry, false);
  }

  public setAlias(name: string, path: string): ClientConfig {
    super.setAlias(name, path);
    return this;
  }

  public setAliases(aliases: Record<string, string>): ClientConfig {
    super.setAliases(aliases);
    return this;
  }

  public setDevHMREnabled(enabled: boolean): ClientConfig {
    super.setDevHMREnabled(enabled);
    return this;
  }

  public setTarget(target: TargetObject): ClientConfig {
    super.setTarget(target);
    return this;
  }

  protected getCommonConfig(): webpack.Configuration {
    const baseCommon = super.getCommonConfig();

    const rootPath = this.getRootPath();

    const appConfig = this.getAppConfig();

    return merge(baseCommon, {
      name: "client",
      target: this.getTarget(),
      output: {
        path: path.resolve(rootPath, appConfig.getDistDir(), "client"),
        publicPath: appConfig.getPublicPath(),
      },
      module: {
        rules: [
          {
            test: /\.css$/,
            use: [
              this.isDevelopment()
                ? "style-loader"
                : MiniCssExtractPlugin.loader,
              "css-loader",
              "postcss-loader",
            ],
          },
          {
            test: /\.s[ac]ss$/,
            exclude: /node_modules/,
            use: [
              this.isDevelopment()
                ? "style-loader"
                : MiniCssExtractPlugin.loader,
              "css-loader",
              "postcss-loader",
              {
                loader: "sass-loader",
                options: {
                  additionalData: appConfig.getSassAdditionalData(),
                },
              },
            ],
          },
        ],
      },
      plugins: [
        new CopyPlugin({
          patterns: [
            {
              from: "**/*",
              context: path.resolve(rootPath, "public"),
              noErrorOnMissing: true,
            },
          ],
        }),
      ],
    });
  }

  protected getDevConfig(): webpack.Configuration {
    const commonConfig = this.getCommonConfig();

    const baseDevConfig = super.getDevConfig();

    const appConfig = this.getAppConfig();

    return merge(commonConfig, baseDevConfig, {
      entry: [
        (this.isDevHMREnabled() && "webpack-hot-middleware/client") || "",
        ...this.getEntry(),
      ].filter(Boolean),
      output: {
        filename: path.join(appConfig.getAssetsDir(), "js", "[name].js"),
        chunkFilename: path.join(
          appConfig.getAssetsDir(),
          "js",
          "[name].chunk.js"
        ),
      },
      infrastructureLogging: {
        level: "none",
      },
      plugins: [
        new ReactRefreshWebpackPlugin({
          overlay: {
            sockIntegration: "whm",
          },
        }),
        new ForkTsCheckerWebpackPlugin(),
      ],
    });
  }

  protected getProdConfig(): webpack.Configuration {
    const commonConfig = this.getCommonConfig();

    const baseProdConfig = super.getProdConfig();

    const rootPath = this.getRootPath();

    const appConfig = this.getAppConfig();

    return merge(commonConfig, baseProdConfig, {
      entry: this.getEntry(),
      output: {
        filename: path.join(
          appConfig.getAssetsDir(),
          "js",
          "[name].[contenthash:7].js"
        ),
        chunkFilename: path.join(
          appConfig.getAssetsDir(),
          "js",
          "[name].[contenthash:7].chunk.js"
        ),
      },
      optimization: {
        runtimeChunk: true,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "react",
              priority: 10,
            },
            redux: {
              test: /[\\/]node_modules[\\/](redux|react-redux|redux-thunk)[\\/]/,
              name: "redux",
            },
          },
        },
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: path.join(
            appConfig.getAssetsDir(),
            "css",
            "[name].[contenthash:7].css"
          ),
          chunkFilename: path.join(
            appConfig.getAssetsDir(),
            "css",
            "[name].[contenthash:7].chunk.css"
          ),
        }),
        new CompressionPlugin({
          algorithm: "gzip",
          filename: "[path][base].gz[query]",
          test: /\.(js|css)$/,
          minRatio: 0.8,
          threshold: 8192,
        }),
        new AssetsPlugin({
          path: path.resolve(rootPath, appConfig.getDistDir()),
          filename: "assets.json",
          useCompilerPath: false,
          fullPath: true,
          entrypoints: true,
        }),
      ],
    });
  }

  public toConfig(): webpack.Configuration {
    return this.isDevelopment() ? this.getDevConfig() : this.getProdConfig();
  }
}
