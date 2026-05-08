import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";

export const ErrorMessage = ({ error }: { error: Error }) => {
  const status = (error as any).response?.status;

  return (
    <Callout.Root variant="surface" color="red">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>

      <Callout.Text>
        {error.message} {status ? `(${status})` : ""}
      </Callout.Text>
    </Callout.Root>
  );
};
