import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.4.4/types.ts";
import { GatherArguments } from "https://deno.land/x/ddu_vim@v3.4.4/base/source.ts";
import { fn } from "https://deno.land/x/ddu_vim@v3.5.1/deps.ts";

type Params = {
  kind: string;
};

type Task = {
  name: string;
  desc: string;
  summary: string;
  up_to_date: boolean;
  location: {
    line: number;
    column: number;
    taskfile: string;
  };
};

export interface ActionData {
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

const getTasks = async (cwd: string): Promise<Array<Task>> => {
  const tasksJson = await new Deno.Command("task", {
    args: ["--list-all", "-j"],
    cwd: cwd,
  }).output().then(({ stdout }) => new TextDecoder().decode(stdout));
  try {
    JSON.parse(tasksJson);
  } catch (_error) {
    return Promise.resolve([]);
  }
  const tasksObject = JSON.parse(tasksJson);
  return Promise.resolve(tasksObject.tasks);
};

export class Source extends BaseSource<Params> {
  override kind = "go_task";

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const cwd = await fn.getcwd(args.denops);
        const tasks = await getTasks(cwd);
        const items: Array<Item<ActionData>> = [];
        for (const task of tasks) {
          items.push({
            word: task.name,
            action: {
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

  override params(): Params {
    return {
      kind: "go_task",
    };
  }
}
