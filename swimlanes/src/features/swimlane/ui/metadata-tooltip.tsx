import { InfoIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { MetadataRecord } from '@/domain/metadata'
import { cn } from '@/lib/utils'

type MetadataValue = MetadataRecord | Record<string, MetadataRecord>

interface MetadataTooltipProps {
  label: string
  metadata: MetadataValue
  className?: string
}

const sortMetadata = (value: MetadataValue): MetadataValue => {
  const entries = Object.entries(value).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  return Object.fromEntries(entries) as MetadataValue
}

export const MetadataTooltip = ({ label, metadata, className }: MetadataTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        aria-label={label}
        className={cn(
          'inline-flex size-6 shrink-0 cursor-help items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        type="button"
      >
        <InfoIcon className="size-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="bottom" align="start" className="max-w-[360px] p-0">
      <div className="border-b border-border px-3 py-2 text-xs font-medium">{label}</div>
      <pre className="max-h-80 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
        {JSON.stringify(sortMetadata(metadata), null, 2)}
      </pre>
    </TooltipContent>
  </Tooltip>
)
