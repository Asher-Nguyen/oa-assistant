import { createFileRoute, redirect } from "@tanstack/react-router";

// Unify the workspace experience: "Open workspace" routes to the same
// Guided OA page as "Launch Guided Mode". There is only one workspace.
export const Route = createFileRoute("/project/$projectId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/project/$projectId/guided",
      params: { projectId: params.projectId },
    });
  },
});
