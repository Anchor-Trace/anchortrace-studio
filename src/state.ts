import type { Report } from "@anas.abubakar/anchortrace-sdk";

export type Source = { kind: "example"; id: string; reproduces: boolean } | { kind: "input" } | { kind: "saved_report"; label: string };

export type State =
  | { phase: "idle" }
  | { phase: "loading"; what: string }
  | { phase: "done"; report: Report; source: Source }
  | { phase: "error"; message: string; issues: string[] };

export type Action =
  | { type: "start"; what: string }
  | { type: "success"; report: Report; source: Source }
  | { type: "failure"; message: string; issues?: string[] }
  | { type: "reset" };

export const initialState: State = { phase: "idle" };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { phase: "loading", what: action.what };
    case "success":
      return { phase: "done", report: action.report, source: action.source };
    case "failure":
      return { phase: "error", message: action.message, issues: action.issues ?? [] };
    case "reset":
      return initialState;
    default:
      return state;
  }
}
