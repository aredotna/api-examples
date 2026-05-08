import { useReducer, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Flex,
  TextField,
  Button,
  Box,
  Text,
  Select,
  Grid,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useSearch } from "@aredotna/react-query";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { ErrorMessage } from "../components/ErrorMessage";
import Pagination from "../components/Pagination";
import ContentTypeFilter from "../components/ContentTypeFilter";
import {
  isBlock,
  isChannel,
  isUser,
  isGroup,
  ChannelCell,
  UserCell,
  GroupCell,
  BlockCell,
} from "../components/Cell";
import {
  SearchScope,
  SearchSort,
  type Block,
  type Channel,
  type Group,
  type SearchTypeFilter,
  type User,
} from "@aredotna/sdk/api";

// Search type options
const SEARCH_TYPE_OPTIONS: { value: SearchTypeFilter; label: string }[] = [
  { value: "Block", label: "Blocks" },
  { value: "Channel", label: "Channels" },
  { value: "User", label: "Users" },
  { value: "Group", label: "Groups" },
];

const BLOCK_SUBTYPE_OPTIONS: { value: SearchTypeFilter; label: string }[] = [
  { value: "Image", label: "Images" },
  { value: "Text", label: "Text" },
  { value: "Link", label: "Links" },
  { value: "Embed", label: "Media" },
  { value: "Attachment", label: "Attachments" },
];

const SCOPE_OPTIONS: { value: SearchScope; label: string }[] = [
  { value: SearchScope.ALL, label: "Everywhere" },
  { value: SearchScope.MY, label: "My content" },
  { value: SearchScope.FOLLOWING, label: "Following" },
];

const SORT_LABELS: Record<SearchSort, string> = {
  [SearchSort.SCORE_DESC]: "Relevance",
  [SearchSort.CREATED_AT_DESC]: "Newest first",
  [SearchSort.CREATED_AT_ASC]: "Oldest first",
  [SearchSort.UPDATED_AT_DESC]: "Recently updated",
  [SearchSort.UPDATED_AT_ASC]: "Least recently updated",
  [SearchSort.CONNECTIONS_COUNT_DESC]: "Most connections",
  [SearchSort.NAME_ASC]: "Name (A-Z)",
  [SearchSort.NAME_DESC]: "Name (Z-A)",
  [SearchSort.RANDOM]: "Random",
};

interface SearchState {
  q: string;
  searchType?: SearchTypeFilter;
  blockSubtype?: SearchTypeFilter;
  scope: SearchScope;
  sort: SearchSort;
  page: number;
}

const DEFAULT_STATE: SearchState = {
  q: "",
  searchType: undefined,
  blockSubtype: undefined,
  scope: SearchScope.ALL,
  sort: SearchSort.SCORE_DESC,
  page: 1,
};

type SearchAction =
  | { type: "SET_QUERY"; q: string }
  | { type: "SET_SEARCH_TYPE"; searchType?: SearchTypeFilter }
  | { type: "SET_BLOCK_SUBTYPE"; blockSubtype?: SearchTypeFilter }
  | { type: "SET_SCOPE"; scope: SearchScope }
  | { type: "SET_SORT"; sort: SearchSort }
  | { type: "SET_PAGE"; page: number };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, q: action.q, page: 1 };
    case "SET_SEARCH_TYPE":
      // Clear blockSubtype when changing main type
      return {
        ...state,
        searchType: action.searchType,
        blockSubtype: undefined,
        page: 1,
      };
    case "SET_BLOCK_SUBTYPE":
      return { ...state, blockSubtype: action.blockSubtype, page: 1 };
    case "SET_SCOPE":
      return { ...state, scope: action.scope, page: 1 };
    case "SET_SORT":
      return { ...state, sort: action.sort, page: 1 };
    case "SET_PAGE":
      return { ...state, page: action.page };
    default:
      return state;
  }
}

function parseSearchParams(params: URLSearchParams): Partial<SearchState> {
  const parsed: Partial<SearchState> = {};

  const q = params.get("q");
  if (q) parsed.q = q;

  const searchType = params.get("type");
  if (searchType) parsed.searchType = searchType as SearchTypeFilter;

  const subtype = params.get("subtype");
  if (subtype) parsed.blockSubtype = subtype as SearchTypeFilter;

  const scope = params.get("scope");
  if (scope) parsed.scope = scope as SearchScope;

  const sort = params.get("sort");
  if (sort) parsed.sort = sort as SearchSort;

  const page = params.get("page");
  if (page) parsed.page = parseInt(page, 10);

  return parsed;
}

function stateToSearchParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.searchType) params.set("type", state.searchType);
  if (state.blockSubtype) params.set("subtype", state.blockSubtype);
  if (state.scope !== DEFAULT_STATE.scope) params.set("scope", state.scope);
  if (state.sort !== DEFAULT_STATE.sort) params.set("sort", state.sort);
  if (state.page > 1) params.set("page", state.page.toString());

  return params;
}

function SearchRoute(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params merged with defaults
  const [state, dispatch] = useReducer(searchReducer, {
    ...DEFAULT_STATE,
    ...parseSearchParams(searchParams),
  });

  // Separate input state for controlled input (only submitted on form submit)
  const [inputValue, setInputValue] = useState(state.q);

  // Sync state changes to URL
  useEffect(() => {
    setSearchParams(stateToSearchParams(state), { replace: true });
  }, [state, setSearchParams]);

  // Use blockSubtype if set, otherwise use searchType
  const effectiveType = state.blockSubtype || state.searchType;

  const { data, isLoading, error } = useSearch({
    query: state.q,
    type: effectiveType ? [effectiveType] : undefined,
    scope: state.scope,
    sort: state.sort,
    page: state.page,
    per: 24,
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    dispatch({ type: "SET_QUERY", q: inputValue });
  };

  return (
    <Flex direction="column" gap="6">
      <form onSubmit={handleSearch}>
        <Flex gap="2" align="center">
          <TextField.Root
            id="search-term"
            type="text"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInputValue(e.target.value)
            }
            placeholder="Search Are.na..."
            style={{ flex: 1 }}
            size="3"
            autoFocus
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>

          <Button type="submit" size="3">
            Search
          </Button>
        </Flex>
      </form>

      <Box>
        <Flex direction="column" gap="4">
          <ContentTypeFilter
            value={state.searchType}
            onChange={(value) =>
              dispatch({ type: "SET_SEARCH_TYPE", searchType: value })
            }
            options={SEARCH_TYPE_OPTIONS}
          />

          {state.searchType === "Block" && (
            <ContentTypeFilter
              value={state.blockSubtype}
              onChange={(value) =>
                dispatch({ type: "SET_BLOCK_SUBTYPE", blockSubtype: value })
              }
              options={BLOCK_SUBTYPE_OPTIONS}
            />
          )}

          <Flex gap="4" wrap="wrap">
            <Select.Root
              value={state.scope}
              onValueChange={(value) =>
                dispatch({ type: "SET_SCOPE", scope: value as SearchScope })
              }
            >
              <Select.Trigger />

              <Select.Content>
                {SCOPE_OPTIONS.map(({ value, label }) => (
                  <Select.Item key={value} value={value}>
                    {label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>

            <Select.Root
              value={state.sort}
              onValueChange={(value) =>
                dispatch({ type: "SET_SORT", sort: value as SearchSort })
              }
            >
              <Select.Trigger />

              <Select.Content>
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <Select.Item key={value} value={value}>
                    {label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
        </Flex>
      </Box>

      {state.q && isLoading && <LoadingIndicator message="Searching..." />}

      {state.q && error && <ErrorMessage error={error} />}

      {state.q && data && (
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Text color="gray" size="2">
              {data.meta.total_count.toLocaleString()} results for "{state.q}"
            </Text>
            {data.meta && (
              <Pagination
                meta={data.meta}
                onPageChange={(page) => dispatch({ type: "SET_PAGE", page })}
              />
            )}
          </Flex>

          <SearchResults data={data.data} />

          {data.meta && (
            <Flex justify="center">
              <Pagination
                meta={data.meta}
                onPageChange={(page) => dispatch({ type: "SET_PAGE", page })}
              />
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  );
}

function SearchResults({ data }: { data: (Block | Channel | User | Group)[] }) {
  return (
    <Grid columns={{ initial: "2", sm: "3", md: "4", lg: "5" }} gap="2">
      {data.map((item) => {
        if (isChannel(item)) {
          return (
            <ChannelCell key={`channel-${item.id}`} channel={item} showCount />
          );
        }
        if (isUser(item)) {
          return <UserCell key={`user-${item.id}`} user={item} />;
        }
        if (isGroup(item)) {
          return <GroupCell key={`group-${item.id}`} group={item} />;
        }
        if (isBlock(item)) {
          return <BlockCell key={`block-${item.id}`} block={item} />;
        }
        return null;
      })}
    </Grid>
  );
}

export default SearchRoute;
