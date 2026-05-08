import { ErrorMessage } from "../components/ErrorMessage";

function NotFoundRoute(): JSX.Element {
  return <ErrorMessage error={new Error("Not found")} />;
}

export default NotFoundRoute;
