import { FC } from "react";
import { Box, Link } from "@radix-ui/themes";
import { Link as RouterLink } from "react-router-dom";
import type { ComponentProps } from "react";

export interface Definition {
  term: string;
  description: string | number | React.ReactElement;
  href?: string;
}

export interface DefinitionListProps
  extends Omit<ComponentProps<typeof Box>, "as"> {
  definitions: Definition[];
}

export const DefinitionList: FC<DefinitionListProps> = ({
  definitions,
  ...rest
}) => {
  return (
    <Box
      asChild
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        margin: 0,
        padding: 0,
        ...rest.style,
      }}
      {...rest}
    >
      <dl>
        {definitions.map(({ term, description, href }) => (
          <Box
            key={term}
            as="div"
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--gray-3)",
              paddingBottom: "var(--space-2)",
            }}
          >
            <dt
              style={{
                margin: 0,
                fontSize: "var(--font-size-1)",
                lineHeight: "var(--line-height-1)",
                color: "var(--gray-11)",
              }}
            >
              {term}
            </dt>

            <dd
              style={{
                margin: 0,
                marginLeft: "var(--space-4)",
                fontSize: "var(--font-size-1)",
                lineHeight: "var(--line-height-1)",
                textDecoration: "none",
                color: "var(--gray-11)",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {href ? (
                <Link asChild weight="bold">
                  {href.startsWith("http") ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit" }}
                    >
                      {description}
                    </a>
                  ) : (
                    <RouterLink to={href} style={{ color: "inherit" }}>
                      {description}
                    </RouterLink>
                  )}
                </Link>
              ) : (
                description
              )}
            </dd>
          </Box>
        ))}
      </dl>
    </Box>
  );
};
