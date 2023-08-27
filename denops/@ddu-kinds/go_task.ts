import {
  ActionArguments,
  ActionFlags,
  Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.4.5/types.ts";
import { ActionData } from "../@ddu-sources/go_task.ts";

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  actions: Actions<Params> = {
    execute: async (args: ActionArguments<Params>) => {
      for (const item of args.items) {
        if (item.action) {
          const action = item.action as ActionData;
          const cmd = `task --dir ${action.location.taskfile} ${action.name}`;
          await args.denops.cmd(`!tmux send -t bottom-left '${cmd}' Enter`);
        }
      }
      return ActionFlags.None;
    },
  };
  params(): Params {
    return {};
  }
}
