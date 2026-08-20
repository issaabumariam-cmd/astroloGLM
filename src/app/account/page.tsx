import { Eyebrow, Card, Tag } from "@/components/shared/ui-primitives";
import { User, Crown, Calendar, MessageSquare, Shield, LogOut } from "lucide-react";

export const metadata = {
  title: "Account",
  description: "Your Astrolo account — profile, subscription, chat history, and privacy controls.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10">
        <Eyebrow>Account</Eyebrow>
        <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground">Your Settings</h1>
      </div>

      {/* Profile */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
            S
          </div>
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">Seeker</p>
            <p className="text-sm text-foreground-muted">Sign in to personalise</p>
          </div>
        </div>
      </Card>

      {/* Subscription */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Subscription</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Tag className="bg-surface-muted text-foreground-muted">Free Plan</Tag>
            <p className="mt-2 text-sm text-foreground-muted">
              3 AI questions remaining this month
            </p>
          </div>
          <a href="/pricing" className="btn-primary">
            <Crown className="h-4 w-4" />
            Upgrade
          </a>
        </div>
      </Card>

      {/* Birth Data */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Birth Data</h2>
        </div>
        <p className="text-sm text-foreground-muted">
          No birth data saved yet.{" "}
          <a href="/birth-chart" className="font-medium text-primary hover:text-primary-hover">
            Calculate your chart
          </a>{" "}
          to save your details.
        </p>
      </Card>

      {/* Chat History */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Chat History</h2>
        </div>
        <p className="text-sm text-foreground-muted">
          Sign in to save your Jehana conversations across devices.
        </p>
      </Card>

      {/* Privacy */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Privacy & Data</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Export my data</p>
              <p className="text-xs text-foreground-subtle">Download all your data as JSON (GDPR Art. 20)</p>
            </div>
            <button className="btn-ghost text-xs">Export</button>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-sm font-medium text-error">Delete my birth data</p>
              <p className="text-xs text-foreground-subtle">Permanently remove your birth details (GDPR Art. 17)</p>
            </div>
            <button className="btn-ghost text-xs text-error">Delete</button>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-sm font-medium text-error">Delete account</p>
              <p className="text-xs text-foreground-subtle">Permanently delete your account and all data</p>
            </div>
            <button className="btn-ghost text-xs text-error">Delete</button>
          </div>
        </div>
      </Card>

      {/* Sign out */}
      <div className="text-center">
        <button className="btn-ghost text-sm">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}