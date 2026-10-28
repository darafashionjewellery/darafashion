import { Gem } from 'lucide-react'
import { EmptyState } from '../components/ui/States'
import { useDocumentTitle } from '../hooks/misc'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="container-page py-16">
      <EmptyState icon={<Gem className="size-10" />} title="We couldn’t find that page" message="The page may have moved, or the link may be incorrect." action={{ label: 'Continue Shopping', to: '/shop' }} />
    </div>
  )
}
