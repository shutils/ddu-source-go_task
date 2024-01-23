import {
  ActionArguments,
  ActionFlags,
  Actions,
  BaseSource,
  fn,
  GatherArguments,
  Item,
  unknownutil as u,
} from "./deps.ts";

type Params = {
  kind: string;
  cmd: string;
};

const isTask = u.isObjectOf({
  name: u.isString,
  desc: u.isString,
  summary: u.isString,
  up_to_date: u.isBoolean,
  ...u.isUnknown,
  location: u.isObjectOf({
    line: u.isNumber,
    column: u.isNumber,
    taskfile: u.isString,
    ...u.isUnknown,
  }),
});

export interface ActionData {
  cmd: string;
  path: string;
  lineNr: number;
  name: string;
  desc: string;
  summary: string;
  up_to_date: boolean;
  location: {
    line: number;
    column: number;
    taskfile: string;
  };
}

const getTasks = (cwd: string, cmd: string) => {
  const tasksJsonBin = new Deno.Command(cmd, {
    args: ["--list-all", "-j"],
    cwd: cwd,
  }).outputSync();
  const tasksJsonPlainText = new TextDecoder().decode(tasksJsonBin.stdout);
  const tasksObject = u.ensure(
    JSON.parse(tasksJsonPlainText),
    u.isObjectOf({
      tasks: u.isArrayOf(isTask),
    }),
  );
  return tasksObject.tasks;
};

export class Source extends BaseSource<Params> {
  override kind = "file";

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const cwd = await fn.getcwd(args.denops);
        const cmd = args.sourceParams.cmd;
        const tasks = getTasks(cwd, cmd);
        const items: Item<ActionData>[] = [];
        for (const task of tasks) {
          items.push({
            word: task.name,
            action: {
              cmd: cmd,
              path: task.location.taskfile,
              lineNr: task.location.line,
              name: task.name,
              desc: task.desc,
              summary: task.summary,
              up_to_date: task.up_to_date,
              location: {
                line: task.location.line,
                column: task.location.column,
                taskfile: task.location.taskfile,
              },
            },
          });
        }
        controller.enqueue(items);
        controller.close();
      },
    });
  }

  override actions: Actions<Params> = {
    async run(args: ActionArguments<Params>) {
      const params = u.ensure(
        args.actionParams,
        u.isOptionalOf(u.isObjectOf({
          prefix: u.isOptionalOf(u.isString),
          suffix: u.isOptionalOf(u.isString),
        })),
      );
      const prefix = params?.prefix ?? "botright new | terminal ";
      const suffix = params?.suffix ?? "";
      for (const item of args.items) {
        if (item.action) {
          const action = item.action as ActionData;
          const cmd =
            `${prefix}${action.cmd} --dir ${action.location.taskfile} ${action.name}${suffix}`;
          await args.denops.cmd(cmd);
        }
      }
      return ActionFlags.None;
    },
  };

  override params(): Params {
    return {
      kind: "file",
      cmd: "task",
    };
  }
}
