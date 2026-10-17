import {
  IconBraces,
  IconDownload,
  IconExternalLink,
  IconFileCode,
  IconPlus,
  IconUpload,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { SpaceIcon } from '@/components/space-icon'
import { buttonVariants } from '@/components/ui/button'
import { TEXT_LINK_CLASS } from '@/components/text-link'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'

type FirstRunProps = Readonly<{ ui: Ui; onImport: () => void }>

const LABEL_CLASS = 'text-label text-muted-foreground uppercase'
const SMALL_MUTED_CLASS = 'text-[13px] leading-[18px] text-muted-foreground'
const EXAMPLE_LINK_CLASS = cn(
  TEXT_LINK_CLASS,
  'inline-flex items-center gap-1.5 text-[13px] leading-[18px] font-semibold',
)
const RESOURCE_CLASS =
  'inline-flex items-center gap-2 text-[13px] leading-[18px] font-medium text-muted-foreground hover:text-foreground'

function Step({
  ui,
  n,
  title,
  children,
}: Readonly<{ ui: Ui; n: number; title: string; children: ReactNode }>) {
  return (
    <li className="flex flex-col gap-1.5 rounded-md bg-muted p-4 text-left">
      <span className={LABEL_CLASS}>{ui.text('first_run_step', { n })}</span>
      <span className="font-semibold">{title}</span>
      {children}
    </li>
  )
}

/**
 * Premier lancement (artboard `accueil-premier-lancement`) : sans aucune session ni aucun
 * entraînement, trois étapes avec les fichiers d'exemple, la création, l'entraînement seul et
 * les autres ressources. Le dépôt d'une sauvegarde reste actif sur toute la page.
 */
export function FirstRun({ ui, onImport }: FirstRunProps) {
  const { text } = ui
  const base = import.meta.env.BASE_URL
  return (
    <>
      <section
        aria-labelledby="first-run-title"
        className="relative isolate flex flex-col items-center gap-6 overflow-hidden rounded-xl bg-card px-8 pt-10 pb-8 text-center shadow-card"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-42 left-1/2 -z-10 h-95 w-155 -translate-x-1/2 bg-[radial-gradient(closest-side,var(--color-halo-action),transparent)] blur-sm"
        />
        <div className="flex flex-col items-center gap-2">
          <span className={LABEL_CLASS}>{text('first_run_eyebrow', {})}</span>
          <h2 id="first-run-title" className="text-[22px] leading-7 font-bold">
            {text('first_run_heading', {})}
          </h2>
          <p className="max-w-130 text-muted-foreground">{text('first_run_body', {})}</p>
        </div>
        <ol className="grid w-full max-w-205 grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
          <Step ui={ui} n={1} title={text('first_run_step1', {})}>
            <span className="mt-0.5 flex flex-col gap-1.5">
              <a href={`${base}students.example.csv`} download className={EXAMPLE_LINK_CLASS}>
                <IconDownload aria-hidden className="size-4" />
                {text('home_students_example_link', {})}
              </a>
              <a href={`${base}config.example.json`} download className={EXAMPLE_LINK_CLASS}>
                <IconDownload aria-hidden className="size-4" />
                {text('home_config_example_link', {})}
              </a>
            </span>
          </Step>
          <Step ui={ui} n={2} title={text('first_run_step2', {})}>
            <span className={SMALL_MUTED_CLASS}>{text('first_run_step2_body', {})}</span>
          </Step>
          <Step ui={ui} n={3} title={text('first_run_step3', {})}>
            <span className={SMALL_MUTED_CLASS}>{text('first_run_step3_body', {})}</span>
          </Step>
        </ol>
        <Link to="/new" className={buttonVariants()}>
          <IconPlus aria-hidden />
          {text('home_create', {})}
        </Link>
        <div className="flex w-full max-w-205 flex-wrap items-center justify-between gap-4 border-t border-border pt-5 text-left">
          <div className="flex min-w-0 items-center gap-3">
            <SpaceIcon space="training" size="md" />
            <div>
              <p className="font-semibold">{text('first_run_solo_title', {})}</p>
              <p className={SMALL_MUTED_CLASS}>{text('first_run_solo_body', {})}</p>
            </div>
          </div>
          <Link to="/training/new" className={buttonVariants({ variant: 'outline' })}>
            {text('first_run_solo_cta', {})}
          </Link>
        </div>
      </section>
      <nav
        aria-label={text('first_run_resources', {})}
        className="flex flex-wrap justify-center gap-x-7 gap-y-2"
      >
        <a
          href={`${base}config.schema.json`}
          target="_blank"
          rel="noreferrer"
          className={RESOURCE_CLASS}
        >
          <IconBraces aria-hidden className="size-4" />
          {text('home_config_schema_link', {})}
          <IconExternalLink aria-hidden className="size-3.5" />
        </a>
        <Link to="/editor" className={RESOURCE_CLASS}>
          <IconFileCode aria-hidden className="size-4" />
          {text('first_run_editor_link', {})}
        </Link>
        <button type="button" onClick={onImport} className={RESOURCE_CLASS}>
          <IconUpload aria-hidden className="size-4" />
          {text('home_import', {})}
        </button>
      </nav>
      <p className={cn(SMALL_MUTED_CLASS, '-mt-4 text-center')}>
        {text('first_run_drop_hint', {})}
      </p>
    </>
  )
}
