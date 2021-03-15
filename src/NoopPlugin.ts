import webpack from "webpack";

export default class NoopPlugin implements webpack.WebpackPluginInstance {
  public apply(): void {
    // noop
  }
}
