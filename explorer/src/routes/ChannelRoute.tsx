import { useParams } from "react-router-dom";
import ChannelViewer from "../components/ChannelViewer";
import { ErrorMessage } from "../components/ErrorMessage";

function ChannelRoute(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <ErrorMessage error={new Error("No channel ID provided")} />;
  }

  return <ChannelViewer channelId={id} />;
}

export default ChannelRoute;
