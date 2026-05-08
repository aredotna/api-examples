import { ChannelVisibility } from "@aredotna/sdk/api";

export const channelColors = (visibility: ChannelVisibility) => {
  switch (visibility) {
    case "private":
      return {
        color: "var(--red-12)",
        backgroundColor: "var(--red-4)",
        borderColor: "var(--red-7)",
      };
    case "closed":
      return {
        color: "var(--indigo-12)",
        backgroundColor: "var(--indigo-4)",
        borderColor: "var(--indigo-7)",
      };
    case "public":
      return {
        color: "var(--grass-12)",
        backgroundColor: "var(--grass-4)",
        borderColor: "var(--grass-7)",
      };
    default:
      return {
        color: "var(--gray-12)",
        backgroundColor: "var(--gray-4)",
        borderColor: "var(--gray-7)",
      };
  }
};
