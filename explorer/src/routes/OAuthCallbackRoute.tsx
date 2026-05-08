import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Heading, Text } from "@radix-ui/themes";
import { useAuth } from "../contexts/AuthContext";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { ErrorMessage } from "../components/ErrorMessage";

const AuthError = ({
  error,
  description,
}: {
  error: string;
  description?: string | null;
}) => (
  <Box py="9">
    <Heading size="6" mb="4">
      Authentication Failed
    </Heading>
    <ErrorMessage error={new Error(description || error)} />
  </Box>
);

const AuthLoading = () => (
  <Box py="9">
    <Heading size="6" mb="4">
      Completing Authentication...
    </Heading>
    <LoadingIndicator message="Please wait while we complete your login." />
    <Text as="p" color="gray" mt="4">
      Please wait while we complete your login.
    </Text>
  </Box>
);

export default function OAuthCallbackRoute() {
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback, error } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    handleOAuthCallback({
      code: searchParams.get("code"),
      error: searchParams.get("error"),
      errorDescription: searchParams.get("error_description"),
    });
  }, [searchParams, handleOAuthCallback]);

  const urlError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (urlError || error) {
    return (
      <AuthError
        error={error || urlError || "Authentication failed"}
        description={errorDescription || undefined}
      />
    );
  }

  return <AuthLoading />;
}
