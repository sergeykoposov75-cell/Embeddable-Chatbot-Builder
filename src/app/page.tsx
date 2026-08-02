import Link from "next/link";
import { Bot, Upload, MessageSquare, Globe, Check, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Bot className="h-6 w-6" />
            ChatbotBuilder
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm text-gray-600 hover:text-black">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-black">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-black">Sign In</Link>
            <Link href="/signup" className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 text-center">
          <h1 className="animate-fade-up text-5xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
            Turn your documents into an AI chatbot
          </h1>
          <p className="animate-fade-up delay-100 mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Upload PDFs, DOCX, or TXT files and get an intelligent chatbot that answers questions
            based on your content. Embed it on any website in seconds.
          </p>
          <div className="animate-fade-up delay-200 mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-lg active:scale-[0.98]"
            >
              Start Building
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#features" className="rounded-lg border px-6 py-3 text-sm transition-colors hover:bg-gray-50">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Everything you need</h2>
          <p className="mx-auto mt-4 mb-12 max-w-xl text-center text-gray-600">
            From document upload to website embedding — all in one platform.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Upload,
                title: "Upload Documents",
                desc: "Support for PDF, DOCX, and TXT files. Drag-and-drop interface with automatic text extraction and indexing.",
              },
              {
                icon: MessageSquare,
                title: "AI-Powered Answers",
                desc: "Powered by Mistral AI. Retrieves relevant sections from your documents and generates accurate answers.",
              },
              {
                icon: Globe,
                title: "Embed Anywhere",
                desc: "Add the chatbot to your website with a single iframe or script tag. Customize the widget to match your brand.",
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className="animate-fade-up group rounded-xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-black transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Simple pricing</h2>
          <p className="mx-auto mt-4 mb-12 max-w-xl text-center text-gray-600">
            Start free, scale as you grow. No credit card required.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                desc: "Perfect for getting started",
                features: ["1 chatbot", "5 documents", "50 messages / month", "Basic embedding"],
                cta: "Get Started",
                href: "/signup",
              },
              {
                name: "Pro",
                price: "$19",
                desc: "For growing businesses",
                features: ["5 chatbots", "50 documents", "500 messages / month", "Custom branding", "Priority support"],
                cta: "Subscribe",
                href: "/api/create-checkout-session?plan=pro",
                popular: true,
              },
              {
                name: "Business",
                price: "Custom",
                desc: "For large teams",
                features: ["Unlimited chatbots", "Unlimited documents", "Unlimited messages", "Custom integration", "Dedicated support"],
                cta: "Contact Us",
                href: "mailto:sales@chatbotbuilder.com",
              },
            ].map((tier, i) => (
              <div
                key={tier.name}
                className={`animate-fade-up relative rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  tier.popular
                    ? "border-black shadow-xl"
                    : "hover:shadow-lg"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black px-3 py-1 text-xs text-white">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-1 text-3xl font-bold">{tier.price}</p>
                <p className="mt-1 text-sm text-gray-500">{tier.desc}</p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.href}
                  className={`mt-8 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                    tier.popular
                      ? "bg-black text-white hover:bg-gray-800"
                      : "border text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ChatbotBuilder. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
