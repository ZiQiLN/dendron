import { DEngine, DEngineClientV2 } from "@dendronhq/common-all";
import { resolvePath } from "@dendronhq/common-server";
import {
  DendronEngine,
  DendronEngineV2,
  FileStorageV2,
} from "@dendronhq/engine-server";
import yargs from "yargs";
import { BaseCommand } from "./base";

type CommandOpts = {
  engine: DEngine;
  engineClient?: DEngineClientV2;
  wsRoot: string;
};

type CommandOptsV2 = {
  engine: DEngineClientV2;
  wsRoot: string;
  vault: string;
};

type CommandCLIOpts = {
  wsRoot: string;
  vault: string;
};

export { CommandCLIOpts as SoilCommandCLIOpts };
export { CommandOpts as SoilCommandOpts };
export { CommandOptsV2 as SoilCommandOptsV2 };

// @ts-ignore
export abstract class SoilCommand<
  TCLIOpts extends CommandCLIOpts = CommandCLIOpts,
  TCommandOpts extends CommandOpts = CommandOpts,
  TCommandOutput = void
> extends BaseCommand<TCommandOpts, TCommandOutput> {
  buildArgs(args: yargs.Argv) {
    args.option("wsRoot", {
      describe: "location of workspace",
      demandOption: true,
    });
    args.option("vault", {
      describe: "location of vault",
      demandOption: true,
    });
  }

  abstract enrichArgs(args: TCLIOpts): TCommandOpts;

  eval = (args: TCLIOpts) => {
    const opts = this.enrichArgs(args);
    return opts.engine.init().then(() => {
      return this.execute(opts);
    });
  };

  _enrichArgs(args: TCLIOpts): CommandOpts {
    let { vault, wsRoot } = args;
    const engine = DendronEngine.getOrCreateEngine({
      root: vault,
      forceNew: true,
    });

    const cwd = process.cwd();
    wsRoot = resolvePath(wsRoot, cwd);
    vault = resolvePath(vault, cwd);
    return {
      ...args,
      engine,
      wsRoot,
    };
  }
}

export abstract class SoilCommandV2<
  TCLIOpts extends CommandCLIOpts = CommandCLIOpts,
  TCommandOpts extends CommandOptsV2 = CommandOptsV2,
  TCommandOutput = void
> extends BaseCommand<TCommandOpts, TCommandOutput> {
  buildArgs(args: yargs.Argv) {
    args.option("wsRoot", {
      describe: "location of workspace",
      demandOption: true,
    });
    args.option("vault", {
      describe: "location of vault",
      demandOption: true,
    });
  }

  /**
   * Take CLI opts and transform them into command opts
   * @param args
   */
  abstract enrichArgs(args: TCLIOpts): TCommandOpts;

  eval = (args: TCLIOpts) => {
    const opts = this.enrichArgs(args);
    return opts.engine.init().then(() => {
      return this.execute(opts);
    });
  };

  _enrichArgs(args: TCLIOpts): CommandOptsV2 {
    let { vault, wsRoot } = args;
    const cwd = process.cwd();
    wsRoot = resolvePath(wsRoot, cwd);
    vault = resolvePath(vault, cwd);
    const logger = this.L;
    const engine = new DendronEngineV2({
      vaults: [vault],
      forceNew: true,
      store: new FileStorageV2({ vaults: [vault], logger }),
      mode: "fuzzy",
      logger,
    });
    return {
      ...args,
      engine,
      wsRoot,
    };
  }
}
