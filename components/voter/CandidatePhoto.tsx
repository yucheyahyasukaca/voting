import Image from 'next/image'
import { getInitials } from '@/lib/utils'

interface Props {
  name: string
  src: string | null
  className?: string
  sizes?: string
  priority?: boolean
}

/** Foto potret (object-top supaya wajah tidak terpotong). Fallback: inisial. */
export default function CandidatePhoto({ name, src, className = '', sizes = '120px', priority }: Props) {
  return (
    <div className={`relative overflow-hidden bg-jt-line ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-jt-muted">
          {getInitials(name) || '?'}
        </div>
      )}
    </div>
  )
}
