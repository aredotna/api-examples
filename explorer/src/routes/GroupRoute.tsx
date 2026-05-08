import { useParams } from "react-router-dom";
import GroupViewer from "../components/GroupViewer";
import { ErrorMessage } from "../components/ErrorMessage";

function GroupRoute(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <ErrorMessage error={new Error("No group ID provided")} />;
  }

  return <GroupViewer groupId={id} />;
}

export default GroupRoute;
