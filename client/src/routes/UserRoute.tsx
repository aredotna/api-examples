import { useParams } from "react-router-dom";
import UserViewer from "../components/UserViewer";
import { ErrorMessage } from "../components/ErrorMessage";

function UserRoute(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <ErrorMessage error={new Error("No user ID provided")} />;
  }

  return <UserViewer userId={id} />;
}

export default UserRoute;
