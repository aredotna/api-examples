import { ChevronDownIcon, LogOutIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MetadataRecord } from '@/domain/metadata'
import { MetadataTooltip } from './metadata-tooltip'

interface BoardHeaderProps {
  boardTitle: string
  boardMetadata: MetadataRecord
  userName: string
  userAvatar: string | null
  userInitials: string
  isBusy: boolean
  onRefresh: () => void
  onLogout: () => void
  onOpenCreateCard: () => void
  onOpenAddLane: () => void
}

export const BoardHeader = ({
  boardTitle,
  boardMetadata,
  userName,
  userAvatar,
  userInitials,
  isBusy,
  onRefresh,
  onLogout,
  onOpenCreateCard,
  onOpenAddLane,
}: BoardHeaderProps) => (
  <header>
    <div className="flex items-center justify-between gap-4">
      <Breadcrumb>
        <BreadcrumbList className="font-mono text-sm">
          <BreadcrumbItem className="text-muted-foreground">Are.na</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <div className="flex items-center gap-1.5">
              <BreadcrumbPage className="font-semibold">{boardTitle}</BreadcrumbPage>
              <MetadataTooltip label="Board channel metadata" metadata={boardMetadata} />
            </div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onOpenCreateCard} disabled={isBusy}>
          <PlusIcon className="mr-1.5 size-4" />
          Create card
        </Button>
        <Button size="sm" variant="outline" onClick={onOpenAddLane} disabled={isBusy}>
          <PlusIcon className="mr-1.5 size-4" />
          Add lane
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 pl-2" disabled={isBusy}>
              <Avatar size="sm">
                {userAvatar ? <AvatarImage src={userAvatar} alt={userName} /> : null}
                <AvatarFallback>{userInitials || '?'}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{userName || 'User'}</span>
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRefresh}>
              <RefreshCwIcon className="mr-2 size-4" />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onLogout}>
              <LogOutIcon className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
)
