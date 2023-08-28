import {
  ActionArguments,
  ActionFlags,
  Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.4.5/types.ts";
import { ActionData } from "../@ddu-sources/go_task.ts";

type Params = {
  prefix: string;
  suffix: string;
};

export class Kind extends BaseKind<Params> {
  actions: Actions<Params> = {
    run: async (args: ActionArguments<Params>) => {
      for (const item of args.items) {
        if (item.action) {
          const action = item.action as ActionData;
          const cmd =
            `${args.kindParams.prefix}task --dir ${action.location.taskfile} ${action.name}${args.kindParams.suffix}`;
          await args.denops.cmd(cmd);
        }
      }
      return ActionFlags.None;
    },
  };
  params(): Params {
    return {
      prefix: "terminal ",
      suffix: "",
    };
  }
}
