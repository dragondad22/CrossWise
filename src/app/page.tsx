import Link from 'next/link'

import { buttonClasses } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    title: 'Upload Lists',
    description: 'Import structured JSON lists and keep your topics organised and reusable.',
    icon: '📝',
  },
  {
    title: 'Generate Puzzles',
    description: 'Spin up fresh crosswords instantly with smart placement and deterministic seeds.',
    icon: '🎯',
  },
  {
    title: 'Solve & Study',
    description: 'Track progress, check answers, and revisit games whenever you like.',
    icon: '🧩',
  },
]

export default function Home() {
  return (
    <main className="bg-background">
      <section className="container mx-auto grid min-h-[calc(100vh-4rem)] items-center gap-12 px-4 py-16 md:grid-cols-[1fr_auto]">
        <div className="mx-auto max-w-2xl text-center md:mx-0 md:text-left">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            Crossword creation for every study session
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Build, share, and solve crosswords that make learning memorable.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            CrossWise turns your vocabulary lists into beautiful, interactive puzzles. Create topics
            for any subject, invite teammates, and pick up where you left off on any device.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
            <Link href="/topics" className={buttonClasses({ className: 'px-6 py-3 text-base' })}>
              Browse topics
            </Link>
            <Link
              href="/register"
              className={buttonClasses({
                variant: 'outline',
                className: 'px-6 py-3 text-base',
              })}
            >
              Create an account
            </Link>
          </div>
        </div>

        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-xl">Everything you need to get started</CardTitle>
            <CardDescription>
              Three simple steps to bring your word lists to life and keep learners engaged.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                  {feature.icon}
                </span>
                <div className="text-left">
                  <p className="text-base font-semibold text-foreground">{feature.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
