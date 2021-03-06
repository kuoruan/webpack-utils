import fs from "fs";
import path from "path";

import dotenv from "dotenv";

import { AppConfigHolder, EnvHolder, RawEnv, StringifiedEnv } from "./types";

export default class EnvParser implements EnvHolder {
  private raw: RawEnv;

  private stringified: StringifiedEnv;

  constructor(private rootPath: string, private appConfig: AppConfigHolder) {
    const mode = process.env.MODE || process.env.NODE_ENV;

    const dotEnvFile = path.resolve(this.rootPath, ".env");

    const dotEnvFiles = [
      `${dotEnvFile}.${mode}.local`,
      `${dotEnvFile}.${mode}`,
      `${dotEnvFile}.local`,
      dotEnvFile,
    ];

    for (const file of dotEnvFiles) {
      if (fs.existsSync(file)) {
        dotenv.config({
          path: file,
        });
      }
    }

    const rawEnv: RawEnv = Object.keys(process.env)
      .filter((key) => /^APP_/i.test(key))
      .reduce<RawEnv>(
        (env, key) => {
          env[key] = process.env[key];
          return env;
        },
        {
          NODE_ENV: process.env.NODE_ENV || "production",
          BUILD_TIME: new Date().toLocaleString(),
          PUBLIC_PATH: this.appConfig.getPublicPath().replace(/\/$/, ""),
        }
      );

    const stringifiedEnv: StringifiedEnv = {
      "process.env": Object.keys(rawEnv).reduce<Record<keyof RawEnv, string>>(
        (env, key) => {
          env[key] = JSON.stringify(rawEnv[key]);
          return env;
        },
        {}
      ),
    };

    this.raw = rawEnv;
    this.stringified = stringifiedEnv;
  }

  public getRaw(): RawEnv {
    return this.raw;
  }

  public getStringified(): StringifiedEnv {
    return this.stringified;
  }
}
