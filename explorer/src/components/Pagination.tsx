import { useMemo } from "react";
import { Flex, Button, Text } from "@radix-ui/themes";
import type { PaginationMeta } from "@aredotna/sdk/api";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

type PageItem = number | "ellipsis";

interface PageItemProps {
  item: PageItem;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PageItem = ({ item, currentPage, onPageChange }: PageItemProps) => {
  if (item === "ellipsis") {
    return <Text color="gray">...</Text>;
  }

  return (
    <Button
      size="1"
      variant={item === currentPage ? "solid" : "outline"}
      onClick={() => onPageChange(item)}
    >
      {item}
    </Button>
  );
};

interface PageItemsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PageItems = ({
  currentPage,
  totalPages,
  onPageChange,
}: PageItemsProps) => {
  const pages = useMemo(() => {
    // Determine which pages should be visible
    const shouldShowPage = (pageNum: number): boolean => {
      return (
        pageNum === 1 ||
        pageNum === totalPages ||
        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) ||
        (currentPage <= 3 && pageNum <= 5) ||
        (currentPage >= totalPages - 2 && pageNum >= totalPages - 4)
      );
    };

    // Get visible page numbers
    const visiblePages = Array.from(
      { length: totalPages },
      (_, i) => i + 1
    ).filter(shouldShowPage);

    // Insert ellipsis between non-consecutive pages
    return visiblePages.reduce<PageItem[]>((acc, pageNum, index) => {
      const previousPage = visiblePages[index - 1];
      if (
        index > 0 &&
        previousPage !== undefined &&
        pageNum - previousPage > 1
      ) {
        acc.push("ellipsis");
      }
      acc.push(pageNum);
      return acc;
    }, []);
  }, [currentPage, totalPages]);

  return (
    <>
      {pages.map((item, index) => (
        <PageItem
          key={item === "ellipsis" ? `ellipsis-${index}` : item}
          item={item}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      ))}
    </>
  );
};

const Pagination = ({
  meta,
  onPageChange,
}: PaginationProps): JSX.Element | null => {
  const { current_page, total_pages } = meta;

  // Hide pagination if only one page
  if (total_pages <= 1) {
    return null;
  }

  return (
    <Flex gap="2" align="center" wrap="wrap">
      <Button
        size="1"
        variant="soft"
        onClick={() => onPageChange(1)}
        disabled={current_page === 1}
      >
        First
      </Button>

      <Button
        size="1"
        variant="soft"
        onClick={() => onPageChange(Math.max(1, current_page - 1))}
        disabled={current_page === 1}
      >
        Previous
      </Button>

      <Flex gap="1" align="center">
        <PageItems
          currentPage={current_page}
          totalPages={total_pages}
          onPageChange={onPageChange}
        />
      </Flex>

      <Button
        size="1"
        variant="soft"
        onClick={() => onPageChange(Math.min(total_pages, current_page + 1))}
        disabled={current_page === total_pages}
      >
        Next
      </Button>

      <Button
        size="1"
        variant="soft"
        onClick={() => onPageChange(total_pages)}
        disabled={current_page === total_pages}
      >
        Last
      </Button>
    </Flex>
  );
};

export default Pagination;
