import { createFileRoute } from '@tanstack/react-router'
import { ConfigEditorPage } from '@/features/config-editor/config-editor-page'

export const Route = createFileRoute('/editor')({
  component: ConfigEditorPage,
})
