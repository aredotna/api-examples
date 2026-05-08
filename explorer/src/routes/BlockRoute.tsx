import { useParams } from "react-router-dom";
import BlockViewer from "../components/BlockViewer";
import { ErrorMessage } from "../components/ErrorMessage";

function BlockRoute(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <ErrorMessage error={new Error("No block ID provided")} />;
  }

  const blockId = id ? parseInt(id, 10) : null;

  if (blockId === null || isNaN(blockId)) {
    return <ErrorMessage error={new Error("Invalid block ID")} />;
  }

  return <BlockViewer blockId={blockId} />;
}

export default BlockRoute;
