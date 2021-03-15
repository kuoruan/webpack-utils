import fs from "fs";
import path from "path";

export default class AppConfig {
  private distDir?: string;

  private assetsDir?: string;

  private publicPath?: string;

  private sassAdditionalData?: string;

  constructor(private rootPath: string) {
    this.init();
  }

  private init(): void {
    const appConfigFilename = path.resolve(this.rootPath, "app.config.js");

    if (fs.existsSync(appConfigFilename)) {
      const {
        distDir = "",
        assetsDir = "",
        publicPath = "",
        sassAdditionalData = "",
        /* eslint-disable @typescript-eslint/no-var-requires */
      } = require(appConfigFilename);

      this.distDir = distDir;
      this.assetsDir = assetsDir;
      this.publicPath = publicPath;
      this.sassAdditionalData = sassAdditionalData;
    }
  }

  public getDistDir(): string {
    return this.distDir || "dist";
  }

  public getAssetsDir(): string {
    return this.assetsDir || "static";
  }

  public getPublicPath(): string {
    return this.publicPath || "/";
  }

  public getSassAdditionalData(): string {
    return this.sassAdditionalData || "";
  }
}
