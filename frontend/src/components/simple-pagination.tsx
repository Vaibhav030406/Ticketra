import { SpringBootPagination } from "@/domain/domain";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SimplePaginationProps<T> {
  pagination: SpringBootPagination<T>;
  onPageChange: (page: number) => void;
}

export function SimplePagination<T>({
  pagination,
  onPageChange,
}: SimplePaginationProps<T>) {
  const currentPage = pagination.number;
  const totalPages = pagination.totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="flex gap-3 items-center">
      <Button
        size="sm"
        variant="ghost"
        className="cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-all duration-200"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={pagination.first}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Page</span>
      </Button>
      <div className="text-sm text-zinc-500">
        <span className="text-zinc-300">{currentPage + 1}</span>
        <span className="mx-1">/</span>
        <span>{totalPages}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-all duration-200"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={pagination.last}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </Button>
    </div>
  );
}
